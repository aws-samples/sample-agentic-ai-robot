# 📡 IoT 피드백 처리 시스템

> **로봇 상태 및 센서 데이터 실시간 수집 및 처리**

이 컴포넌트는 로봇에서 전송되는 피드백 메시지를 AWS IoT Core를 통해 수신하고, SQS FIFO 큐를 통해 순차적으로 처리하는 시스템입니다. 로봇의 상태 정보, 센서 데이터, 작업 결과 등을 실시간으로 수집하여 AI 에이전트가 상황을 분석하고 적절한 대응을 할 수 있도록 지원합니다.

## 🎯 주요 기능

### 📊 실시간 피드백 수집
- **IoT Core 연동**: 로봇에서 전송되는 피드백 메시지 실시간 수신
- **SQS FIFO 큐**: 순차적 메시지 처리로 데이터 일관성 보장
- **자동 스케일링**: 메시지 양에 따른 자동 확장/축소
- **오류 복구**: 메시지 처리 실패 시 자동 재시도

### 🔄 데이터 처리 파이프라인
- **메시지 변환**: IoT 메시지를 표준화된 형식으로 변환
- **메타데이터 추가**: 타임스탬프, 소스 정보 등 메타데이터 추가
- **우선순위 처리**: 긴급 메시지 우선 처리
- **배치 처리**: 효율적인 메시지 배치 처리

### 📈 모니터링 및 분석
- **실시간 모니터링**: 큐 상태 및 처리 성능 모니터링
- **메트릭 수집**: 처리량, 지연시간, 오류율 등 메트릭 수집
- **알림 시스템**: 이상 상황 발생 시 즉시 알림
- **로그 관리**: 상세한 처리 로그 및 디버깅 정보

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Robot         │───▶│   AWS IoT Core   │───▶│   Lambda        │
│  (Feedback)     │    │   (Topic:        │    │   Function      │
│                 │    │   robo/feedback) │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   IoT Rule       │    │   SQS FIFO      │
                       │   (SQL Filter)   │    │   Queue         │
                       └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Client        │
                                               │  (Processing)  │
                                               └─────────────────┘
```

## 📋 피드백 메시지 형식

### 기본 메시지 구조
```json
{
    "robot_id": "robo-dog-001",
    "timestamp": "2024-01-01T00:00:00Z",
    "status": "success",
    "message": "순찰 완료",
    "location": {
        "x": 10.5,
        "y": 20.3,
        "z": 0.0
    },
    "sensors": {
        "temperature": 25.5,
        "humidity": 60.2,
        "gas_level": 0.1
    },
    "battery": 85.0,
    "task_id": "patrol_001"
}
```

### 위험 상황 메시지
```json
{
    "robot_id": "robo-dog-001",
    "timestamp": "2024-01-01T00:00:00Z",
    "status": "warning",
    "message": "화재 감지",
    "location": {
        "x": 15.2,
        "y": 8.7,
        "z": 0.0
    },
    "sensors": {
        "temperature": 45.8,
        "smoke_detector": true,
        "gas_level": 0.3
    },
    "severity": "high",
    "task_id": "patrol_001"
}
```

## ⚙️ 설치 및 설정

### 1. AWS 리소스 생성

```bash
# 피드백 매니저 설치
python create_feedback_manager.py
```

이 스크립트는 다음 AWS 리소스들을 생성합니다:
- SQS FIFO 큐 (`robo_feedback.fifo`)
- IoT Rule (`robo_feedback_rule`)
- Lambda 함수 (`lambda-feedback-manager-for-robo`)
- 필요한 IAM 역할 및 정책

### 2. SQS 큐 설정

```python
# FIFO 큐 생성
sqs_client = boto3.client('sqs', region_name=region)
fifo_queue_name = queue_name if queue_name.endswith('.fifo') else f"{queue_name}.fifo"

response = sqs_client.create_queue(
    QueueName=fifo_queue_name,
    Attributes={
        'VisibilityTimeout': '30',
        'MessageRetentionPeriod': '1209600',  # 14 days
        'FifoQueue': 'true',
        'ContentBasedDeduplication': 'true'  # 내용 기반 중복 제거
    }
)
```

### 3. IoT Rule 설정

```python
# IoT Rule 생성
iot_client = boto3.client('iot', region_name=region)
sql_statement = f"SELECT * FROM '{topic_filter}'"

lambda_action = {
    'lambda': {
        'functionArn': lambda_function_arn
    }
}

iot_client.replace_topic_rule(
    ruleName=rule_name,
    topicRulePayload={
        'sql': sql_statement,
        'actions': [lambda_action],
        'ruleDisabled': False,
        'description': f'IoT rule to trigger Lambda for {topic_filter} topic'
    }
)
```

### 4. Lambda 함수 설정

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

## 🔧 Lambda 함수 구현

### 핵심 처리 로직

```python
def lambda_handler(event, context):
    """IoT Core에서 수신된 피드백 메시지를 SQS에 전송"""
    sqs = boto3.client('sqs')
    region = os.environ.get('AWS_REGION', 'us-west-2')
    account_id = context.invoked_function_arn.split(':')[4]
    
    # SQS 큐 URL 구성
    queue_url = f"https://sqs.{region}.amazonaws.com/{account_id}/robo_feedback.fifo"
    
    try:
        # 메시지를 SQS에 전송
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(event),
            MessageGroupId='robo-feedback-group',  # FIFO 큐 필수
            MessageDeduplicationId=str(context.aws_request_id),  # FIFO 큐 필수
            MessageAttributes={
                'source': {
                    'StringValue': 'iot-core',
                    'DataType': 'String'
                },
                'timestamp': {
                    'StringValue': str(context.aws_request_id),
                    'DataType': 'String'
                },
                'robot_id': {
                    'StringValue': event.get('robot_id', 'unknown'),
                    'DataType': 'String'
                }
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event successfully pushed to SQS',
                'messageId': response['MessageId'],
                'event': event
            })
        }
    except Exception as e:
        logger.error(f"Error processing feedback: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'event': event
            })
        }
