# Robot Agentic AI Backend

로봇 제어 AI 백엔드 서비스입니다. Amazon Bedrock Claude 3.7 Sonnet 모델을 활용하여 자연어 처리와 로봇 제어 기능을 제공합니다.

## 주요 기능

### 🤖 로봇 제어
- 자연어 명령을 로봇 제어 명령으로 변환
- MCP (Model Context Protocol)를 통한 로봇 제어
- 명령 우선순위 관리 및 큐잉
- 비상 정지 및 운영 재개 기능

### 🧠 AI 에이전트
- Amazon Bedrock Claude 3.7 Sonnet 모델 사용
- boto3를 통한 직접 Bedrock 통신
- 대화 컨텍스트 관리
- 로봇 명령 인식 및 처리


## 설치 및 실행

### 1. 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd robot-agentic-ai/backend

# 가상환경 생성
uv venv

source .venv/bin/activate

# 의존성 설치
uv pip install -r requirements.txt
# 또는 pyproject.toml 사용 
uv sync
```

### 2. 환경 설정

#### `config.json` 사용
```bash
# config.json 파일이 이미 설정되어 있습니다
# config/config.json 파일을 확인하고 필요시 수정하세요
cat config/config.json
```

필수 환경 변수:
```env
# AWS 기본 설정
AWS_REGION=us-east-1

# Cognito 인증 설정 (USER_PASSWORD_AUTH 플로우 사용)
COGNITO_DOMAIN=your_congnito_domain
COGNITO_CLIENT_ID=your_cognito_client_id
COGNITO_USERNAME=your_cognito_username
COGNITO_PASSWORD=your_cognito_password

# AWS Secrets Manager 설정 (Bearer Token 관리용)
SECRET_NAME=your_secret_name_for_bearer_token

# MCP 서버 설정
GATEWAY_URL=your_mcp_gateway_url
```

### 3. 실행

#### Bedrock AgentCore Runtime 배포 (권장)
```bash
# Prerequisites 설치
pip install bedrock-agentcore-starter-toolkit jq

# AWS CLI 설정 확인
aws sts get-caller-identity

# 배포 실행
./scripts/deploy.sh
```

#### 개발 모드 (로컬 실행)
```bash
uv run python main.py
```

#### 프로덕션 모드 (로컬)
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Docker 실행
```bash
# Docker 이미지 빌드
docker build -t robot-agentic-ai-backend .

# Docker 컨테이너 실행
docker run -p 8000:8000 --env-file .env robot-agentic-ai-backend
```
