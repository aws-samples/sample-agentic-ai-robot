# Robot Agentic AI - Amplify Frontend

🤖 **AI 기반 로봇 제어 및 모니터링 웹 애플리케이션**

React 18, TypeScript, AWS Amplify를 사용하여 구축된 현대적인 로봇 제어 인터페이스입니다. AWS Bedrock AgentCore를 통한 AI 대화와 실시간 로봇 제어 기능을 제공합니다.

## 🚀 주요 기능

### 🤖 AI 로봇 제어
- **실시간 AI 대화**: AWS Bedrock AgentCore를 통한 자연어 처리
- **로봇 제어 버튼**: 직관적인 버튼 인터페이스로 로봇 동작 제어
- **빠른 명령**: 자주 사용하는 명령을 빠르게 실행
- **스트리밍 응답**: 실시간으로 AI 응답을 받아볼 수 있음

### 🎵 음성 기능
- **TTS (Text-to-Speech)**: AWS Polly를 사용한 한국어 음성 출력
- **음성 제어**: 재생, 일시정지, 정지 기능
- **자동 재생**: AI 응답 완료 시 자동 음성 출력

### 🎨 현대적인 UI/UX
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **Material-UI**: 세련된 컴포넌트와 애니메이션
- **실시간 상태 표시**: 연결 상태, 로봇 제어 상태 등
- **접을 수 있는 패널**: 공간 효율적인 인터페이스

### 🔐 보안 및 인증
- **AWS Cognito**: 안전한 사용자 인증
- **IAM 권한 관리**: 필요한 AWS 서비스에만 접근
- **환경 변수 보안**: 민감한 정보 보호

## 🛠 기술 스택

### Frontend
- **React 18.3.1** - UI 라이브러리
- **TypeScript 4.9.5** - 타입 안전성
- **Create React App** - 개발 환경 및 빌드 도구
- **Material-UI 7.3.2** - UI 컴포넌트 라이브러리
- **React Router 6.28.0** - 클라이언트 사이드 라우팅

### Backend & AI
- **AWS Amplify 6.15.5** - 백엔드 서비스
- **AWS Bedrock AgentCore** - AI 대화 엔진
- **AWS Polly** - 텍스트-음성 변환
- **AWS Lambda** - 로봇 제어 함수
- **AWS Cognito** - 사용자 인증

### 개발 도구
- **ESLint** - 코드 품질 관리
- **Testing Library** - 컴포넌트 테스트
- **Craco** - Create React App 설정 오버라이드

## 📁 프로젝트 구조

```
amplify-frontend/
├── src/
│   ├── components/              # 재사용 가능한 컴포넌트
│   │   ├── ChatInterface.tsx   # 채팅 인터페이스
│   │   ├── Layout.tsx          # 메인 레이아웃
│   │   └── StreamingMessage.tsx # 스트리밍 메시지 컴포넌트
│   ├── pages/                  # 페이지 컴포넌트
│   │   ├── Agent.tsx           # AI 에이전트 페이지 (메인)
│   │   ├── Dashboard.tsx       # 대시보드 페이지
│   │   └── Home.tsx            # 홈 페이지
│   ├── lib/                    # 유틸리티 및 설정
│   │   ├── BedrockAgentCore.ts # AI 에이전트 통신
│   │   ├── PollyTTS.ts         # 음성 합성 서비스
│   │   ├── LambdaClient.ts     # Lambda 함수 클라이언트
│   │   ├── amplify.ts          # Amplify 설정
│   │   └── aws-credentials.ts  # AWS 자격 증명
│   ├── config/                 # 설정 파일
│   │   ├── robotControlButton.json # 로봇 제어 버튼 설정
│   │   └── quickCommandButton.json # 빠른 명령 설정
│   ├── hooks/                  # 커스텀 훅
│   │   └── useStreamingMessages.ts # 메시지 상태 관리
│   └── App.tsx                 # 메인 앱 컴포넌트
├── amplify/                    # Amplify 백엔드 설정
│   ├── backend.ts              # 백엔드 정의
│   ├── auth/resource.ts        # 인증 설정
│   └── data/resource.ts        # 데이터 설정
├── public/                     # 정적 파일
├── package.json                # 의존성 관리
├── craco.config.js             # CRA 설정 오버라이드
└── README.md                   # 프로젝트 문서
```

## 🚀 시작하기

### 1. 사전 요구사항

- Node.js 18+ 
- npm 또는 yarn
- AWS 계정 및 적절한 권한
- AWS CLI 설정 (선택사항)

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# AWS 설정
REACT_APP_AWS_REGION=us-west-2
REACT_APP_AGENT_RUNTIME_ARN=your-agent-runtime-arn
REACT_APP_QUALIFIER=your-qualifier

# Lambda 함수 설정
REACT_APP_LAMBDA_FUNCTION_NAME=lambda-robo-controller-for-robo
REACT_APP_LAMBDA_REGION=ap-northeast-2
```

### 3. 의존성 설치

```bash
npm install
# 또는
yarn install
```

### 4. Amplify 백엔드 배포

```bash
# Amplify 백엔드 배포
npx ampx sandbox

# 또는 프로덕션 배포
npx ampx deploy
```

### 5. 개발 서버 실행

```bash
npm start
# 또는
yarn start
```

개발 서버가 http://localhost:3000에서 실행됩니다.

## 🎮 사용 방법

### 1. 로그인
- AWS Cognito를 통한 안전한 로그인
- 이메일/비밀번호 또는 소셜 로그인 지원

### 2. AI 대화
- 텍스트 입력창에 메시지 입력
- Enter 키 또는 전송 버튼으로 메시지 전송
- 실시간으로 AI 응답을 받아볼 수 있음

### 3. 로봇 제어
- 왼쪽 패널의 로봇 제어 버튼 사용
- 이동, 동작, 제스처 등 다양한 명령 실행
- 각 버튼은 직관적인 아이콘과 설명 제공

### 4. 음성 기능
- 설정에서 TTS 기능 활성화
- AI 응답의 자동 음성 출력
- 재생, 일시정지, 정지 제어 가능

## 🔧 개발 가이드

### 컴포넌트 작성

새로운 컴포넌트를 작성할 때는 TypeScript와 Material-UI를 사용하세요:

```tsx
import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { styled } from '@mui/material/styles'

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  // ... 추가 스타일
}))

interface MyComponentProps {
  title: string
  onAction: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
      <StyledButton onClick={onAction}>
        실행
      </StyledButton>
    </Box>
  )
}
```

### API 통신

AWS 서비스와의 통신은 전용 클라이언트를 사용하세요:

```tsx
import { invokeAgentCore } from '../lib/BedrockAgentCore'
import { ttsService } from '../lib/PollyTTS'

// AI 에이전트 호출
const stream = await invokeAgentCore(prompt, sessionId, debugMode)

// TTS 재생
await ttsService.speak(text, { speechRate: 120 })
```

### 상태 관리

커스텀 훅을 사용하여 상태를 관리하세요:

```tsx
import { useStreamingMessages } from '../hooks/useStreamingMessages'

function MyComponent() {
  const { messages, addMessage, updateMessage } = useStreamingMessages()
  
  // 메시지 추가
  const messageId = addMessage({
    type: 'chunk',
    data: 'Hello World',
    isUser: false,
  })
}
```

## 🚀 배포

### 개발 환경

```bash
npm run build
npm run start
```

### 프로덕션 배포

```bash
# Amplify 백엔드 배포
npx ampx deploy

# 프론트엔드 빌드
npm run build

# S3에 배포 (Amplify 호스팅 사용 시 자동)
```

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage
```
