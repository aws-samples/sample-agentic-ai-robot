# 🤖 로봇 직접 제어 시스템

> **Lambda 기반 로봇 제어 명령 실행 엔진**

<p>
  | <a href="./README.md">English</a> | <a href="./README-ko.md">한국어</a> |
</p>

이 컴포넌트는 AI 에이전트나 사용자가 생성한 로봇 제어 명령을 직접 실행하는 Lambda 함수입니다. MCP 서버를 거치지 않고도 로봇을 직접 제어할 수 있는 백업 시스템으로, 비상 상황이나 직접 제어가 필요한 경우에 활용됩니다.

## 🎯 주요 기능

### 🚀 직접 로봇 제어
- **즉시 실행**: Lambda 함수를 통한 즉각적인 로봇 제어
- **Action-Message 구조**: 표준화된 명령 형식 지원
- **다양한 동작**: HAPPY, NEUTRAL, SAD, ANGRY 등 감정 표현 동작
- **비상 대응**: 긴급 상황에서의 빠른 로봇 제어

### 🔧 명령 처리
- **JSON 페이로드**: 구조화된 명령 데이터 처리
- **오류 처리**: 명령 실행 실패 시 적절한 오류 응답
- **로깅**: 모든 명령 실행에 대한 상세 로그 기록
- **상태 반환**: 명령 실행 결과 및 로봇 상태 정보 반환

### 📊 모니터링 및 디버깅
- **실행 로그**: CloudWatch를 통한 상세 실행 로그
- **메트릭 수집**: 명령 실행 횟수, 성공률 등 메트릭 수집
- **디버깅 지원**: 개발 및 테스트를 위한 디버깅 정보 제공
- **성능 모니터링**: 실행 시간 및 리소스 사용량 모니터링

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client        │───▶│   Lambda         │───▶│   Robot          │
│  (Direct Call)  │    │   Function       │    │   Hardware       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   CloudWatch     │    │   Feedback       │
                       │   (Logs/Metrics) │    │   System        │
                       └──────────────────┘    └─────────────────┘
```

## 📋 지원하는 로봇 명령

### 기본 동작 명령
| Action | 설명 | 사용 예시 |
|--------|------|-----------|
| `탐지` 또는 `detected` | 탐지 상태 표현 | "사물을 감지했습니다" |
| `normal` | 정상 상태 표현 | "일상적인 작업을 수행합니다" |
| `stand` | 서기 동작 | "일어서세요" |
| `sit` | 앉기 동작 | "앉으세요" |
| `hello` | 인사 동작 | "안녕하세요!" |
| `stretch` | 스트레치 동작 | "몸을 풀어보세요" |
| `scrape` | 긁기 동작 | "긁어보세요" |
| `heart` | 하트 표현 동작 | "사랑해요" |
| `dance1` | 첫 번째 댄스 | "춤춰보세요" |
| `dance2` | 두 번째 댄스 | "또 다른 춤" |
| `stop_move` | 움직임 정지 | "움직임을 멈추세요" |

### 이동 명령
| Action | 설명 | 사용 예시 |
|--------|------|-----------|
| `from1to2` | 위치 1에서 위치 2로 이동 | "위치 2로 이동합니다" |
| `from2to0` | 위치 2에서 위치 0으로 이동 | "위치 0으로 이동합니다" |
| `from0to1` | 위치 0에서 위치 1로 이동 | "위치 1로 이동합니다" |

### 커스텀 명령
- **기타 모든 action**: 코드에서 정의되지 않은 action도 그대로 전달되어 로봇에서 처리됩니다.

## ⚙️ 설치 및 설정

### 1. AWS 리소스 생성

```bash
# 로봇 컨트롤러 설치
python create_robo_controller.py
```

이 스크립트는 다음 AWS 리소스들을 생성합니다:
- Lambda 함수 (`lambda-robo-controller-for-robo`)
- 필요한 IAM 역할 및 정책
- CloudWatch 로그 그룹
- 환경 변수 설정

### 2. Lambda 함수 설정

```python
# Lambda 함수 생성
lambda_function_name = 'lambda-' + current_folder_name + '-for-' + config['projectName']

