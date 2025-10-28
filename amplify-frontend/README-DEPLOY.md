# 🚀 AWS Amplify 배포 가이드

**Robot Agentic AI** 프로젝트의 AWS Amplify 배포에 대한 완전한 가이드입니다.

## 📋 사전 요구사항

### 필수 도구
- **Node.js 18+** - JavaScript 런타임
- **npm 또는 yarn** - 패키지 매니저
- **AWS CLI** - AWS 서비스 접근
- **Git** - 버전 관리 (CI/CD용)

### AWS 계정 설정
- AWS 계정 및 적절한 권한
- IAM 사용자 또는 역할 설정
- AWS 자격 증명 구성

## 🛠 배포 스크립트 사용법

### 1. 빠른 배포 (개발/테스트용)
```bash
# 가장 간단한 배포 방법
./quick-deploy.sh

# 또는 수동으로
npm install
npm run build
npx ampx sandbox
```

### 2. 상세 배포 (개발/테스트용)
```bash
# Sandbox 환경 배포 (상세 로그 포함)
./deploy.sh sandbox
```

### 3. 프로덕션 배포
```bash
# App ID 자동 감지 (amplify_outputs.json에서)
./deploy.sh production

# App ID 직접 지정
./deploy-production.sh <app-id> [branch]

# Pipeline 배포 (CI/CD용)
./deploy-pipeline.sh <app-id> [branch]
```

### 4. App ID 확인 방법
```bash
# Amplify 앱 목록 확인
npx ampx list

# 현재 앱 상태 확인
npx ampx status

# amplify_outputs.json에서 확인
cat amplify_outputs.json | jq '.app_id'
```

## 🔧 수동 배포 명령어

### Amplify Gen 2 명령어들
```bash
cd amplify-frontend

# Sandbox 환경 (개발용) - 권장
npx ampx sandbox

# CI/CD 파이프라인 배포
npx ampx pipeline-deploy --app-id YOUR_APP_ID --branch main

# 일반 배포
npx ampx deploy --app-id YOUR_APP_ID --branch main

# 배포 상태 확인
npx ampx status

# 실시간 로그 확인
npx ampx logs --follow

# Sandbox 삭제
npx ampx sandbox delete
```

### 프론트엔드 개발 명령어들
```bash
cd amplify-frontend

# 의존성 설치
npm install
# 또는
yarn install

# 개발 서버 실행 (Create React App)
npm start
# 또는
yarn start

# 프로덕션 빌드
npm run build
# 또는
yarn build

# 테스트 실행
npm test
# 또는
yarn test

# TypeScript 타입 체크
npx tsc --noEmit
```

## 🌍 배포 환경별 설명

### 1. Sandbox 환경 (Amplify Gen 2 권장)
- **용도**: 개발, 테스트, 프로덕션 테스트
- **특징**: 
  - 빠른 배포 (1-2분)
  - 자동 삭제 가능
  - 실제 AWS 리소스 사용
  - 비용 최적화
- **명령어**: `npx ampx sandbox`
- **장점**: 로컬에서 실제 프로덕션과 동일한 환경 테스트 가능

### 2. CI/CD 파이프라인 배포
- **용도**: 실제 프로덕션 서비스
- **특징**: 
  - GitHub Actions, AWS CodePipeline 등과 연동
  - 자동화된 배포 프로세스
  - 롤백 기능 지원
- **명령어**: `npx ampx pipeline-deploy --app-id YOUR_APP_ID --branch main`
- **요구사항**: 
  - AWS Amplify 앱 ID 필요
  - Git 리포지토리 연결 필요
  - 적절한 IAM 권한

### 3. Production 배포 방법
- **로컬 배포**: `./deploy-production.sh <app-id> [branch]`
- **Pipeline 배포**: `./deploy-pipeline.sh <app-id> [branch]`
- **자동 감지**: `./deploy.sh production` (amplify_outputs.json에서 App ID 자동 감지)

## ✅ 배포 후 확인사항

### 1. 배포 상태 확인
```bash
# Amplify 상태 확인
npx ampx status

# 출력 파일 확인
cat amplify_outputs.json

# 빌드 로그 확인
npx ampx logs
```

### 2. 주요 엔드포인트 확인
```bash
# GraphQL API 엔드포인트
cat amplify_outputs.json | jq '.data.url'

# User Pool ID
cat amplify_outputs.json | jq '.auth.user_pool_id'

# Identity Pool ID
cat amplify_outputs.json | jq '.auth.identity_pool_id'

# App ID
cat amplify_outputs.json | jq '.app_id'
```

