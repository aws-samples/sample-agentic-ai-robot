# 🔧 환경 설정 가이드

이 문서는 **Robot Agentic AI** 프로젝트의 환경 설정 관리에 대해 상세히 설명합니다.

## 📁 현재 환경 설정 구조

### 1. `amplify_outputs.json` 파일
- **위치**: `amplify_outputs.json` (루트) + `src/amplify_outputs.json` (복사본)
- **용도**: AWS Amplify에서 자동 생성되는 인증 및 API 설정
- **내용**: Cognito User Pool, Identity Pool, GraphQL API 엔드포인트 등
- **특징**: Amplify CLI에 의해 자동 관리되며, 수동으로 편집하지 않음
- **생성**: `npx ampx sandbox` 또는 `npx ampx deploy` 실행 시 자동 생성

### 2. `env.json` 파일
- **위치**: `src/env.json`
- **용도**: Bedrock Agent Core 및 Lambda 함수 관련 커스텀 환경 변수
- **내용**: AWS Bedrock Agent Runtime ARN, 리전, Qualifier, Lambda 함수 설정 등
- **특징**: 수동으로 관리하며, 빌드 시 번들에 포함됨

### 3. `craco.config.js` 파일
- **위치**: `craco.config.js`
- **용도**: Create React App 설정 오버라이드
- **내용**: 경로 별칭, 웹팩 설정 등

## 🔑 환경 변수 구성

### `env.json` 파일 내용 (현재 설정)
```json
{
  "REACT_APP_AWS_REGION": "us-west-2",
  "REACT_APP_AGENT_RUNTIME_ARN": "arn:aws:bedrock-agentcore:us-west-2:533267442321:runtime/robot_strands_agent-gezn8P6Qg0",
  "REACT_APP_QUALIFIER": "DEFAULT"
}
```

### `amplify_outputs.json` 파일 내용 (주요 부분)
```json
{
  "auth": {
    "user_pool_id": "us-west-2_bfM9iAqcD",
    "aws_region": "us-west-2",
    "user_pool_client_id": "pvmqal51g44f2p130pvgimjn2",
    "identity_pool_id": "us-west-2:14d8995f-a7ae-4439-8691-e0ababc244e6",
    "mfa_methods": [],
    "standard_required_attributes": ["email"],
    "username_attributes": ["email"],
    "user_verification_types": ["email"],
    "password_policy": {
      "min_length": 8,
      "require_lowercase": true,
      "require_numbers": true,
      "require_symbols": true,
      "require_uppercase": true
    }
  },
  "data": {
    "url": "https://oacp2uo3cfeftbzgfuxsisjona.appsync-api.us-west-2.amazonaws.com/graphql",
    "aws_region": "us-west-2",
    "default_authorization_type": "AWS_IAM",
    "authorization_types": ["AMAZON_COGNITO_USER_POOLS"]
  },
  "version": "1.4"
}
```

## 🛠 환경 설정 유틸리티

### `env-config.ts` 파일
- **위치**: `src/lib/env-config.ts`
- **기능**: `env.json` 파일에서 환경 변수를 안전하게 로드
- **특징**: 
  - 빌드 시 번들에 포함되어 외부 노출 방지
  - `process.env` 폴백 지원
  - TypeScript 타입 지원
  - 비동기/동기 접근 방식 모두 지원

### 주요 함수들
```typescript
// 환경 설정 로드
await loadEnvConfig()

// 환경 변수 비동기 접근 (권장)
const region = await getEnvVar('REACT_APP_AWS_REGION', 'us-west-2')
const agentArn = await getEnvVar('REACT_APP_AGENT_RUNTIME_ARN')

// 환경 변수 동기 접근 (사전 로드 필요)
const region = getEnvVarSync('REACT_APP_AWS_REGION', 'us-west-2')

// 필수 환경 변수 검증
await validateRequiredEnvVars(['REACT_APP_AWS_REGION', 'REACT_APP_AGENT_RUNTIME_ARN'])

// 환경 설정 초기화
await initializeEnvConfig()
```

## 🚀 사용 방법

### 1. 환경 변수 설정

#### Bedrock Agent 설정
`src/env.json` 파일을 편집하여 Bedrock Agent 관련 설정을 관리합니다:

```json
{
  "REACT_APP_AWS_REGION": "us-west-2",
  "REACT_APP_AGENT_RUNTIME_ARN": "arn:aws:bedrock-agentcore:us-west-2:YOUR_ACCOUNT_ID:runtime/YOUR_AGENT_NAME",
  "REACT_APP_QUALIFIER": "DEFAULT"
}
```

