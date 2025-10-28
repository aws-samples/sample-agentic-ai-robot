# 🧠 Agentic AI Runtime - 로봇 제어 백엔드

> **Amazon Bedrock 기반 지능형 로봇 제어 시스템**

이 컴포넌트는 Agentic AI의 핵심 백엔드 서비스로, 자연어 명령을 이해하고 로봇 제어 명령으로 변환하는 지능형 에이전트를 구현합니다. Amazon Bedrock 모델을 활용하여 실시간 대화 처리와 로봇 제어 기능을 제공합니다.

## 🎯 주요 기능

### 🤖 지능형 로봇 제어
- **자연어 명령 해석**: 사용자의 자연어 입력을 로봇 제어 명령으로 변환
- **MCP 통합**: Model Context Protocol을 통한 확장 가능한 도구 연동
- **명령 우선순위 관리**: 비상 상황과 일반 명령의 우선순위 처리
- **실시간 응답**: 스트리밍을 통한 즉각적인 피드백 제공

### 🧠 AI 에이전트 엔진
- **Bedrock 모델**: 최신 생성형 AI 모델 활용
- **대화 컨텍스트 관리**: 이전 대화 내용을 기억하는 컨텍스트 유지
- **멀티모달 처리**: 텍스트, 이미지, 센서 데이터 통합 처리
- **동적 계획 수립**: 상황에 따른 최적의 로봇 행동 계획

### 🔄 실시간 데이터 처리
- **SQS 스트리밍**: FIFO 큐를 통한 순차적 데이터 처리
- **IoT 센서 통합**: 다양한 센서 데이터의 실시간 수집 및 분석
- **이벤트 기반 처리**: 비동기 이벤트 처리로 높은 성능 보장
- **오류 복구**: 자동 재시도 및 오류 처리 메커니즘

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│  Agent Runtime   │───▶│   MCP Gateway   │
│  (React)        │    │  (Bedrock)       │    │   (Lambda)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   SQS Queues     │    │   Robot         │
                       │  (Feedback/      │    │   Controller    │
                       │   Detection)     │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## 🚀 핵심 컴포넌트

### 1. Agent Manager (`core/agent_manager.py`)
- Bedrock Claude 모델과의 직접 통신
- 대화 세션 관리 및 컨텍스트 유지
- 스트리밍 응답 처리

### 2. MCP Manager (`core/mcp_manager.py`)
- Model Context Protocol 서버 관리
- 도구 호출 및 응답 처리
- 로봇 제어 명령 변환

### 3. Stream Processor (`core/stream_processor.py`)
- SQS 큐에서 실시간 데이터 수신
- IoT 센서 데이터 처리
- 이벤트 기반 알림 시스템

### 4. Memory Hook (`memory/memory_hook.py`)
- 대화 히스토리 저장 및 관리
- 컨텍스트 기반 응답 생성
- 장기 기억 시스템

## 📋 지원하는 로봇 명령

### 기본 동작 명령
| 명령 | 설명 | 예시 |
|------|------|------|
| `HAPPY` | 기쁜 상태 표현 | "오늘은 정말 멋지네요!" |
| `NEUTRAL` | 중립적 상태 표현 | "일상적인 작업을 수행합니다" |
| `SAD` | 슬픈 상태 표현 | "안타까운 상황이 발생했네요" |
| `ANGRY` | 화난 상태 표현 | "위험한 상황을 감지했습니다!" |

### 고급 명령 (확장 가능)
- **순찰 명령**: "위험 구역을 순찰해 줘"
- **영상 명령**: "화재가 발생한 곳의 영상을 보여줘"
- **상태 확인**: "현재 로봇 상태를 알려줘"
- **비상 정지**: "즉시 정지해!"

## ⚙️ 설치 및 실행

### 1. 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd agent-runtime

# 가상환경 생성 및 활성화
uv venv
source .venv/bin/activate

# 의존성 설치
uv pip install -r requirements.txt
# 또는 pyproject.toml 사용
uv sync
```

### 2. 환경 변수 설정

#### `config.json` 파일 설정
```json
{
    "model_id": "us.anthropic.claude-3-5-haiku-20241022-v1:0",
    "gateway_url": "https://your-gateway-id.gateway.bedrock-agentcore.us-west-2.amazonaws.com/mcp",
    "cognito": {
        "client_id": "your_cognito_client_id",
        "test_username": "your_username",
        "test_password": "your_password"
    },
    "feedback_queue_name": "robo_feedback",
    "detection_queue_name": "robo_detection",
    "gesture_queue_name": "robo_gesture"
}
```

#### 환경 변수 설정
```bash
# AWS 기본 설정 (IAM 역할 사용 시 불필요)
export AWS_REGION=us-west-2

# Cognito 인증 설정 (config.json에서도 설정 가능)
export COGNITO_CLIENT_ID=your_cognito_client_id
export COGNITO_USERNAME=your_cognito_username
export COGNITO_PASSWORD=your_cognito_password