### 3. AWS 콘솔에서 확인
- [AWS Amplify 콘솔](https://console.aws.amazon.com/amplify/)
- [AWS AppSync 콘솔](https://console.aws.amazon.com/appsync/)
- [AWS Cognito 콘솔](https://console.aws.amazon.com/cognito/)
- [AWS CloudWatch 콘솔](https://console.aws.amazon.com/cloudwatch/)

### 4. 애플리케이션 테스트
```bash
# 개발 서버 실행
npm start

# 브라우저에서 확인
# http://localhost:3000

# 주요 기능 테스트
# 1. 사용자 인증 (로그인/회원가입)
# 2. AI 대화 기능
# 3. 로봇 제어 버튼
# 4. TTS 음성 기능
```

## 🐛 문제 해결

### 일반적인 문제들

#### 1. 의존성 설치 실패
```bash
# 캐시 정리 후 재설치
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 또는 yarn 사용
rm -rf node_modules yarn.lock
yarn cache clean
yarn install
```

#### 2. 빌드 실패
```bash
# TypeScript 오류 확인
npx tsc --noEmit

# Create React App 빌드 확인
npm run build

# 환경 변수 확인
cat src/env.json
```

#### 3. 배포 실패
```bash
# AWS 자격 증명 확인
aws sts get-caller-identity

# AWS CLI 재설치
npm install -g @aws-amplify/cli

# Amplify CLI 업데이트
npm update -g @aws-amplify/cli
```

#### 4. 권한 오류
```bash
# 스크립트 실행 권한 부여
chmod +x deploy.sh
chmod +x quick-deploy.sh
chmod +x deploy-production.sh
chmod +x deploy-pipeline.sh
```

#### 5. Amplify 설정 오류
```bash
# Amplify 상태 초기화
npx ampx sandbox delete
npx ampx sandbox

# 또는 완전 재설정
rm -rf amplify_outputs.json
npx ampx sandbox
```

## 🔒 환경 변수 설정

### AWS 자격 증명 설정
```bash
# 방법 1: AWS CLI 설정
aws configure

# 방법 2: 환경 변수 설정
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-west-2

# 방법 3: AWS 프로파일 사용
export AWS_PROFILE=your-profile-name
```

### 프로젝트 환경 변수
```bash
# src/env.json 파일 확인
cat src/env.json

# 필요한 경우 수정
{
  "REACT_APP_AWS_REGION": "us-west-2",
  "REACT_APP_AGENT_RUNTIME_ARN": "arn:aws:bedrock-agentcore:us-west-2:YOUR_ACCOUNT_ID:runtime/YOUR_AGENT_NAME",
  "REACT_APP_QUALIFIER": "DEFAULT"
}
```

## 📊 모니터링

### 로그 확인
```bash
# 실시간 로그 (Sandbox)
npx ampx logs --follow

# 특정 시간대 로그
npx ampx logs --since 1h

# 에러 로그만 확인
npx ampx logs --level error
```

### 성능 모니터링
- **AWS CloudWatch**: 메트릭 및 로그 확인
- **AWS X-Ray**: 분산 추적 확인
- **Amplify 콘솔**: 빌드 로그 및 배포 상태
- **브라우저 개발자 도구**: 클라이언트 사이드 성능

### 알림 설정
```bash
# CloudWatch 알람 설정 (예시)
aws cloudwatch put-metric-alarm \
  --alarm-name "Amplify-Build-Failure" \
  --alarm-description "Amplify build failed" \
  --metric-name "BuildCount" \
  --namespace "AWS/Amplify" \
  --statistic "Sum" \
  --period 300 \
  --threshold 0 \
  --comparison-operator "LessThanThreshold"
```

## 🚀 CI/CD 파이프라인 설정

### GitHub Actions 예시
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS Amplify

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Amplify
        run: npx ampx pipeline-deploy --app-id ${{ secrets.AMPLIFY_APP_ID }} --branch main
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-west-2
```

## 📚 추가 리소스

- [AWS Amplify Gen 2 문서](https://docs.amplify.aws/react/build-a-backend/)
- [Amplify CLI 명령어 참조](https://docs.amplify.aws/cli/)
- [Create React App 배포 가이드](https://create-react-app.dev/docs/deployment/)
- [AWS CloudWatch 모니터링](https://docs.aws.amazon.com/cloudwatch/)

---

**💡 팁**: 처음 배포할 때는 `./quick-deploy.sh`를 사용하여 빠르게 테스트해보세요!