#### Lambda 함수 설정 (추가 가능)
```json
{
  "REACT_APP_AWS_REGION": "us-west-2",
  "REACT_APP_AGENT_RUNTIME_ARN": "arn:aws:bedrock-agentcore:us-west-2:533267442321:runtime/robot_strands_agent-gezn8P6Qg0",
  "REACT_APP_QUALIFIER": "DEFAULT",
  "REACT_APP_LAMBDA_FUNCTION_NAME": "lambda-robo-controller-for-robo",
  "REACT_APP_LAMBDA_REGION": "ap-northeast-2"
}
```

### 2. 코드에서 환경 변수 사용

#### 비동기 방식 (권장)
```typescript
import { getEnvVar } from '../lib/env-config'

// BedrockAgentCore.ts에서 사용
const region = await getEnvVar('REACT_APP_AWS_REGION', 'us-west-2')
const agentArn = await getEnvVar('REACT_APP_AGENT_RUNTIME_ARN')

// PollyTTS.ts에서 사용
const region = await getEnvVar('REACT_APP_AWS_REGION', 'us-west-2')
```

#### 동기 방식 (사전 로드 필요)
```typescript
import { getEnvVarSync } from '../lib/env-config'

// 이미 loadEnvConfig()가 호출된 후에 사용
const region = getEnvVarSync('REACT_APP_AWS_REGION', 'us-west-2')
```

### 3. 앱 초기화

`App.tsx`에서 환경 설정이 자동으로 초기화됩니다:

```typescript
import { initializeEnvConfig } from './lib/env-config'

function App() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('앱 초기화 시작...')
        
        // 환경 설정 초기화
        await initializeEnvConfig()
        console.log('환경 설정 초기화 완료')
        
        // Cognito 인증 상태 확인
        const { fetchAuthSession } = await import('aws-amplify/auth')
        const session = await fetchAuthSession()
        console.log('Cognito 인증 상태:', {
          isAuthenticated: !!session.tokens,
          hasCredentials: !!session.credentials,
          identityId: session.identityId
        })
        
        setIsInitialized(true)
        console.log('앱 초기화 완료')
      } catch (error) {
        console.error('앱 초기화 실패:', error)
        setIsInitialized(true) // 에러가 있어도 앱은 계속 실행
      }
    }

    initializeApp()
  }, [])

  if (!isInitialized) {
    return <div>앱을 초기화하는 중...</div>
  }

  // ... 나머지 앱 컴포넌트
}
```

## 🔒 보안 고려사항

### 1. 민감한 정보 보호
- `env.json`은 빌드 시 번들에 포함되므로 민감한 정보는 포함하지 않음
- AWS 자격 증명은 `aws-credentials.ts`에서 동적으로 가져옴
- 실제 ARN과 계정 ID는 환경별로 다르게 설정

### 2. 환경별 설정 관리
```typescript
// 개발 환경
const isDevelopment = process.env.NODE_ENV === 'development'

// 프로덕션 환경에서는 더 엄격한 검증
if (isDevelopment) {
  console.log('개발 환경에서 실행 중')
} else {
  // 프로덕션 환경에서는 민감한 로그 제거
}
```

### 3. 환경 변수 검증
```typescript
// 필수 환경 변수 검증
const requiredVars = [
  'REACT_APP_AWS_REGION',
  'REACT_APP_AGENT_RUNTIME_ARN'
]

const isValid = await validateRequiredEnvVars(requiredVars)
if (!isValid) {
  throw new Error('필수 환경 변수가 설정되지 않았습니다.')
}
```

## 🐛 문제 해결

### 1. 환경 변수 로드 실패
```typescript
// env.json 로드 실패 시 process.env로 폴백
try {
  const envModule = await import('../env.json')
  envConfig = envModule.default || envModule
} catch (error) {
  console.error('Failed to load env.json, falling back to process.env:', error)
  return process.env as Record<string, string>
}
```

### 2. Amplify 설정 불일치
- `amplify_outputs.json`이 최신 상태인지 확인
- `npx ampx status`로 현재 상태 확인
- 필요시 `npx ampx sandbox` 재실행

### 3. TypeScript 타입 오류
```typescript
// env.d.ts 파일에서 타입 정의
declare module '*.json' {
  const value: any
  export default value
}
```

## 📚 추가 리소스

- [AWS Amplify 환경 설정 문서](https://docs.amplify.aws/react/build-a-backend/environment-variables/)
- [Create React App 환경 변수 가이드](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [AWS Bedrock Agent Core 문서](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
