# 🌐 AgentCore Gateway - MCP 서버

> **Model Context Protocol (MCP)를 통한 로봇 제어 명령 전달 시스템**

이 컴포넌트는 Amazon Bedrock AgentCore Gateway와 Lambda를 활용하여 자연어 명령을 로봇 제어 신호로 변환하는 MCP 서버를 구현합니다. AI 에이전트가 생성한 명령을 실제 로봇 동작으로 변환하는 핵심 인터페이스 역할을 담당합니다.

## 🎯 주요 기능

### 🤖 로봇 제어 명령 변환
- 자연어 명령을 구조화된 로봇 제어 신호로 변환
- Action과 Message 기반의 명령 구조 지원
- 실시간 명령 처리 및 응답

### 🔗 MCP 프로토콜 지원
- Model Context Protocol 표준 준수
- Bedrock AgentCore와의 완벽한 통합
- 확장 가능한 도구 인터페이스

### 🛡️ 보안 및 인증
- AWS Cognito 기반 JWT 인증
- IAM 역할을 통한 안전한 권한 관리
- 커스텀 JWT Authorizer 지원

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Agent      │───▶│  AgentCore       │───▶│   Lambda        │
│  (Bedrock)      │    │   Gateway        │    │   Function      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   MCP Server     │    │   Robot         │
                       │   (Tool Spec)    │    │   Controller    │
                       └──────────────────┘    └─────────────────┘
```

## 📋 MCP Interface Tool Spec

로봇 제어를 위한 명령은 `action`과 `message`로 구성됩니다. 현재 지원하는 액션은 로봇의 감정 상태를 나타내는 4가지 기본 동작입니다.

### Tool Schema 정의

```json
{
    "name": "command",
    "description": "당신은 로봇 컨트롤러입니다. 로봇을 컨트롤하기 위한 명령은 action과 message입니다. 적절한 로봇의 동작명을 action으로 전달하고, 로봇이 전달할 메시지를 message로 전달하세요. action은 HAPPY, NEUTRAL, SAD, ANGRY중 하나를 선택합니다.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "description": "로봇의 동작 명령 (HAPPY, NEUTRAL, SAD, ANGRY)"
            },
            "message": {
                "type": "string",
                "description": "로봇이 전달할 메시지 (선택사항)"
            }
        },
        "required": ["action"]
    }
}
```

### 지원하는 Action 타입

| Action | 설명 | 사용 예시 |
|--------|------|-----------|
| `HAPPY` | 기쁜 상태 표현 | "오늘은 정말 멋지네요!" |
| `NEUTRAL` | 중립적 상태 표현 | "일상적인 작업을 수행합니다" |
| `SAD` | 슬픈 상태 표현 | "안타까운 상황이 발생했네요" |
| `ANGRY` | 화난 상태 표현 | "위험한 상황을 감지했습니다!" |

## ⚙️ MCP 서버 구현

### Lambda 함수 핸들러

MCP 서버의 핵심은 Lambda 함수에서 구현됩니다. 수신된 이벤트에서 도구 이름을 확인하고, action과 message를 추출하여 로봇 제어 명령으로 변환합니다.

```python
def lambda_handler(event, context):
    # Bedrock AgentCore에서 전달된 도구 이름 추출
    toolName = context.client_context.custom['bedrockAgentCoreToolName']
    
    # 도구 이름에서 실제 명령어 추출 (target_name___command 형식)
    delimiter = "___"
    if delimiter in toolName:
        toolName = toolName[toolName.index(delimiter) + len(delimiter):]

    # 이벤트에서 action과 message 추출
    action = event.get('action')
    message = event.get('message')

    # command 도구인 경우 로봇 제어 실행
    if toolName == 'command':
        result = command_robot(action, message)
        return {
            'statusCode': 200, 
            'body': result
        }
```

### 로봇 제어 함수

```python
def command_robot(action, message):
    """로봇 제어 명령을 실행하는 함수"""
    try:
        # 로봇 제어 로직 구현
        robot_response = {
            "status": "success",
            "action": action,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "robot_id": "robo-dog-001"
        }
        
        # 실제 로봇 제어 API 호출 (예시)
        # robot_client.send_command(action, message)
        
        return robot_response
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "action": action,
            "message": message
        }
```

## 🚀 배포 및 설정

### 1. IAM 역할 생성

먼저 필요한 IAM 역할을 생성합니다:

```bash
python create_gateway_role.py
```

이 스크립트는 다음 역할들을 생성합니다:
- AgentCore Gateway 실행 역할
- Lambda 함수 실행 역할
- 필요한 권한 정책 연결

### 2. Gateway 및 Target 배포

Gateway와 Target을 생성하고 Lambda 함수를 배포합니다:

```bash
python create_gateway_tool.py
```

이 과정에서 다음이 생성됩니다:
- AgentCore Gateway 인스턴스
- Lambda 함수 (MCP 서버)
- Gateway Target 연결
- Cognito 인증 설정

### 3. Gateway 생성 상세

```python
# Gateway 생성
gateway_id = config.get('gateway_id')    
gateway_url = f'https://{gateway_id}.gateway.bedrock-agentcore.{region}.amazonaws.com/mcp'
agentcore_gateway_iam_role = config['agentcore_gateway_iam_role']

