import { Amplify } from 'aws-amplify';
import { getAWSCredentials, getAWSRegion, AWSCredentials, AWSConfig } from './aws-credentials';
import { getEnvVar } from './env-config';
/**
 * 환경별 AWS 설정 타입
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * AWS 서비스 설정을 나타내는 인터페이스
 */
export interface AWSServiceConfig {
  region: string;
  credentials: AWSCredentials;
  endpoint?: string;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Amplify 설정을 나타내는 인터페이스
 */
export interface AmplifyConfiguration {
  Auth: {
    Cognito: {
      userPoolId: string;
      userPoolClientId: string;
      region: string;
      identityPoolId?: string;
      loginWith: {
        oauth?: {
          domain: string;
          scopes: string[];
          redirectSignIn: string[];
          redirectSignOut: string[];
          responseType: string;
        };
        email: boolean;
        username?: boolean;
      };
    };
  };
  API: {
    GraphQL: {
      endpoint: string;
      region: string;
      defaultAuthMode: string;
    };
  };
  Storage?: {
    S3: {
      bucket: string;
      region: string;
    };
  };
}

/**
 * 현재 환경을 감지하는 함수
 * @returns Environment - 현재 환경
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return 'production';
  } else if (env === 'staging') {
    return 'staging';
  }
  
  return 'development';
}

/**
 * 환경별 AWS 설정을 가져오는 함수
 * @param environment - 환경 (기본값: 현재 환경)
 * @returns Promise<AmplifyConfiguration> - 환경별 설정
 */
export async function getEnvironmentConfig(environment: Environment = getCurrentEnvironment()): Promise<AmplifyConfiguration> {
  const baseConfig = {
    Auth: {
      Cognito: {
        userPoolId: await getEnvVar('REACT_APP_USER_POOL_ID', ''),
        userPoolClientId: await getEnvVar('REACT_APP_USER_POOL_CLIENT_ID', ''),
        region: await getEnvVar('REACT_APP_AWS_REGION', 'us-east-1'),
        identityPoolId: await getEnvVar('REACT_APP_IDENTITY_POOL_ID', ''),
        loginWith: {
          oauth: {
            domain: await getEnvVar('REACT_APP_OAUTH_DOMAIN', ''),
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: [await getEnvVar('REACT_APP_REDIRECT_SIGN_IN', 'http://localhost:3000/')],
            redirectSignOut: [await getEnvVar('REACT_APP_REDIRECT_SIGN_OUT', 'http://localhost:3000/')],
            responseType: 'code'
          },
          email: true,
          username: true
        }
      }
    },
    API: {
      GraphQL: {
        endpoint: await getEnvVar('REACT_APP_GRAPHQL_ENDPOINT', ''),
        region: await getEnvVar('REACT_APP_AWS_REGION', 'us-east-1'),
        defaultAuthMode: 'userPool'
      }
    }
  };

  // 환경별 추가 설정
  if (environment === 'production') {
    return {
      ...baseConfig,
      Storage: {
        S3: {
          bucket: await getEnvVar('REACT_APP_S3_BUCKET', ''),
          region: await getEnvVar('REACT_APP_AWS_REGION', 'us-east-1')
        }
      }
    };
  }

  return baseConfig;
}

/**
 * Amplify를 초기화하는 함수
 * @param environment - 환경 (기본값: 현재 환경)
 * @returns Promise<void>
 */
export async function initializeAmplify(environment: Environment = getCurrentEnvironment()): Promise<void> {
  try {
    // Amplify Gen 2에서는 amplify_outputs.json을 동적으로 로드
    fetch('/amplify_outputs.json')
      .then(response => response.json())
      .then(outputs => {
        Amplify.configure(outputs);
        console.log(`Amplify가 ${environment} 환경으로 초기화되었습니다.`);
      })
      .catch(async error => {
        console.error('Amplify 설정 로드 실패:', error);
        // 폴백으로 환경 변수 기반 설정 사용
        const config = await getEnvironmentConfig(environment);
        Amplify.configure(config as any);
        console.log(`Amplify가 ${environment} 환경으로 초기화되었습니다 (폴백 설정).`);
      });
  } catch (error) {
    console.error('Amplify 초기화 실패:', error);
    throw new Error(`Amplify 초기화 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 현재 Amplify 설정을 가져오는 함수
 * @returns AmplifyConfiguration | null - 현재 설정 또는 null
 */
export function getCurrentAmplifyConfig(): AmplifyConfiguration | null {
  try {
    return Amplify.getConfig() as AmplifyConfiguration;
  } catch (error) {
    console.error('현재 Amplify 설정 가져오기 실패:', error);
    return null;
  }
}

/**
 * 특정 AWS 서비스에 대한 설정을 가져오는 함수
 * @param serviceName - AWS 서비스 이름
 * @param customConfig - 추가 설정 (선택사항)
 * @returns Promise<AWSServiceConfig> - 서비스 설정
 */
export async function getAWSServiceConfiguration(
  serviceName: string, 
  customConfig: Partial<AWSServiceConfig> = {}
): Promise<AWSServiceConfig> {
  try {
    const credentials = await getAWSCredentials();
    const region = getAWSRegion();
    
    const defaultConfig: AWSServiceConfig = {
      region,
      credentials,
      maxRetries: 3,
      timeout: 30000,
    };

    // 서비스별 기본 엔드포인트 설정
    if (serviceName === 's3') {
      defaultConfig.endpoint = `https://s3.${region}.amazonaws.com`;
    } else if (serviceName === 'dynamodb') {
      defaultConfig.endpoint = `https://dynamodb.${region}.amazonaws.com`;
    } else if (serviceName === 'lambda') {
      defaultConfig.endpoint = `https://lambda.${region}.amazonaws.com`;
    }

    return {
      ...defaultConfig,
      ...customConfig,
    };
  } catch (error) {
    console.error(`AWS ${serviceName} 서비스 설정 가져오기 실패:`, error);
    throw new Error(`AWS ${serviceName} 서비스 설정을 가져오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 환경 변수에서 AWS 설정을 검증하는 함수
 * @returns Promise<boolean> - 설정 유효성
 */
export async function validateEnvironmentVariables(): Promise<boolean> {
  const requiredVars = [
    'REACT_APP_USER_POOL_ID',
    'REACT_APP_USER_POOL_CLIENT_ID',
    'REACT_APP_AWS_REGION',
    'REACT_APP_GRAPHQL_ENDPOINT'
  ];

  const { validateRequiredEnvVars } = await import('./env-config');
  return await validateRequiredEnvVars(requiredVars);
}

/**
 * AWS 설정을 콘솔에 출력하는 함수 (디버깅용)
 * @param includeCredentials - 자격 증명 포함 여부 (기본값: false)
 */
export async function logAWSConfiguration(includeCredentials: boolean = false): Promise<void> {
  try {
    const config = getCurrentAmplifyConfig();
    const region = getAWSRegion();
    
    console.log('=== AWS 설정 정보 ===');
    console.log('환경:', getCurrentEnvironment());
    console.log('리전:', region);
    
    if (config) {
      console.log('User Pool ID:', config.Auth.Cognito.userPoolId);
      console.log('User Pool Client ID:', config.Auth.Cognito.userPoolClientId);
      console.log('GraphQL Endpoint:', config.API.GraphQL.endpoint);
      
      if (includeCredentials) {
        const credentials = await getAWSCredentials();
        console.log('자격 증명:', {
          accessKeyId: credentials.accessKeyId.substring(0, 8) + '...',
          hasSessionToken: !!credentials.sessionToken,
          expiration: credentials.expiration
        });
      }
    }
    
    console.log('==================');
  } catch (error) {
    console.error('AWS 설정 로깅 실패:', error);
  }
}

/**
 * 설정을 다시 로드하는 함수
 * @param environment - 환경 (기본값: 현재 환경)
 */
export async function reloadConfiguration(environment: Environment = getCurrentEnvironment()): Promise<void> {
  try {
    await initializeAmplify(environment);
    console.log('AWS 설정이 다시 로드되었습니다.');
  } catch (error) {
    console.error('설정 다시 로드 실패:', error);
    throw error;
  }
}
