/**
 * AWS 자격 증명 및 설정 사용 예제
 * 
 * 이 파일은 AWS 관련 함수들의 사용법을 보여주는 예제입니다.
 * 실제 프로덕션 코드에서는 이 예제들을 참고하여 구현하세요.
 */

import {
  // 자격 증명 관련
  getAWSCredentials,
  getAWSRegion,
  getAWSConfig,
  refreshAWSCredentials,
  
  // 설정 관련
  getCurrentEnvironment,
  getEnvironmentConfig,
  initializeAmplify,
  getAWSServiceConfiguration,
  
  // 유틸리티 및 오류 처리
  getAWSCredentialsSafely,
  handleAWSError,
  checkAWSServiceHealth,
  collectDebugInfo,
  
  // 초기화
  initializeAWS,
  initializeAWSForDevelopment,
  initializeAWSForProduction,
  
  // 타입
  type AWSCredentials,
} from './index';

/**
 * 예제 1: 기본 AWS 자격 증명 가져오기
 */
export async function example1_BasicCredentials() {
  try {
    console.log('=== 예제 1: 기본 AWS 자격 증명 가져오기 ===');
    
    // 자격 증명 가져오기
    const credentials = await getAWSCredentials();
    console.log('자격 증명:', {
      accessKeyId: credentials.accessKeyId.substring(0, 8) + '...',
      hasSessionToken: !!credentials.sessionToken,
      expiration: credentials.expiration,
    });
    
    // 리전 가져오기
    const region = getAWSRegion();
    console.log('AWS 리전:', region);
    
  } catch (error) {
    console.error('오류:', handleAWSError(error));
  }
}

/**
 * 예제 2: 안전한 자격 증명 가져오기 (재시도 로직 포함)
 */
export async function example2_SafeCredentials() {
  try {
    console.log('=== 예제 2: 안전한 자격 증명 가져오기 ===');
    
    // 재시도 로직이 포함된 안전한 자격 증명 가져오기
    const credentials = await getAWSCredentialsSafely(3, 1000);
    console.log('안전하게 가져온 자격 증명:', {
      accessKeyId: credentials.accessKeyId.substring(0, 8) + '...',
      hasSessionToken: !!credentials.sessionToken,
    });
    
  } catch (error) {
    console.error('오류:', handleAWSError(error));
  }
}

/**
 * 예제 3: AWS 설정 가져오기
 */
export async function example3_AWSConfig() {
  try {
    console.log('=== 예제 3: AWS 설정 가져오기 ===');
    
    // 전체 AWS 설정 가져오기
    const config = await getAWSConfig();
    console.log('AWS 설정:', {
      region: config.region,
      userPoolId: config.userPoolId,
      userPoolClientId: config.userPoolClientId,
      hasCredentials: !!config.credentials,
    });
    
  } catch (error) {
    console.error('오류:', handleAWSError(error));
  }
}

/**
 * 예제 4: 환경별 설정 관리
 */
export async function example4_EnvironmentConfig() {
  try {
    console.log('=== 예제 4: 환경별 설정 관리 ===');
    
    // 현재 환경 확인
    const currentEnv = getCurrentEnvironment();
    console.log('현재 환경:', currentEnv);
    
    // 환경별 설정 가져오기
    const devConfig = await getEnvironmentConfig('development');
    const prodConfig = await getEnvironmentConfig('production');
    
    console.log('개발 환경 설정:', {
      region: devConfig.Auth.Cognito.region,
      hasUserPool: !!devConfig.Auth.Cognito.userPoolId,
    });
    
    console.log('프로덕션 환경 설정:', {
      region: prodConfig.Auth.Cognito.region,
      hasUserPool: !!prodConfig.Auth.Cognito.userPoolId,
      hasStorage: !!prodConfig.Storage,
    });
    
  } catch (error) {
    console.error('오류:', handleAWSError(error));
  }
}

/**
 * 예제 5: AWS 서비스별 설정
 */
export async function example5_ServiceConfig() {
  try {
    console.log('=== 예제 5: AWS 서비스별 설정 ===');
    
    // S3 서비스 설정
    const s3Config = await getAWSServiceConfiguration('s3', {
      maxRetries: 5,
      timeout: 60000,
    });
    console.log('S3 설정:', {
      region: s3Config.region,
      endpoint: s3Config.endpoint,
      maxRetries: s3Config.maxRetries,
    });
    
    // DynamoDB 서비스 설정
    const dynamoConfig = await getAWSServiceConfiguration('dynamodb');
    console.log('DynamoDB 설정:', {
      region: dynamoConfig.region,
      endpoint: dynamoConfig.endpoint,
    });
    
  } catch (error) {
    console.error('오류:', handleAWSError(error));
  }
}