# 함수 코드 패키징
with zipfile.ZipFile(lambda_function_zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:            
    for root, dirs, files in os.walk(lambda_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, lambda_dir)
            zip_file.write(file_path, arcname)

response = lambda_client.create_function(
    FunctionName=lambda_function_name,
    Runtime='python3.13',
    Handler='lambda_function.lambda_handler',
    Role=lambda_function_role,
    Description=f'Lambda function for {lambda_function_name}',
    Timeout=60,
    Code={
        'ZipFile': open(lambda_function_zip_path, 'rb').read()
    }
)
```

### 3. 환경 변수 설정

```python
# 환경 변수 설정
lambda_client.update_function_configuration(
    FunctionName=lambda_function_name,
    Environment={
        'Variables': {
            'TOPIC': 'robot/control'  # MQTT 토픽 설정
        }
    }
)
```

**사용되는 환경 변수:**
- `TOPIC`: MQTT 토픽 이름 (기본값: 'robot/control')

## 🔧 Lambda 함수 구현

### 핵심 처리 로직

```python
import json
import boto3
import logging
from datetime import datetime

# 로깅 설정
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """로봇 제어 명령을 처리하는 Lambda 함수"""
    
    try:
        # 입력 데이터 검증
        action = event.get('action')
        message = event.get('message', '')
        
        if not action:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Action is required',
                    'timestamp': datetime.now().isoformat()
                })
            }
        
        # 로봇 제어 명령 실행
        result = execute_robot_command(action, message)
        
        # 성공 응답 반환
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'success',
                'action': action,
                'message': message,
                'result': result,
                'timestamp': datetime.now().isoformat(),
                'request_id': context.aws_request_id
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing robot command: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'request_id': context.aws_request_id
            })
        }

def execute_robot_command(action, message):
    """실제 로봇 제어 명령을 실행하는 함수"""
    
    # 지원하는 액션 목록
    supported_actions = ['탐지', 'detected', 'from1to2', 'from2to0', 'from0to1', 'normal', 'stop_move', 'stand', 'sit', 'hello', 'stretch', 'scrape', 'heart', 'dance1', 'dance2']
    
    if action not in supported_actions:
        raise ValueError(f"Unsupported action: {action}")
    
    # 로봇 제어 로직 구현
    robot_response = {
        "action_executed": action,
        "message_delivered": message,
        "robot_status": "active",
        "execution_time": datetime.now().isoformat(),
        "battery_level": 85.0,  # 실제 로봇에서 가져올 값
        "location": {
            "x": 10.5,
            "y": 20.3,
            "z": 0.0
        }
    }
    
    # 실제 로봇 하드웨어 제어 (예시)
    # robot_client = RobotClient()
    # robot_client.send_command(action, message)
    
    logger.info(f"Robot command executed: {action} - {message}")
    
    return robot_response
```

## 🔧 사용 방법

### 1. 직접 Lambda 호출

```python
import boto3
import json

def test_robo_controller(lambda_function_name, action, message):
    """로봇 컨트롤러 Lambda 함수 테스트"""
    
    # 페이로드 구성
    payload = {
        'action': action,
        'message': message
    }
    
    print(f"페이로드: {payload}")
    
    # Lambda 클라이언트 생성
    lambda_client = boto3.client(
        service_name='lambda',
        region_name='us-west-2'
    )
    
    try:
        # Lambda 함수 호출
        response = lambda_client.invoke(
            FunctionName=lambda_function_name,
            Payload=json.dumps(payload),
            InvocationType='RequestResponse'  # 동기 호출
        )
        
        # 응답 처리
        response_payload = json.loads(response['Payload'].read())
        print(f"응답: {response_payload}")
        
        return response_payload
        
    except Exception as e:
        print(f"오류 발생: {str(e)}")
        return None

