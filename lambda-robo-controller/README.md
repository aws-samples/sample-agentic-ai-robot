# 🤖 로봇 직접 제어 시스템

> **Lambda 기반 로봇 제어 명령 실행 엔진**

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

### 기본 감정 표현 동작
| Action | 설명 | 사용 예시 |
|--------|------|-----------|
| `HAPPY` | 기쁜 상태 표현 | "오늘은 정말 멋지네요!" |
| `NEUTRAL` | 중립적 상태 표현 | "일상적인 작업을 수행합니다" |
| `SAD` | 슬픈 상태 표현 | "안타까운 상황이 발생했네요" |
| `ANGRY` | 화난 상태 표현 | "위험한 상황을 감지했습니다!" |

### 확장 가능한 명령 (향후 추가)
- **이동 명령**: `MOVE_FORWARD`, `MOVE_BACKWARD`, `TURN_LEFT`, `TURN_RIGHT`
- **제스처 명령**: `WAVE_HAND`, `NOD_HEAD`, `SHAKE_HEAD`
- **비상 명령**: `EMERGENCY_STOP`, `CALL_HELP`, `EVACUATE`
- **상태 명령**: `CHECK_BATTERY`, `SELF_DIAGNOSTIC`, `REPORT_STATUS`

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
    supported_actions = ['HAPPY', 'NEUTRAL', 'SAD', 'ANGRY']
    
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
action = 'HAPPY'
message = '오늘은 정말 멋지네요!'
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
    {'action': 'HAPPY', 'message': '첫 번째 명령'},
    {'action': 'NEUTRAL', 'message': '두 번째 명령'},
    {'action': 'SAD', 'message': '세 번째 명령'}
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
            'name': '기본 감정 표현 테스트',
            'action': 'HAPPY',
            'message': '테스트 메시지'
        },
        {
            'name': '긴 메시지 테스트',
            'action': 'NEUTRAL',
            'message': '이것은 매우 긴 테스트 메시지입니다. 로봇이 긴 메시지를 올바르게 처리할 수 있는지 확인합니다.'
        },
        {
            'name': '특수 문자 테스트',
            'action': 'SAD',
            'message': '특수문자: !@#$%^&*()_+-=[]{}|;:,.<>?'
        },
        {
            'name': '한글 메시지 테스트',
            'action': 'ANGRY',
            'message': '한글 메시지 테스트입니다. 로봇이 한글을 올바르게 처리할 수 있는지 확인합니다.'
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

🧪 기본 감정 표현 테스트
페이로드: {'action': 'HAPPY', 'message': '테스트 메시지'}
응답: {
  "statusCode": 200,
  "body": "{\"status\": \"success\", \"action\": \"HAPPY\", \"message\": \"테스트 메시지\", \"result\": {...}}"
}
✅ 테스트 성공

🧪 긴 메시지 테스트
페이로드: {'action': 'NEUTRAL', 'message': '이것은 매우 긴 테스트 메시지입니다...'}
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
    "message": "Robot command executed: HAPPY - 오늘은 정말 멋지네요!",
    "request_id": "abc123-def456-ghi789",
    "action": "HAPPY",
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

## 🔒 보안 고려사항

### IAM 권한 최소화
- Lambda 함수에 필요한 최소 권한만 부여
- 로봇 하드웨어 접근 권한만 허용
- CloudWatch 로그 쓰기 권한

### 입력 검증
- 액션 값 화이트리스트 검증
- 메시지 길이 제한
- 특수 문자 필터링

### 오류 처리
- 민감한 정보 로그에서 제외
- 상세한 오류 정보 클라이언트에 노출 방지
- 재시도 로직 구현

## 📚 추가 리소스

- [AWS Lambda 함수 개발 가이드](https://docs.aws.amazon.com/lambda/latest/dg/python-programming-model.html)
- [CloudWatch 로깅 가이드](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [Lambda 모니터링 가이드](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-functions.html)