# AWS Secrets Manager 설정
export SECRET_NAME=your_secret_name_for_bearer_token
```

**참고**: 대부분의 설정은 `config.json` 파일에서 관리됩니다. 환경 변수는 선택사항이며, `config.json`에 설정된 값이 우선됩니다.

### 3. 실행 방법

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
# 직접 실행
uv run python main.py

# 또는 uvicorn 사용
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Docker 실행
```bash
# Docker 이미지 빌드
docker build -t agentic-ai-runtime .

# Docker 컨테이너 실행
docker run -p 8000:8000 --env-file .env agentic-ai-runtime
```

## 🔧 사용 방법

### 1. 기본 대화 시작

```python
from core.agent_manager import AgentManager
from core.mcp_manager import MCPManager

# Agent Manager 초기화
agent_manager = AgentManager()

# MCP Manager 초기화
mcp_manager = MCPManager()

# 대화 세션 시작
session_id = "user_session_001"
user_message = "안녕하세요! 로봇을 기쁘게 만들어 주세요."

# AI 응답 생성
response = await agent_manager.process_message(
    message=user_message,
    session_id=session_id
)

print(f"AI 응답: {response}")
```

### 2. 로봇 제어 명령 실행

```python
# 로봇 제어 명령 생성
robot_command = {
    "action": "HAPPY",
    "message": "오늘은 정말 멋진 하루네요!"
}

# MCP를 통한 로봇 제어 실행
result = await mcp_manager.execute_robot_command(robot_command)
print(f"로봇 제어 결과: {result}")
```

### 3. 스트리밍 응답 처리

```python
from core.stream_processor import StreamProcessor

# 스트리밍 프로세서 초기화
stream_processor = StreamProcessor()

# 실시간 데이터 수신
async def handle_streaming_data():
    async for message in stream_processor.listen_to_queue("robo_feedback"):
        print(f"수신된 피드백: {message}")
        
        # AI 에이전트가 피드백을 분석하고 응답 생성
        ai_response = await agent_manager.analyze_feedback(message)
        print(f"AI 분석 결과: {ai_response}")

# 스트리밍 시작
await handle_streaming_data()
```

## 🧪 테스트

### 1. 로컬 테스트

```bash
# 기본 기능 테스트
python scripts/test_main.py

# MCP 원격 연결 테스트
python scripts/test_mcp_remote.py

# 로봇 도구 테스트
python tools/test_robot_tools.py
```

### 2. 통합 테스트

```bash
# 전체 시스템 통합 테스트
./scripts/test_local.sh

# 로그 확인
./scripts/logs.sh
```

### 3. 테스트 결과 예시

```
🧠 Agent Runtime 테스트 시작
✅ Bedrock 연결 성공
✅ MCP 서버 연결 성공
✅ SQS 큐 연결 성공

🤖 로봇 제어 테스트:
  입력: "로봇을 기쁘게 만들어 주세요"
  출력: {"action": "HAPPY", "message": "정말 기쁩니다!"}
  결과: 성공

📊 스트리밍 테스트:
  피드백 수신: {"status": "success", "timestamp": "2024-01-01T00:00:00Z"}
  AI 분석: "로봇이 정상적으로 동작하고 있습니다."
```

## 🔒 보안 및 인증

### AWS Cognito 인증
```python
from auth.access_token import AccessTokenManager

# 토큰 관리자 초기화
token_manager = AccessTokenManager()

# 인증 토큰 획득
access_token = await token_manager.get_access_token()

# 토큰 갱신
refreshed_token = await token_manager.refresh_token()
```

### AWS Secrets Manager
```python
import boto3
import json

# Secrets Manager에서 민감한 정보 로드
secrets_client = boto3.client('secretsmanager')
secret_response = secrets_client.get_secret_value(SecretId='your-secret-name')
secret_data = json.loads(secret_response['SecretString'])
```

## 📊 모니터링 및 로깅

### 로그 설정
```python
from utils.logger import setup_logger

# 로거 설정
logger = setup_logger(__name__)

# 로그 레벨별 기록
logger.info("Agent Runtime 시작")
logger.warning("MCP 연결 지연 감지")
logger.error("로봇 제어 실패")
```

### CloudWatch 통합
- 자동 로그 수집 및 분석
- 메트릭 대시보드 구성
- 알림 설정

## 🚀 성능 최적화

### 비동기 처리
- asyncio를 활용한 비동기 I/O
- 동시 요청 처리로 높은 처리량 보장
- 스트리밍 응답으로 지연 시간 최소화

### 메모리 관리
- 대화 히스토리 압축
- 불필요한 컨텍스트 정리
- 메모리 사용량 모니터링

### 캐싱 전략
- 자주 사용되는 응답 캐싱
- 토큰 재사용으로 API 호출 최적화
- Redis를 활용한 분산 캐싱 (선택사항)

## 📚 추가 리소스

- [Amazon Bedrock Claude 모델 가이드](https://docs.aws.amazon.com/bedrock/latest/userguide/claude.html)
- [Model Context Protocol (MCP) 문서](https://modelcontextprotocol.io/)
- [AWS Lambda 함수 개발 가이드](https://docs.aws.amazon.com/lambda/latest/dg/python-programming-model.html)
- [Strands Agent SDK 문서](https://docs.strands.ai/)
