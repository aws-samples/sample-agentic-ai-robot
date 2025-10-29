import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { getPresignedUrlWithCache } from '../lib/image-utils';

interface S3ImageProps {
    s3Url: string;
    alt?: string;
    style?: React.CSSProperties;
    onError?: () => void;
}

/**
 * S3 URL을 presigned URL로 변환하여 이미지를 렌더링하는 컴포넌트
 */
export function S3Image({ s3Url, alt = 'Image', style, onError }: S3ImageProps) {
    const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadImage() {
            try {
                console.log('🔄 S3Image: 이미지 로드 시작:', s3Url);
                setLoading(true);
                setError(null);

                const url = await getPresignedUrlWithCache(s3Url);
                console.log('✅ S3Image: Presigned URL 획득 성공:', url);

                if (isMounted) {
                    setPresignedUrl(url);
                    setLoading(false);
                }
            } catch (err) {
                console.error('❌ S3Image: 이미지 로드 실패:', {
                    s3Url,
                    error: err,
                });
                if (isMounted) {
                    setError(err instanceof Error ? err.message : '이미지를 불러올 수 없습니다');
                    setLoading(false);
                    onError?.();
                }
            }
        }

        loadImage();

        return () => {
            isMounted = false;
        };
    }, [s3Url, onError]);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '200px',
                }}
            >
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 1 }}>
                {error}
            </Alert>
        );
    }

    if (!presignedUrl) {
        return null;
    }

    return (
        <img
            src={presignedUrl}
            alt={alt}
            style={{
                width: '100%',
                maxHeight: '400px',
                display: 'block',
                objectFit: 'contain',
                ...style,
            }}
            onLoad={() => {
                console.log('✅ S3Image: 이미지 렌더링 성공:', presignedUrl);
            }}
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.error('❌ S3Image: 이미지 렌더링 실패:', {
                    presignedUrl,
                    error: e,
                });
                target.style.display = 'none';
                setError('이미지를 표시할 수 없습니다');
                onError?.();
            }}
        />
    );
}
