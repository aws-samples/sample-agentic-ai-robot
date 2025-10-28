import { AWSCredentials, AWSConfig } from './aws-credentials';
import { AmplifyConfiguration } from './aws-config';

/**
 * AWS 관련 오류 타입
 */
export class AWSCredentialsError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AWSCredentialsError';
  }
}

export class AWSConfigurationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AWSConfigurationError';
  }
}

export class AWSValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'AWSValidationError';
  }
}

/**
 * AWS 자격 증명을 안전하게 가져오는 함수 (재시도 로직 포함)
 * @param maxRetries - 최대 재시도 횟수 (기본값: 3)
 * @param retryDelay - 재시도 간격 (밀리초, 기본값: 1000)
 * @returns Promise<AWSCredentials> - AWS 자격 증명
 */
export async function getAWSCredentialsSafely(
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<AWSCredentials> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { getAWSCredentials } = await import('./aws-credentials');
      const credentials = await getAWSCredentials();
      
      if (validateCredentials(credentials)) {
        return credentials;
      } else {
        throw new AWSCredentialsError('유효하지 않은 자격 증명입니다.');
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('알 수 없는 오류');
      
      if (attempt < maxRetries) {
        console.warn(`자격 증명 가져오기 시도 ${attempt}/${maxRetries} 실패, ${retryDelay}ms 후 재시도...`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // 지수 백오프
      }
    }
  }
  
  throw new AWSCredentialsError(
    `자격 증명을 가져오는 데 실패했습니다 (${maxRetries}회 시도): ${lastError?.message}`,
    'CREDENTIALS_FETCH_FAILED'
  );
}

/**
 * AWS 자격 증명을 검증하는 함수
 * @param credentials - 검증할 자격 증명
 * @returns boolean - 유효성 여부
 * @throws AWSValidationError - 유효하지 않은 경우
 */
export function validateCredentials(credentials: AWSCredentials): boolean {
  if (!credentials) {
    throw new AWSValidationError('자격 증명이 제공되지 않았습니다.', 'credentials');
  }

  if (!credentials.accessKeyId || typeof credentials.accessKeyId !== 'string') {
    throw new AWSValidationError('유효하지 않은 Access Key ID입니다.', 'accessKeyId');
  }

  if (!credentials.secretAccessKey || typeof credentials.secretAccessKey !== 'string') {
    throw new AWSValidationError('유효하지 않은 Secret Access Key입니다.', 'secretAccessKey');
  }

  // Access Key ID 형식 검증 (AKIA로 시작하는 20자리 문자열)
  if (!/^AKIA[0-9A-Z]{16}$/.test(credentials.accessKeyId)) {
    throw new AWSValidationError('Access Key ID 형식이 올바르지 않습니다.', 'accessKeyId');
  }

  // Secret Access Key 형식 검증 (40자리 문자열)
  if (!/^[A-Za-z0-9/+=]{40}$/.test(credentials.secretAccessKey)) {
    throw new AWSValidationError('Secret Access Key 형식이 올바르지 않습니다.', 'secretAccessKey');
  }

  // 만료 시간 검증
  if (credentials.expiration && credentials.expiration <= new Date()) {
    throw new AWSValidationError('자격 증명이 만료되었습니다.', 'expiration');
  }

  return true;
}

/**
 * AWS 설정을 검증하는 함수
 * @param config - 검증할 설정
 * @returns boolean - 유효성 여부
 * @throws AWSValidationError - 유효하지 않은 경우
 */
export function validateAWSConfig(config: AWSConfig): boolean {
  if (!config) {
    throw new AWSValidationError('AWS 설정이 제공되지 않았습니다.', 'config');
  }

  if (!config.region || typeof config.region !== 'string') {
    throw new AWSValidationError('유효하지 않은 AWS 리전입니다.', 'region');
  }

  // AWS 리전 형식 검증
  if (!/^[a-z0-9-]+$/.test(config.region)) {
    throw new AWSValidationError('AWS 리전 형식이 올바르지 않습니다.', 'region');
  }

  // 자격 증명 검증
  validateCredentials(config.credentials);

  return true;
}

/**
 * Amplify 설정을 검증하는 함수
 * @param config - 검증할 Amplify 설정
 * @returns boolean - 유효성 여부
 * @throws AWSValidationError - 유효하지 않은 경우
 */
