import { fetchAuthSession } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import outputs from '../amplify_outputs.json';

/**
 * AWS 자격 증명 정보를 나타내는 인터페이스
 */
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: Date;
}

/**
 * AWS 설정 정보를 나타내는 인터페이스
 */
export interface AWSConfig {
  region: string;
  credentials: AWSCredentials;
  userPoolId?: string;
  userPoolClientId?: string;
  identityPoolId?: string;
}

/**
 * AWS 자격 증명을 가져오는 함수
 * @returns Promise<AWSCredentials> - AWS 자격 증명 정보
 * @throws Error - 자격 증명을 가져올 수 없는 경우
 */
export async function getAWSCredentials(): Promise<AWSCredentials> {
  try {
    console.log('fetchAuthSession 호출 시작...');
    const session = await fetchAuthSession({ forceRefresh: true });
    console.log('fetchAuthSession 응답:', {
      hasCredentials: !!session.credentials,
      hasIdentityId: !!session.identityId,
      hasTokens: !!session.tokens,
      credentials: session.credentials ? {
        accessKeyId: session.credentials.accessKeyId,
        hasSecretAccessKey: !!session.credentials.secretAccessKey,
        hasSessionToken: !!session.credentials.sessionToken,
        expiration: session.credentials.expiration
      } : null
    });
    
    if (session.credentials) {
      // 인증된 사용자의 자격 증명 사용
      const credentials = session.credentials;
      return {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
        expiration: credentials.expiration ? new Date(credentials.expiration) : undefined,
      };
    } else {
      // 인증되지 않은 사용자의 경우 Cognito Identity Pool 사용
      console.log('인증되지 않은 사용자 - Cognito Identity Pool 사용');
      return await getUnauthenticatedCredentials();
    }
  } catch (error) {
    console.error('fetchAuthSession 실패, Cognito Identity Pool 사용:', error);
    return await getUnauthenticatedCredentials();
  }
}

/**
 * 인증되지 않은 사용자를 위한 자격 증명 가져오기
 */
