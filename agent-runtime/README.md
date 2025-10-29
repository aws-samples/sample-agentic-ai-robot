# 🧠 Agentic AI Runtime - Robot Control Backend

> **Intelligent Robot Control System Based on Amazon Bedrock**

<p>
  | <a href="./README.md">English</a> | <a href="./README-ko.md">한국어</a> |
</p>

This component is the core backend service of Agentic AI, implementing an intelligent agent that understands natural language commands and converts them into robot control commands. It provides real-time conversation processing and robot control functionality using Amazon Bedrock models.

## 🎯 Key Features

### 🤖 Intelligent Robot Control
- **Natural Language Command Interpretation**: Converts user natural language input into robot control commands
- **MCP Integration**: Extensible tool integration through Model Context Protocol
- **Command Priority Management**: Handles priority processing for emergency and general commands
- **Real-time Response**: Provides immediate feedback through streaming

### 🧠 AI Agent Engine
- **Bedrock Models**: Utilizes latest generative AI models
- **Conversation Context Management**: Maintains context remembering previous conversation content
- **Multimodal Processing**: Integrates text, image, and sensor data processing
- **Dynamic Planning**: Establishes optimal robot behavior plans based on situations

### 🔄 Real-time Data Processing
- **SQS Streaming**: Sequential data processing through FIFO queues
- **IoT Sensor Integration**: Real-time collection and analysis of various sensor data
- **Event-based Processing**: Ensures high performance through asynchronous event processing
- **Error Recovery**: Automatic retry and error handling mechanisms

## 🏗️ System Architecture

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

## 🚀 Core Components

### 1. Agent Manager (`core/agent_manager.py`)
- Direct communication with Bedrock Claude model
- Conversation session management and context maintenance
- Streaming response processing

### 2. MCP Manager (`core/mcp_manager.py`)
- Model Context Protocol server management
- Tool invocation and response processing
- Robot control command conversion

### 3. Stream Processor (`core/stream_processor.py`)
- Real-time data reception from SQS queues
- IoT sensor data processing
- Event-based notification system

### 4. Memory Hook (`memory/memory_hook.py`)
- Conversation history storage and management
- Context-based response generation
- Long-term memory system

## 📋 Supported Robot Commands (Examples)

- **Patrol Command**: "Please patrol the danger zone"
- **Video Command**: "Show me the video of where the fire occurred"
- **Status Check**: "Tell me the current robot status"
- **Emergency Stop**: "Stop immediately!"

## ⚙️ Installation and Execution

### 1. Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd agent-runtime

# Create and activate virtual environment
uv venv
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt
# Or use pyproject.toml
uv sync
```

### 2. Environment Variable Configuration

#### `config.json` File Setup
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

#### Environment Variable Setup
```bash
# AWS basic configuration (not needed when using IAM roles)
export AWS_REGION=us-west-2

# Cognito authentication configuration (can also be set in config.json)
export COGNITO_CLIENT_ID=your_cognito_client_id
export COGNITO_USERNAME=your_cognito_username
export COGNITO_PASSWORD=your_cognito_password

# AWS Secrets Manager configuration
export SECRET_NAME=your_secret_name_for_bearer_token
```

> **Note**: Most configurations are managed in the `config.json` file. Environment variables are optional, and values set in `config.json` take precedence.

### 3. Execution Methods

#### Bedrock AgentCore Runtime Deployment (Recommended)
```bash
# Install prerequisites
pip install bedrock-agentcore-starter-toolkit jq

# Check AWS CLI configuration
aws sts get-caller-identity

# Execute deployment
./scripts/deploy.sh
```

#### Development Mode (Local Execution)
```bash
# Direct execution
uv run python main.py

# Or use uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Docker Execution
```bash
# Build Docker image
docker build -t agentic-ai-runtime .

# Run Docker container
docker run -p 8000:8000 --env-file .env agentic-ai-runtime
```

## 🔧 Usage

### 1. Start Basic Conversation

```python
from core.agent_manager import AgentManager
from core.mcp_manager import MCPManager

# Initialize Agent Manager
agent_manager = AgentManager()

# Initialize MCP Manager
mcp_manager = MCPManager()

# Start conversation session
session_id = "user_session_001"
user_message = "Hello! Please make the robot happy."

# Generate AI response
response = await agent_manager.process_message(
    message=user_message,
    session_id=session_id
)

print(f"AI response: {response}")
```

### 2. Execute Robot Control Commands

```python
# Create robot control command
robot_command = {
    "action": "HAPPY",
    "message": "Today is really a wonderful day!"
}

# Execute robot control through MCP
result = await mcp_manager.execute_robot_command(robot_command)
print(f"Robot control result: {result}")
```

### 3. Streaming Response Processing

```python
from core.stream_processor import StreamProcessor

# Initialize streaming processor
stream_processor = StreamProcessor()

# Receive real-time data
async def handle_streaming_data():
    async for message in stream_processor.listen_to_queue("robo_feedback"):
        print(f"Received feedback: {message}")
        
        # AI agent analyzes feedback and generates response
        ai_response = await agent_manager.analyze_feedback(message)
        print(f"AI analysis result: {ai_response}")

# Start streaming
await handle_streaming_data()
```

## 🧪 Testing

### 1. Local Testing

```bash
# Basic functionality test
python scripts/test_main.py

# MCP remote connection test
python scripts/test_mcp_remote.py

# Robot tools test
python tools/test_robot_tools.py
```

### 2. Integration Testing

```bash
# Full system integration test
./scripts/test_local.sh

# Check logs
./scripts/logs.sh
```

### 3. Test Result Example

```
🧠 Agent Runtime Test Started
✅ Bedrock connection successful
✅ MCP server connection successful
✅ SQS queue connection successful

🤖 Robot Control Test:
  Input: "Please make the robot happy"
  Output: {"action": "HAPPY", "message": "I'm really happy!"}
  Result: Success

📊 Streaming Test:
  Feedback received: {"status": "success", "timestamp": "2024-01-01T00:00:00Z"}
  AI analysis: "The robot is operating normally."
```

## 📚 Additional Resources

- [Amazon Bedrock Claude Model Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/claude.html)
- [Model Context Protocol (MCP) Documentation](https://modelcontextprotocol.io/)
- [AWS Lambda Function Development Guide](https://docs.aws.amazon.com/lambda/latest/dg/python-programming-model.html)
- [Strands Agent SDK Documentation](https://docs.strands.ai/)