# Cognito JWT 인증 설정
auth_config = {
    "customJWTAuthorizer": { 
        "allowedClients": [client_id],  
        "discoveryUrl": cognito_discovery_url
    }
}

# Gateway 생성
response = gateway_client.create_gateway(
    name=gateway_name,
    roleArn=agentcore_gateway_iam_role,
    protocolType='MCP',
    authorizerType='CUSTOM_JWT',
    authorizerConfiguration=auth_config, 
    description=f'AgentCore Gateway for {projectName}'
)
```

### 4. Target 배포

```python
# Tool Spec 로드
TOOL_SPEC = json.load(open(os.path.join(script_dir, "tool_spec.json")))

# Lambda Target 설정
lambda_target_config = {
    "mcp": {
        "lambda": {
            "lambdaArn": lambda_function_arn, 
            "toolSchema": {
                "inlinePayload": [TOOL_SPEC]
            }
        }
    }
}

# 자격 증명 설정
credential_config = [ 
    {
        "credentialProviderType": "GATEWAY_IAM_ROLE"
    }
]

# Target 생성
response = gateway_client.create_gateway_target(
    gatewayIdentifier=gateway_id,
    name=targetname,
    description=f'{targetname} for {projectName}',
    targetConfiguration=lambda_target_config,
    credentialProviderConfigurations=credential_config
)

target_id = response["targetId"]
```

## 🔧 사용 방법

### MCP 클라이언트 연결

```python
from mcp.client.streamable_http import streamablehttp_client

# MCP 서버에 연결
async with streamablehttp_client(mcp_url, headers, timeout=120, terminate_on_close=False) as (
    read_stream, write_stream, _):

    async with ClientSession(read_stream, write_stream) as session:
        # 사용 가능한 도구 목록 조회
        tool_result = await asyncio.wait_for(session.list_tools(), timeout=60)
        for tool in tool_result.tools:
            print(f"  - {tool.name}: {tool.description[:100]}...")

        # 로봇 제어 명령 실행
        target_name = config['target_name']
        tool_name = f"{target_name}___command"
        params = {
            "action": "HAPPY",
            "message": "안녕하세요! 오늘도 좋은 하루 되세요!"
        }
        
        result = await asyncio.wait_for(
            session.call_tool(tool_name, params), 
            timeout=30
        )
        print(f"로봇 제어 결과: {result}")
```

### MCP 서버 설정 정보

```python
# MCP 서버 연결 정보 생성
gateway_url = f'https://{gateway_id}.gateway.bedrock-agentcore.{region}.amazonaws.com/mcp'
bearer_token = retrieve_bearer_token(config['secret_name'])

mcp_config = {
    "mcpServers": {
        "agentcore-gateway": {
            "type": "streamable_http",
            "url": gateway_url,
            "headers": {
                "Authorization": f"Bearer {bearer_token}",
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            }
        }
    }
}
```

## 🧪 테스트

### 원격 MCP 서버 테스트

```bash
python test_mcp_remote.py
```

이 테스트는 다음을 확인합니다:
- MCP 서버 연결 상태
- 사용 가능한 도구 목록
- 로봇 제어 명령 실행
- 응답 시간 및 오류 처리

### 테스트 결과 예시

```
🔧 MCP 서버 연결 테스트
✅ 연결 성공: https://abc123.gateway.bedrock-agentcore.us-west-2.amazonaws.com/mcp

📋 사용 가능한 도구:
  - command: 당신은 로봇 컨트롤러입니다...

🤖 로봇 제어 테스트:
  Action: HAPPY
  Message: 테스트 메시지
  결과: {"status": "success", "action": "HAPPY", ...}
```

## 🔒 보안 고려사항

### JWT 토큰 관리
- AWS Secrets Manager를 통한 Bearer Token 안전 저장
- 토큰 만료 시 자동 갱신
- Cognito User Pool과의 연동

### IAM 권한 최소화
- 필요한 최소 권한만 부여
- Gateway와 Lambda 함수별 역할 분리
- 리소스별 세밀한 권한 제어

### 네트워크 보안
- HTTPS를 통한 모든 통신 암호화
- VPC 엔드포인트 활용 (선택사항)
- CloudTrail을 통한 API 호출 로깅

## 📚 추가 리소스

- [Amazon Bedrock AgentCore 문서](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Model Context Protocol (MCP) 사양](https://modelcontextprotocol.io/)
- [AWS Lambda 함수 개발 가이드](https://docs.aws.amazon.com/lambda/latest/dg/python-programming-model.html)