async function getUnauthenticatedCredentials(): Promise<AWSCredentials> {
  try {
    // amplify_outputs.json에서 직접 설정 가져오기
    const identityPoolId = outputs.auth.identity_pool_id;
    const region = outputs.auth.aws_region;
    
    if (!identityPoolId) {
      console.error('Identity Pool ID를 찾을 수 없습니다. amplify_outputs.json을 확인하세요.');
      throw new Error('Identity Pool ID를 찾을 수 없습니다.');
    }
    
    console.log('Cognito Identity Pool 사용:', { identityPoolId, region });
    
    const cognitoIdentityClient = new CognitoIdentityClient({ region });
    const cognitoCredentials = fromCognitoIdentityPool({
      client: cognitoIdentityClient,
      identityPoolId: identityPoolId,
      logins: {},
    });
    
    // 자격 증명을 실제로 가져오기
    const credentials = await cognitoCredentials();
    
    return {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      expiration: credentials.expiration ? new Date(credentials.expiration) : undefined,
    };
  } catch (error) {
    console.error('Cognito Identity Pool 자격 증명 가져오기 실패:', error);
    throw new Error(`인증되지 않은 사용자 자격 증명을 가져오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 현재 AWS 리전을 가져오는 함수
 * @returns string - AWS 리전
 */
export function getAWSRegion(): string {
  try {
    const config = Amplify.getConfig();
    
    // Cognito 설정에서 리전 가져오기
    const cognitoRegion = config.Auth?.Cognito && 'region' in config.Auth.Cognito 
      ? (config.Auth.Cognito.region as string)
      : undefined;
    if (cognitoRegion) return cognitoRegion;
    
    // GraphQL 설정에서 리전 가져오기
    if (config.API?.GraphQL?.region) return config.API.GraphQL.region;
    
    // 기본값 반환
    return 'us-west-2';
  } catch (error) {
    console.warn('AWS 리전을 가져올 수 없습니다. 기본값을 사용합니다:', error);
    return 'us-west-2';
  }
}

/**
 * AWS 설정 정보를 가져오는 함수
 * @returns Promise<AWSConfig> - AWS 설정 정보
 */
export async function getAWSConfig(): Promise<AWSConfig> {
  try {
    const credentials = await getAWSCredentials();
    const region = getAWSRegion();
    const amplifyConfig = Amplify.getConfig();

    return {
      region,
      credentials,
      userPoolId: amplifyConfig.Auth?.Cognito?.userPoolId,
      userPoolClientId: amplifyConfig.Auth?.Cognito?.userPoolClientId,
      identityPoolId: amplifyConfig.Auth?.Cognito?.identityPoolId,
    };
  } catch (error) {
    console.error('AWS 설정 가져오기 실패:', error);
    throw new Error(`AWS 설정을 가져오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * AWS 자격 증명이 유효한지 확인하는 함수
 * @param credentials - 확인할 자격 증명
 * @returns boolean - 유효성 여부
 */
export function validateCredentials(credentials: AWSCredentials): boolean {
  if (!credentials.accessKeyId || !credentials.secretAccessKey) {
    return false;
  }

  // 만료 시간 확인
  if (credentials.expiration && credentials.expiration <= new Date()) {
    return false;
  }

  return true;
}

/**
 * AWS 자격 증명이 만료되었는지 확인하는 함수
 * @param credentials - 확인할 자격 증명
 * @returns boolean - 만료 여부
 */
export function isCredentialsExpired(credentials: AWSCredentials): boolean {
  if (!credentials.expiration) {
    return false; // 만료 시간이 없으면 만료되지 않은 것으로 간주
  }
  
  return credentials.expiration <= new Date();
}

/**
 * AWS 자격 증명을 새로고침하는 함수
 * @returns Promise<AWSCredentials> - 새로고침된 자격 증명
 */
export async function refreshAWSCredentials(): Promise<AWSCredentials> {
  try {
    // Amplify의 fetchAuthSession은 자동으로 자격 증명을 새로고침합니다
    return await getAWSCredentials();
  } catch (error) {
    console.error('AWS 자격 증명 새로고침 실패:', error);
    throw new Error(`AWS 자격 증명을 새로고침하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * AWS 서비스별 설정을 가져오는 함수
 * @param serviceName - AWS 서비스 이름 (예: 's3', 'dynamodb', 'lambda')
 * @returns Promise<object> - 서비스별 설정
 */
export async function getAWSServiceConfig(serviceName: string): Promise<object> {
  try {
    const config = await getAWSConfig();
    
    return {
      region: config.region,
      credentials: config.credentials,
      service: serviceName,
    };
  } catch (error) {
    console.error(`AWS ${serviceName} 서비스 설정 가져오기 실패:`, error);
    throw new Error(`AWS ${serviceName} 서비스 설정을 가져오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 현재 사용자의 Cognito 사용자 풀 정보를 가져오는 함수
 * @returns object - Cognito 사용자 풀 정보
 */
export function getCognitoUserPoolInfo(): { userPoolId?: string; userPoolClientId?: string; region?: string } {
  try {
    const config = Amplify.getConfig();
    
    if (config?.Auth?.Cognito) {
      // Cognito 설정에서 리전 가져오기
      const cognitoRegion = 'region' in config.Auth.Cognito 
        ? (config.Auth.Cognito.region as string)
        : undefined;
      
      return {
        userPoolId: 'userPoolId' in config.Auth.Cognito 
          ? (config.Auth.Cognito.userPoolId as string)
          : undefined,
        userPoolClientId: 'userPoolClientId' in config.Auth.Cognito 
          ? (config.Auth.Cognito.userPoolClientId as string)
          : undefined,
        region: cognitoRegion || 'us-east-1',
      };
    }
  } catch (error) {
    console.warn('Amplify 설정에서 Cognito 정보를 가져올 수 없습니다:', error);
  }

  return {};
}

/**
 * GraphQL API 엔드포인트 정보를 가져오는 함수
 * @returns object - GraphQL API 정보
 */
export function getGraphQLAPIInfo(): { endpoint?: string; region?: string; defaultAuthMode?: string } {
  try {
    const config = Amplify.getConfig();
    
    if (config?.API?.GraphQL) {
      return {
        endpoint: config.API.GraphQL.endpoint,
        region: config.API.GraphQL.region,
        defaultAuthMode: config.API.GraphQL.defaultAuthMode,
      };
    }
  } catch (error) {
    console.warn('Amplify 설정에서 GraphQL API 정보를 가져올 수 없습니다:', error);
  }

  return {};
}
