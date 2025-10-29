import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAWSCredentials, getAWSRegion } from './aws-credentials';

/**
 * S3 URL 파싱 결과
 */
export interface S3Location {
    bucket: string;
    key: string;
    region: string;
}

/**
 * 이미지 타입
 */
export type ImageType = 'detected' | 'gestures' | 'unknown';

/**
 * S3 URL을 파싱하여 버킷과 키 정보 추출
 * @param s3Url - S3 URL (예: s3://bucket-name/path/to/file.jpg)
 * @returns S3Location 객체
 */
export function parseS3Url(s3Url: string): S3Location {
    const region = getAWSRegion();

    // s3://bucket-name/path/to/file.jpg 형식
    if (s3Url.startsWith('s3://')) {
        const parts = s3Url.replace('s3://', '').split('/');
        const bucket = parts[0];
        const key = parts.slice(1).join('/');
        return { bucket, key, region };
    }

    // https://bucket-name.s3.region.amazonaws.com/path/to/file.jpg 형식
    if (s3Url.startsWith('http')) {
        const url = new URL(s3Url);
        const bucket = url.hostname.split('.')[0];
        const key = url.pathname.substring(1); // Remove leading /
        return { bucket, key, region };
    }

    throw new Error(`Invalid S3 URL format: ${s3Url}`);
}

/**
 * S3 URL에서 이미지 타입 감지
 * @param s3Url - S3 URL
 * @returns ImageType
 */
export function detectImageType(s3Url: string): ImageType {
    if (s3Url.includes('/detected/')) {
        return 'detected';
    }
    if (s3Url.includes('/gestures/')) {
        return 'gestures';
    }
    return 'unknown';
}

/**
 * S3 객체에 대한 presigned URL 생성
 * @param s3Url - S3 URL
 * @param expiresIn - 만료 시간 (초 단위, 기본값: 3600 = 1시간)
 * @returns presigned URL
 */
export async function createPresignedUrl(
    s3Url: string,
    expiresIn: number = 3600
): Promise<string> {
    try {
        const { bucket, key } = parseS3Url(s3Url);
        const credentials = await getAWSCredentials();

        // S3 버킷 리전을 명시적으로 지정 (industry-robot-detected-images는 서울 리전)
        const s3Region = 'ap-northeast-2';

        const s3Client = new S3Client({
            region: s3Region,
            credentials,
        });

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, {
            expiresIn,
        });

        console.log('✅ Presigned URL 생성 성공:', {
            s3Url,
            bucket,
            key,
            region: s3Region,
            imageType: detectImageType(s3Url),
            expiresIn,
            presignedUrl,
        });

        return presignedUrl;
    } catch (error) {
        console.error('Presigned URL 생성 실패:', error);
        throw new Error(
            `이미지 URL 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'
            }`
        );
    }
}

/**
 * 여러 S3 URL에 대한 presigned URL을 일괄 생성
 * @param s3Urls - S3 URL 배열
 * @param expiresIn - 만료 시간 (초 단위, 기본값: 3600)
 * @returns presigned URL 배열
 */
export async function createPresignedUrls(
    s3Urls: string[],
    expiresIn: number = 3600
): Promise<string[]> {
    try {
        const promises = s3Urls.map((url) => createPresignedUrl(url, expiresIn));
        return await Promise.all(promises);
    } catch (error) {
        console.error('일괄 Presigned URL 생성 실패:', error);
        throw error;
    }
}

/**
 * S3 URL이 유효한지 검증
 * @param url - 검증할 URL
 * @returns 유효성 여부
 */
export function isValidS3Url(url: string): boolean {
    if (!url) return false;

    // s3:// 형식
    if (url.startsWith('s3://')) {
        const parts = url.replace('s3://', '').split('/');
        return parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0;
    }

    // https:// 형식
    if (url.startsWith('http')) {
        try {
            const urlObj = new URL(url);
            return (
                urlObj.hostname.includes('s3') &&
                urlObj.hostname.includes('amazonaws.com')
            );
        } catch {
            return false;
        }
    }

    return false;
}

/**
 * 이미지 URL을 캐싱하여 재사용
 */
class PresignedUrlCache {
    private cache: Map<string, { url: string; expiresAt: Date }> = new Map();

    /**
     * 캐시에서 URL 가져오기 (만료되지 않은 경우)
     */
    get(s3Url: string): string | null {
        const cached = this.cache.get(s3Url);
        if (!cached) return null;

        // 만료 5분 전에 캐시 무효화
        const now = new Date();
        const expiresAt = new Date(cached.expiresAt.getTime() - 5 * 60 * 1000);

        if (now >= expiresAt) {
            this.cache.delete(s3Url);
            return null;
        }

        return cached.url;
    }

    /**
     * 캐시에 URL 저장
     */
    set(s3Url: string, presignedUrl: string, expiresIn: number): void {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        this.cache.set(s3Url, { url: presignedUrl, expiresAt });
    }

    /**
     * 캐시 초기화
     */
    clear(): void {
        this.cache.clear();
    }
}

// 전역 캐시 인스턴스
const urlCache = new PresignedUrlCache();

/**
 * 캐시를 활용한 presigned URL 생성
 * @param s3Url - S3 URL
 * @param expiresIn - 만료 시간 (초 단위, 기본값: 3600)
 * @returns presigned URL
 */
export async function getPresignedUrlWithCache(
    s3Url: string,
    expiresIn: number = 3600
): Promise<string> {
    // 캐시 확인
    const cached = urlCache.get(s3Url);
    if (cached) {
        console.log('캐시된 Presigned URL 사용:', s3Url);
        return cached;
    }

    // 새로 생성
    const presignedUrl = await createPresignedUrl(s3Url, expiresIn);
    urlCache.set(s3Url, presignedUrl, expiresIn);

    return presignedUrl;
}

/**
 * 캐시 초기화 (필요시 사용)
 */
export function clearPresignedUrlCache(): void {
    urlCache.clear();
}
