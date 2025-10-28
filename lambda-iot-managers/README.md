# 🔌 IoT Lambda Managers

> **IoT Core → SQS Bridge Lambda Functions for Robot Data Collection**

이 폴더에는 로봇에서 IoT Core로 전송되는 데이터를 수신하여 SQS FIFO 큐로 전달하는 AWS Lambda 함수들이 포함되어 있습니다. 세 가지 타입의 데이터 채널을 처리합니다:

## 📦 구성 요소

### 1. Detection Manager
**목적**: 로봇의 감지/인식 데이터 수집
- **SQS 큐**: `robo_detection.fifo`
- **IoT Topic**: `robo/detection`
- **메시지 타입**: 물체 감지, 얼굴 인식, 위험 상황 감지 등

### 2. Feedback Manager  
**목적**: 로봇 상태 및 센서 데이터 실시간 수집
- **SQS 큐**: `robo_feedback.fifo`
- **IoT Topic**: `robo/feedback`
- **메시지 타입**: 로봇 상태, 센서 데이터, 작업 결과, 배터리 레벨 등

### 3. Gesture Manager
**목적**: 로봇의 제스처 및 동작 데이터 수집
- **SQS 큐**: `robo_gesture.fifo`
- **IoT Topic**: `robo/gesture`
- **메시지 타입**: 로봇 동작, 표현, 이벤트 등

## 🏗️ 아키텍처

```
┌─────────────────┐
│   Robot Device  │
│   (IoT Client)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AWS IoT Core   │
│  (MQTT Broker)  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Detect │ │ Feed. │ │Gesture│
│Manager │ │Manager│ │Manager│
│ Lambda │ │ Lambda│ │ Lambda│
└────┬───┘ └───┬───┘ └───┬───┘
     │         │         │
     ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐
│robo_   │ │robo_   │ │robo_   │
│detec.  │ │feedback│ │gesture │
│.fifo   │ │.fifo   │ │.fifo   │
└────────┘ └────────┘ └────────┘
     │         │         │
     └────┬────┴─────────┘
          ▼
     ┌──────────┐
     │  Agent   │
     │ Runtime  │
     │(Consumer)│
     └──────────┘
```

## 📋 공통 기능

모든 매니저는 동일한 패턴을 따릅니다:

### 📥 입력
- **소스**: AWS IoT Core (MQTT 메시지)
- **트리거**: IoT Rule에 의해 Lambda 자동 호출
- **형식**: JSON 메시지

### 🔄 처리
1. IoT Core에서 메시지 수신
2. 메시지를 SQS FIFO 큐로 전달
3. 메타데이터 추가 (타임스탬프, 소스 등)
4. 중복 제거 (FIFO 큐의 ContentBasedDeduplication)

### 📤 출력
- **목적지**: SQS FIFO Queue
- **특징**: 
  - 순차적 처리 보장 (FIFO)
  - 최소 1회 전달 보장 (at-least-once delivery)
  - 메시지 그룹별 순서 보장

## 🚀 배포 방법

각 매니저는 독립적으로 배포됩니다:

```bash
# Detection Manager 배포
cd detection-manager
python create_detection_manager.py

# Feedback Manager 배포
cd feedback-manager
python create_feedback_manager.py

# Gesture Manager 배포
cd gesture-manager
python create_gesture_manager.py
```

각 스크립트는 다음 AWS 리소스를 생성합니다:
- SQS FIFO 큐
- Lambda 함수
- IAM 역할 및 정책
- IoT Rule (자동 트리거 설정)

## 🔍 모니터링

모든 Lambda 함수는 CloudWatch에서 모니터링할 수 있습니다:

- **메트릭**: 호출 수, 오류율, 지속 시간, 콜드 스타트
- **로그**: `/aws/lambda/lambda-{manager}-for-robo`
- **알람**: SQS 큐 깊이, Lambda 오류율 등

## 🧪 테스트

각 매니저에는 테스트 스크립트가 포함되어 있습니다:

```bash
# Detection 테스트
cd detection-manager
python test_detection.py

# Feedback 테스트
cd feedback-manager
python test_feedback.py

# Gesture 테스트
cd gesture-manager
python test_gesture.py
```

## 📚 관련 문서

- [Detection Manager](detection-manager/) - 감지/인식 데이터 처리
- [Feedback Manager](feedback-manager/README.md) - 로봇 상태 및 센서 데이터
- [Gesture Manager](gesture-manager/) - 제스처 및 동작 데이터

## 🔗 관련 컴포넌트

이 Lambda 함수들과 연계되는 다른 컴포넌트:
- **Agent Runtime** (`../agent-runtime/`) - SQS 메시지 소비 및 처리
- **Robo Controller** (`../robo-controller/`) - 로봇 제어 명령 실행
- **Agent Gateway** (`../agent-gateway/`) - MCP 인터페이스

## 🔒 보안

- **IAM 권한**: 각 Lambda는 최소 권한 원칙에 따라 필요한 권한만 부여
- **암호화**: SQS 메시지 암호화 활성화
- **네트워크**: VPC 엔드포인트를 통한 네트워크 격리 가능
- **검증**: 입력 메시지 유효성 검사 및 오류 처리

