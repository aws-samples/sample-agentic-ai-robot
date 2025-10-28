# AWS 자격 증명 및 설정 유틸리티

이 라이브러리는 AWS Amplify를 사용하여 AWS 자격 증명과 설정을 쉽게 관리할 수 있는 함수들을 제공합니다.

## 📁 파일 구조

```
src/lib/aws/
├── index.ts              # 모든 함수들을 export하는 메인 파일
├── initialize.ts         # AWS 초기화 관련 함수들
├── examples.ts           # 사용 예제들
└── README.md            # 이 문서

src/lib/
├── aws-credentials.ts    # AWS 자격 증명 관련 함수들
├── aws-config.ts         # AWS 설정 관련 함수들
├── aws-utils.ts          # 유틸리티 및 오류 처리 함수들
└── amplify.ts           # 기존 Amplify 설정 (업데이트됨)
```

## 🚀 빠른 시작

### 1. 기본 사용법

```typescript
import { 
  getAWSCredentials, 
  getAWSRegion, 
  initializeAWS 
} from './lib/aws';

// AWS 초기화
await initializeAWS();

// 자격 증명 가져오기
const credentials = await getAWSCredentials();
console.log('Access Key:', credentials.accessKeyId);

// 리전 가져오기
const region = getAWSRegion();
console.log('Region:', region);
```

### 2. 안전한 자격 증명 가져오기

```typescript
import { getAWSCredentialsSafely, handleAWSError } from './lib/aws';

try {
  // 재시도 로직이 포함된 안전한 자격 증명 가져오기
  const credentials = await getAWSCredentialsSafely(3, 1000);
  console.log('자격 증명:', credentials);
} catch (error) {
  console.error('오류:', handleAWSError(error));
}
```

## 📚 주요 함수들

### 자격 증명 관련

| 함수 | 설명 | 반환 타입 |
|------|------|-----------|
| `getAWSCredentials()` | AWS 자격 증명 가져오기 | `Promise<AWSCredentials>` |
| `getAWSRegion()` | 현재 AWS 리전 가져오기 | `string` |
| `getAWSConfig()` | 전체 AWS 설정 가져오기 | `Promise<AWSConfig>` |
| `refreshAWSCredentials()` | 자격 증명 새로고침 | `Promise<AWSCredentials>` |
| `validateCredentials()` | 자격 증명 유효성 검사 | `boolean` |

### 설정 관련

| 함수 | 설명 | 반환 타입 |
|------|------|-----------|
| `getCurrentEnvironment()` | 현재 환경 확인 | `Environment` |
| `getEnvironmentConfig()` | 환경별 설정 가져오기 | `AmplifyConfiguration` |
| `initializeAmplify()` | Amplify 초기화 | `void` |
| `getAWSServiceConfiguration()` | 서비스별 설정 가져오기 | `Promise<AWSServiceConfig>` |

### 유틸리티 및 오류 처리

| 함수 | 설명 | 반환 타입 |
|------|------|-----------|
| `getAWSCredentialsSafely()` | 안전한 자격 증명 가져오기 | `Promise<AWSCredentials>` |
| `handleAWSError()` | 오류 메시지 처리 | `string` |
| `checkAWSServiceHealth()` | 서비스 상태 확인 | `Promise<boolean>` |
| `collectDebugInfo()` | 디버그 정보 수집 | `Promise<object>` |

## 🔧 환경 변수 설정

### 필수 환경 변수

```bash
# AWS 자격 증명
REACT_APP_AWS_ACCESS_KEY_ID=your-access-key-id
REACT_APP_AWS_SECRET_ACCESS_KEY=your-secret-access-key
REACT_APP_AWS_REGION=us-east-1

# Cognito 설정
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_CLIENT_ID=your-user-pool-client-id
REACT_APP_IDENTITY_POOL_ID=your-identity-pool-id

# GraphQL API 설정
REACT_APP_GRAPHQL_ENDPOINT=https://your-api-id.appsync-api.us-east-1.amazonaws.com/graphql
REACT_APP_GRAPHQL_AUTH_MODE=userPool
```

### 선택적 환경 변수