```

## 📊 클라이언트에서 피드백 수신

### SQS 메시지 수신

```python
import boto3
import json
import time

def receive_feedback_messages():
    """SQS에서 피드백 메시지를 수신하고 처리"""
    sqs = boto3.client('sqs', region_name=region)
    queue_url = f"https://sqs.{region}.amazonaws.com/{account_id}/robo_feedback.fifo"
    
    # 큐 속성 확인
    sqs.get_queue_attributes(QueueUrl=queue_url, AttributeNames=['All'])
    
    while True:
        try:
            # 메시지 수신 (Long Polling)
            response = sqs.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20,  # Long polling
                MessageAttributeNames=['All']
            )
            
            messages = response.get('Messages', [])
            if messages:
                for message in messages:
                    # 메시지 본문 파싱
                    message_body = json.loads(message['Body'])
                    
                    # 메시지 처리
                    process_feedback_message(message_body, message['MessageAttributes'])
                    
                    # 처리 완료 후 메시지 삭제
                    sqs.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=message['ReceiptHandle']
                    )
            else:
                print("메시지가 없습니다. 대기 중...")
                
        except KeyboardInterrupt:
            print("메시지 수신을 중단합니다.")
            break
        except Exception as e:
            print(f"메시지 수신 중 오류 발생: {str(e)}")
            time.sleep(5)

def process_feedback_message(message_body, message_attributes):
    """피드백 메시지 처리"""
    robot_id = message_attributes.get('robot_id', {}).get('StringValue', 'unknown')
    source = message_attributes.get('source', {}).get('StringValue', 'unknown')
    
    print(f"로봇 {robot_id}에서 피드백 수신:")
    print(f"  상태: {message_body.get('status', 'unknown')}")
    print(f"  메시지: {message_body.get('message', 'N/A')}")
    print(f"  위치: {message_body.get('location', {})}")
    print(f"  센서 데이터: {message_body.get('sensors', {})}")
    print(f"  배터리: {message_body.get('battery', 'N/A')}%")
    print("---")
```

## 🧪 테스트

### 1. 기본 테스트

```bash
# 피드백 시스템 테스트
python test_feedback.py
```

### 2. MQTT 테스트

MQTT Tester를 사용하여 테스트 메시지 전송:

```json
{
    "robot_id": "test-robot-001",
    "timestamp": "2024-01-01T00:00:00Z",
    "status": "success",
    "message": "테스트 메시지",
    "location": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0
    },
    "sensors": {
        "temperature": 25.0,
        "humidity": 50.0
    },
    "battery": 100.0
}
```

### 3. 테스트 결과 예시

```
📡 피드백 시스템 테스트 시작
✅ SQS 큐 연결 성공: https://sqs.ap-northeast-2.amazonaws.com/YOUR_AWS_ACCOUNT_ID/robo_feedback.fifo
✅ IoT Rule 설정 확인
✅ Lambda 함수 배포 완료

🔍 메시지 수신 테스트:
[2024-01-01 00:00:00] 메시지 수신:
  로봇 ID: test-robot-001
  상태: success
  메시지: 테스트 메시지
  위치: {'x': 0.0, 'y': 0.0, 'z': 0.0}
  센서: {'temperature': 25.0, 'humidity': 50.0}
  배터리: 100.0%
```

## 📈 모니터링 및 알림

### CloudWatch 메트릭
- **메시지 수신량**: 분당 수신된 메시지 수
- **처리 지연시간**: 메시지 처리에 걸린 시간
- **오류율**: 처리 실패한 메시지 비율
- **큐 깊이**: 대기 중인 메시지 수

### 알림 설정
```python
# CloudWatch 알림 설정
cloudwatch = boto3.client('cloudwatch')

# 큐 깊이 알림
cloudwatch.put_metric_alarm(
    AlarmName='FeedbackQueueDepth',
    ComparisonOperator='GreaterThanThreshold',
    EvaluationPeriods=1,
    MetricName='ApproximateNumberOfVisibleMessages',
    Namespace='AWS/SQS',
    Period=300,
    Statistic='Average',
    Threshold=100.0,
    ActionsEnabled=True,
    AlarmActions=['arn:aws:sns:region:account:topic-name']
)
```

## 🔒 보안 고려사항

### IAM 권한 최소화
- Lambda 함수에 필요한 최소 권한만 부여
- SQS 큐 접근 권한 제한
- IoT Core 규칙 실행 권한만 허용

### 데이터 암호화
- SQS 메시지 암호화 활성화
- 전송 중 데이터 암호화 (TLS)
- 민감한 정보 마스킹

### 접근 제어
- VPC 엔드포인트를 통한 네트워크 격리
- IP 화이트리스트 설정
- API Gateway를 통한 접근 제어 (선택사항)

## 📚 추가 리소스

- [AWS IoT Core 문서](https://docs.aws.amazon.com/iot/latest/developerguide/)
- [Amazon SQS FIFO 큐 가이드](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html)
- [AWS Lambda 함수 개발 가이드](https://docs.aws.amazon.com/lambda/latest/dg/python-programming-model.html)
- [CloudWatch 모니터링 가이드](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/)
