# 🔌 IoT Lambda Managers

> **IoT Core → SQS Bridge Lambda Functions for Robot Data Collection**

<p>
  | <a href="./README.md">English</a> | <a href="./README-ko.md">한국어</a> |
</p>

This folder contains AWS Lambda functions that receive data sent from robots to IoT Core and forward it to SQS FIFO queues. It processes three types of data channels:

## 📦 Components

### 1. Detection Manager
**Purpose**: Collect robot detection/recognition data
- **SQS Queue**: `robo_detection.fifo`
- **IoT Topic**: `robo/detection`
- **Message Types**: Object detection, face recognition, danger situation detection, etc.

### 2. Feedback Manager  
**Purpose**: Real-time collection of robot status and sensor data
- **SQS Queue**: `robo_feedback.fifo`
- **IoT Topic**: `robo/feedback`
- **Message Types**: Robot status, sensor data, task results, battery level, etc.

### 3. Gesture Manager
**Purpose**: Collect robot gesture and action data
- **SQS Queue**: `robo_gesture.fifo`
- **IoT Topic**: `robo/gesture`
- **Message Types**: Robot actions, expressions, events, etc.

## 🏗️ Architecture

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

## 📋 Common Features

All managers follow the same pattern:

### 📥 Input
- **Source**: AWS IoT Core (MQTT messages)
- **Trigger**: Lambda automatically invoked by IoT Rule
- **Format**: JSON messages

### 🔄 Processing
1. Receive message from IoT Core
2. Forward message to SQS FIFO queue
3. Add metadata (timestamp, source, etc.)
4. Deduplication (ContentBasedDeduplication of FIFO queue)

### 📤 Output
- **Destination**: SQS FIFO Queue
- **Features**: 
  - Sequential processing guarantee (FIFO)
  - At-least-once delivery guarantee
  - Message group order guarantee

## 🚀 Deployment Method

Each manager is deployed independently:

```bash
# Deploy Detection Manager
cd detection-manager
python create_detection_manager.py

# Deploy Feedback Manager
cd feedback-manager
python create_feedback_manager.py

# Deploy Gesture Manager
cd gesture-manager
python create_gesture_manager.py
```

Each script creates the following AWS resources:
- SQS FIFO queue
- Lambda function
- IAM roles and policies
- IoT Rule (automatic trigger setup)

## 🔍 Monitoring

All Lambda functions can be monitored in CloudWatch:

- **Metrics**: Invocation count, error rate, duration, cold start
- **Logs**: `/aws/lambda/lambda-{manager}-for-robo`
- **Alarms**: SQS queue depth, Lambda error rate, etc.

## 🧪 Testing

Each manager includes test scripts:

```bash
# Detection test
cd detection-manager
python test_detection.py

# Feedback test
cd feedback-manager
python test_feedback.py

# Gesture test
cd gesture-manager
python test_gesture.py
```

## 📚 Related Documentation

- [Detection Manager](detection-manager/) - Detection/recognition data processing
- [Feedback Manager](feedback-manager/README.md) - Robot status and sensor data
- [Gesture Manager](gesture-manager/) - Gesture and action data

## 🔗 Related Components

Other components that work with these Lambda functions:
- **Agent Runtime** (`../agent-runtime/`) - SQS message consumption and processing
- **Robo Controller** (`../lambda-robo-controller/`) - Robot control command execution
- **Agent Gateway** (`../agent-gateway/`) - MCP interface