```bash
# OAuth 설정
REACT_APP_OAUTH_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
REACT_APP_REDIRECT_SIGN_IN=http://localhost:3000/
REACT_APP_REDIRECT_SIGN_OUT=http://localhost:3000/

# S3 설정
REACT_APP_S3_BUCKET=your-s3-bucket
```

## 📖 사용 예제

### React 컴포넌트에서 사용하기

```typescript
import React, { useEffect, useState } from 'react';
import { getAWSCredentialsSafely, handleAWSError } from './lib/aws';

function MyComponent() {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <div>
      <h2>AWS 자격 증명</h2>
      <p>Access Key: {credentials?.accessKeyId?.substring(0, 8)}...</p>
      <p>Region: {credentials?.region}</p>
    </div>
  );
}
```

### AWS 서비스별 설정 사용하기

```typescript
import { getAWSServiceConfiguration } from './lib/aws';

// S3 설정
const s3Config = await getAWSServiceConfiguration('s3', {
  maxRetries: 5,
  timeout: 60000,
});

// DynamoDB 설정
const dynamoConfig = await getAWSServiceConfiguration('dynamodb');
```

### 환경별 초기화

```typescript
import { 
  initializeAWSForDevelopment, 
  initializeAWSForProduction 
} from './lib/aws';

// 개발 환경
if (process.env.NODE_ENV === 'development') {
  await initializeAWSForDevelopment();
}

// 프로덕션 환경
if (process.env.NODE_ENV === 'production') {
  await initializeAWSForProduction();
}
```

## 🛠️ 고급 사용법

### 커스텀 오류 처리

```typescript
import { 
  AWSCredentialsError, 
  AWSConfigurationError, 
  handleAWSError 
} from './lib/aws';

try {
  const credentials = await getAWSCredentials();
} catch (error) {
  if (error instanceof AWSCredentialsError) {
    console.error('자격 증명 오류:', error.message);
    // 자격 증명 관련 특별 처리
  } else if (error instanceof AWSConfigurationError) {
    console.error('설정 오류:', error.message);
    // 설정 관련 특별 처리
  } else {
    console.error('일반 오류:', handleAWSError(error));
  }
}
```

### 디버깅 정보 수집

```typescript
import { collectDebugInfo, logAWSConfiguration } from './lib/aws';

// 디버그 정보 수집
const debugInfo = await collectDebugInfo();
console.log('디버그 정보:', debugInfo);

// AWS 설정 로깅
await logAWSConfiguration(true); // 자격 증명 포함
```

## 🔍 타입 정의

### AWSCredentials

```typescript
interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: Date;
}
```

### AWSConfig

```typescript
interface AWSConfig {
  region: string;
  credentials: AWSCredentials;
  userPoolId?: string;
  userPoolClientId?: string;
  identityPoolId?: string;
}
```

### AmplifyConfiguration

```typescript
interface AmplifyConfiguration {
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
```

## ⚠️ 주의사항

1. **보안**: 자격 증명을 로그에 출력할 때는 민감한 정보를 마스킹하세요.
2. **환경 변수**: 프로덕션 환경에서는 반드시 모든 필수 환경 변수를 설정하세요.
3. **오류 처리**: 모든 AWS 관련 함수 호출에 적절한 오류 처리를 추가하세요.
4. **재시도 로직**: 네트워크 오류가 발생할 수 있는 환경에서는 `getAWSCredentialsSafely`를 사용하세요.
5. **Amplify 초기화**: 모든 AWS 함수를 사용하기 전에 Amplify를 초기화해야 합니다.

## 🐛 문제 해결

### 자격 증명을 가져올 수 없는 경우

1. 사용자가 로그인되어 있는지 확인
2. Amplify가 올바르게 초기화되었는지 확인
3. 환경 변수가 올바르게 설정되었는지 확인

### 설정 오류가 발생하는 경우

1. `validateEnvironmentVariables()`로 필수 환경 변수 확인
2. `collectDebugInfo()`로 디버그 정보 수집
3. 브라우저 개발자 도구의 콘솔에서 상세 오류 메시지 확인

## 📞 지원

문제가 발생하거나 질문이 있으시면 개발팀에 문의하세요.