# 사용 예시
action = 'hello'
message = '안녕하세요!'
result = test_robo_controller('lambda-robo-controller-for-robo', action, message)
```

### 2. 비동기 호출

```python
# 비동기 호출 (Fire and Forget)
response = lambda_client.invoke(
    FunctionName=lambda_function_name,
    Payload=json.dumps(payload),
    InvocationType='Event'  # 비동기 호출
)
```

### 3. 배치 처리

```python
# 여러 명령을 배치로 처리
commands = [
    {'action': 'hello', 'message': '첫 번째 인사'},
    {'action': 'stand', 'message': '두 번째 서기'},
    {'action': 'dance1', 'message': '세 번째 춤'}
]

for command in commands:
    result = test_robo_controller(lambda_function_name, 
                                 command['action'], 
                                 command['message'])
    print(f"명령 실행 결과: {result}")
```

## 🧪 테스트

### 1. 기본 기능 테스트

```bash
# 로봇 컨트롤러 테스트
python test_robot_controller.py
```

### 2. 테스트 시나리오

```python
def run_test_scenarios():
    """다양한 테스트 시나리오 실행"""
    
    test_cases = [
        {
            'name': '기본 동작 테스트',
            'action': 'hello',
            'message': '테스트 메시지'
        },
        {
            'name': '긴 메시지 테스트',
            'action': 'stand',
            'message': '이것은 매우 긴 테스트 메시지입니다. 로봇이 긴 메시지를 올바르게 처리할 수 있는지 확인합니다.'
        },
        {
            'name': '특수 문자 테스트',
            'action': 'dance1',
            'message': '특수문자: !@#$%^&*()_+-=[]{}|;:,.<>?'
        },
        {
            'name': '한글 메시지 테스트',
            'action': 'heart',
            'message': '한글 메시지 테스트입니다. 로봇이 한글을 올바르게 처리할 수 있는지 확인합니다.'
        },
        {
            'name': '이동 명령 테스트',
            'action': 'from1to2',
            'message': '위치 이동 테스트입니다.'
        }
    ]
    
    for test_case in test_cases:
        print(f"\n🧪 {test_case['name']}")
        result = test_robo_controller(
            'lambda-robo-controller-for-robo',
            test_case['action'],
            test_case['message']
        )
        
        if result and result.get('statusCode') == 200:
            print("✅ 테스트 성공")
        else:
            print("❌ 테스트 실패")

# 테스트 실행
run_test_scenarios()
```

### 3. 테스트 결과 예시

```
🤖 로봇 컨트롤러 테스트 시작
✅ Lambda 함수 연결 성공: lambda-robo-controller-for-robo

🧪 기본 동작 테스트
페이로드: {'action': 'hello', 'message': '테스트 메시지'}
응답: {
  "statusCode": 200,
  "body": "{\"status\": \"success\", \"action\": \"hello\", \"message\": \"테스트 메시지\", \"result\": {...}}"
}
✅ 테스트 성공

🧪 긴 메시지 테스트
페이로드: {'action': 'stand', 'message': '이것은 매우 긴 테스트 메시지입니다...'}
응답: {...}
✅ 테스트 성공
```

## 📊 모니터링 및 로깅

### CloudWatch 로그

```python
# 로그 메시지 예시
{
    "timestamp": "2024-01-01T00:00:00Z",
    "level": "INFO",
    "message": "Robot command executed: hello - 안녕하세요!",
    "request_id": "abc123-def456-ghi789",
    "action": "hello",
    "message_length": 12,
    "execution_time_ms": 150
}
```

### 메트릭 수집

```python
# CloudWatch 메트릭 전송
cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_data(
    Namespace='RobotController',
    MetricData=[
        {
            'MetricName': 'CommandsExecuted',
            'Value': 1,
            'Unit': 'Count',
            'Dimensions': [
                {
                    'Name': 'Action',
                    'Value': action
                }
            ]
        },
        {
            'MetricName': 'ExecutionTime',
            'Value': execution_time_ms,
            'Unit': 'Milliseconds'
        }
    ]
)
```

## 📚 추가 리소스

- [AWS Lambda 함수 개발 가이드](https://docs.aws.amazon.com/lambda/latest/dg/python-programming-model.html)
- [CloudWatch 로깅 가이드](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [Lambda 모니터링 가이드](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-functions.html)