export function validateAmplifyConfig(config: AmplifyConfiguration): boolean {
  if (!config) {
    throw new AWSValidationError('Amplify 설정이 제공되지 않았습니다.', 'config');
  }

  if (!config.Auth?.Cognito?.userPoolId) {
    throw new AWSValidationError('User Pool ID가 필요합니다.', 'userPoolId');
  }

  if (!config.Auth?.Cognito?.userPoolClientId) {
    throw new AWSValidationError('User Pool Client ID가 필요합니다.', 'userPoolClientId');
  }

  if (!config.API?.GraphQL?.endpoint) {
    throw new AWSValidationError('GraphQL 엔드포인트가 필요합니다.', 'endpoint');
  }

  // GraphQL 엔드포인트 URL 형식 검증
  try {
    new URL(config.API.GraphQL.endpoint);
  } catch {
    throw new AWSValidationError('유효하지 않은 GraphQL 엔드포인트 URL입니다.', 'endpoint');
  }

  return true;
}

/**
 * 오류를 처리하고 사용자 친화적인 메시지를 반환하는 함수
 * @param error - 처리할 오류
 * @returns string - 사용자 친화적인 오류 메시지
 */
export function handleAWSError(error: unknown): string {
  if (error instanceof AWSCredentialsError) {
    switch (error.code) {
      case 'CREDENTIALS_FETCH_FAILED':
        return 'AWS 자격 증명을 가져올 수 없습니다. 로그인 상태를 확인해주세요.';
      case 'CREDENTIALS_EXPIRED':
        return 'AWS 자격 증명이 만료되었습니다. 다시 로그인해주세요.';
      default:
        return `자격 증명 오류: ${error.message}`;
    }
  }

  if (error instanceof AWSConfigurationError) {
    return `설정 오류: ${error.message}`;
  }

  if (error instanceof AWSValidationError) {
    return `입력 오류: ${error.message}`;
  }

  if (error instanceof Error) {
    return `오류가 발생했습니다: ${error.message}`;
  }

  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * AWS 자격 증명을 안전하게 새로고침하는 함수
 * @param maxRetries - 최대 재시도 횟수
 * @returns Promise<AWSCredentials> - 새로고침된 자격 증명
 */
export async function refreshCredentialsSafely(maxRetries: number = 3): Promise<AWSCredentials> {
  try {
    const { refreshAWSCredentials } = await import('./aws-credentials');
    return await refreshAWSCredentials();
  } catch (error) {
    console.error('자격 증명 새로고침 실패:', error);
    
    // 재시도 로직
    for (let attempt = 1; attempt < maxRetries; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        const { refreshAWSCredentials } = await import('./aws-credentials');
        return await refreshAWSCredentials();
      } catch (retryError) {
        console.warn(`자격 증명 새로고침 재시도 ${attempt}/${maxRetries - 1} 실패:`, retryError);
      }
    }
    
    throw new AWSCredentialsError(
      `자격 증명 새로고침에 실패했습니다 (${maxRetries}회 시도)`,
      'REFRESH_FAILED'
    );
  }
}

/**
 * AWS 설정을 안전하게 가져오는 함수
 * @returns Promise<AWSConfig | null> - AWS 설정 또는 null
 */
export async function getAWSConfigSafely(): Promise<AWSConfig | null> {
  try {
    const { getAWSConfig } = await import('./aws-credentials');
    const config = await getAWSConfig();
    
    if (validateAWSConfig(config)) {
      return config;
    }
    
    return null;
  } catch (error) {
    console.error('AWS 설정 가져오기 실패:', error);
    return null;
  }
}

/**
 * AWS 서비스 상태를 확인하는 함수
 * @returns Promise<boolean> - 서비스 상태
 */
export async function checkAWSServiceHealth(): Promise<boolean> {
  try {
    const credentials = await getAWSCredentialsSafely(1);
    return validateCredentials(credentials);
  } catch (error) {
    console.error('AWS 서비스 상태 확인 실패:', error);
    return false;
  }
}

/**
 * 디버그 정보를 수집하는 함수
 * @returns Promise<object> - 디버그 정보
 */
export async function collectDebugInfo(): Promise<object> {
  try {
    const { getCurrentEnvironment } = require('./aws-config');
    const { getAWSRegion } = await import('./aws-credentials');
    
    return {
      environment: getCurrentEnvironment(),
      region: getAWSRegion(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      hasCredentials: await checkAWSServiceHealth(),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString(),
    };
  }
}
