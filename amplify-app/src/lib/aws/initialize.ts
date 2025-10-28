import { initializeAmplify, getCurrentEnvironment, validateEnvironmentVariables } from '../aws-config';
import { checkAWSServiceHealth, handleAWSError } from '../aws-utils';

/**
 * AWS 초기화 옵션
 */
export interface AWSInitializationOptions {
  environment?: 'development' | 'staging' | 'production';
  validateConfig?: boolean;
  checkHealth?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

/**
 * AWS를 초기화하는 기본 함수
 * @param options - 초기화 옵션
 * @returns Promise<boolean> - 초기화 성공 여부
 */
export default async function initializeAWS(options: AWSInitializationOptions = {}): Promise<boolean> {
  const {
    environment = getCurrentEnvironment(),
    validateConfig = true,
    checkHealth = true,
    onError,
    onSuccess,
  } = options;

  try {
    // 1. 환경 변수 검증
    if (validateConfig && !(await validateEnvironmentVariables())) {
      throw new Error('필수 환경 변수가 누락되었습니다.');
    }

    // 2. Amplify 초기화
    await initializeAmplify(environment);
    console.log(`AWS가 ${environment} 환경으로 초기화되었습니다.`);

    // 3. 서비스 상태 확인
    if (checkHealth) {
      const isHealthy = await checkAWSServiceHealth();
      if (!isHealthy) {
        throw new Error('AWS 서비스 상태를 확인할 수 없습니다.');
      }
      console.log('AWS 서비스 상태가 정상입니다.');
    }

    // 4. 성공 콜백 호출
    if (onSuccess) {
      onSuccess();
    }

    return true;
  } catch (error) {
    const errorMessage = handleAWSError(error);
    console.error('AWS 초기화 실패:', errorMessage);
    
    // 5. 오류 콜백 호출
    if (onError) {
      onError(error instanceof Error ? error : new Error(errorMessage));
    }

    return false;
  }
}

/**
 * 개발 환경용 AWS 초기화
 * @returns Promise<boolean> - 초기화 성공 여부
 */
export async function initializeAWSForDevelopment(): Promise<boolean> {
  return initializeAWS({
    environment: 'development',
    validateConfig: false, // 개발 환경에서는 환경 변수 검증을 건너뜀
    checkHealth: true,
    onError: (error) => {
      console.warn('개발 환경 AWS 초기화 경고:', error.message);
    },
    onSuccess: () => {
      console.log('개발 환경 AWS 초기화 완료');
    },
  });
}

/**
 * 프로덕션 환경용 AWS 초기화
 * @returns Promise<boolean> - 초기화 성공 여부
 */
export async function initializeAWSForProduction(): Promise<boolean> {
  return initializeAWS({
    environment: 'production',
    validateConfig: true,
    checkHealth: true,
    onError: (error) => {
      console.error('프로덕션 환경 AWS 초기화 실패:', error.message);
      // 프로덕션에서는 오류를 더 엄격하게 처리
      throw error;
    },
    onSuccess: () => {
      console.log('프로덕션 환경 AWS 초기화 완료');
    },
  });
}

/**
 * AWS 초기화 상태를 확인하는 함수
 * @returns boolean - 초기화 상태
 */
export function isAWSInitialized(): boolean {
  try {
    const { getCurrentAmplifyConfig } = require('../aws-config');
    const config = getCurrentAmplifyConfig();
    return config !== null;
  } catch {
    return false;
  }
}

/**
 * AWS를 재초기화하는 함수
 * @param options - 초기화 옵션
 * @returns Promise<boolean> - 재초기화 성공 여부
 */
export async function reinitializeAWS(options: AWSInitializationOptions = {}): Promise<boolean> {
  console.log('AWS 재초기화를 시작합니다...');
  return initializeAWS(options);
}