/**
 * 예제 6: AWS 초기화
 */
export async function example6_AWSInitialization() {
  try {
    console.log('=== 예제 6: AWS 초기화 ===');
    
    // 기본 초기화
    const success = await initializeAWS({
      environment: 'development',
      validateConfig: true,
      checkHealth: true,
      onSuccess: () => console.log('초기화 성공!'),
      onError: (error) => console.error('초기화 실패:', error.message),
    });
    
    console.log('초기화 결과:', success);
    
  } catch (error) {
    console.error('오류:', handleAWSError(error));
  }
}

/**
 * 예제 7: 자격 증명 새로고침
 */
export async function example7_RefreshCredentials() {
  try {
    console.log('=== 예제 7: 자격 증명 새로고침 ===');
    
    // 자격 증명 새로고침
    const newCredentials = await refreshAWSCredentials();
    console.log('새로고침된 자격 증명:', {
      accessKeyId: newCredentials.accessKeyId.substring(0, 8) + '...',
      hasSessionToken: !!newCredentials.sessionToken,
      expiration: newCredentials.expiration,
    });
    
  } catch (error) {
    console.error('오류:', handleAWSError(error));
  }
}

/**
 * 예제 8: 서비스 상태 확인
 */
export async function example8_ServiceHealth() {
  try {
    console.log('=== 예제 8: 서비스 상태 확인 ===');
    
    // AWS 서비스 상태 확인
    const isHealthy = await checkAWSServiceHealth();
    console.log('AWS 서비스 상태:', isHealthy ? '정상' : '비정상');
    
    // 디버그 정보 수집
    const debugInfo = await collectDebugInfo();
    console.log('디버그 정보:', debugInfo);
    
  } catch (error) {
    console.error('오류:', handleAWSError(error));
  }
}

/**
 * 예제 9: React 컴포넌트에서 사용하기
 */
export function example9_ReactComponent() {
  console.log('=== 예제 9: React 컴포넌트에서 사용하기 ===');
  
  // React 컴포넌트에서 사용할 수 있는 훅 예제
  const useAWSCredentials = () => {
  const [credentials, setCredentials] = React.useState<AWSCredentials | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
    
    React.useEffect(() => {
      const fetchCredentials = async () => {
        try {
          setLoading(true);
          const creds = await getAWSCredentialsSafely();
          setCredentials(creds);
          setError(null);
        } catch (err) {
          setError(handleAWSError(err));
        } finally {
          setLoading(false);
        }
      };
      
      fetchCredentials();
    }, []);
    
    return { credentials, loading, error };
  };
  
  console.log('React 훅 예제가 준비되었습니다.');
}

/**
 * 예제 10: 오류 처리 및 로깅
 */
export async function example10_ErrorHandling() {
  try {
    console.log('=== 예제 10: 오류 처리 및 로깅 ===');
    
    // 의도적으로 오류를 발생시키는 예제
    try {
      // 잘못된 설정으로 초기화 시도
      await initializeAWS({
        environment: 'invalid' as any,
        validateConfig: true,
      });
    } catch (error) {
      const userFriendlyMessage = handleAWSError(error);
      console.log('사용자 친화적 오류 메시지:', userFriendlyMessage);
    }
    
  } catch (error) {
    console.error('오류:', handleAWSError(error));
  }
}

/**
 * 모든 예제 실행
 */
export async function runAllExamples() {
  console.log('🚀 AWS 자격 증명 및 설정 예제를 시작합니다...\n');
  
  const examples = [
    example1_BasicCredentials,
    example2_SafeCredentials,
    example3_AWSConfig,
    example4_EnvironmentConfig,
    example5_ServiceConfig,
    example6_AWSInitialization,
    example7_RefreshCredentials,
    example8_ServiceHealth,
    example9_ReactComponent,
    example10_ErrorHandling,
  ];
  
  for (const example of examples) {
    try {
      await example();
      console.log('✅ 완료\n');
    } catch (error) {
      console.error('❌ 실패:', handleAWSError(error), '\n');
    }
  }
  
  console.log('🎉 모든 예제가 완료되었습니다!');
}

// React import (예제 9에서 사용)
import React from 'react';
