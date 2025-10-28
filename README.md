# Robot Agentic AI with Amazon Bedrock and MCP

This sample demonstrates how to build an intelligent robot control system using Amazon Bedrock models, Model Context Protocol (MCP), and AWS services. The project showcases agentic AI patterns for real-time robot command processing, emergency detection, and human-robot interaction.

## Architecture Overview

The sample implements a multi-layered architecture that combines:

- **Amazon Bedrock Models** for natural language understanding and robot command generation
- **Model Context Protocol (MCP)** for extensible tool integration and robot control
- **Amazon Bedrock AgentCore Runtime** for scalable agent deployment
- **AWS SQS FIFO queues** for reliable robot feedback and detection data streaming
- **Amazon Cognito** for secure authentication and authorization
- **AWS Secrets Manager** for secure token management

## Key Features

### 🤖 Intelligent Robot Control
- Natural language to robot command translation
- Real-time command execution with priority queuing
- Emergency stop and operational resume capabilities
- Multi-modal robot interaction (voice, gesture, visual)

### 🛡️ Enterprise-Grade Security
- Amazon Cognito authentication with automatic token refresh
- AWS Secrets Manager for secure credential storage
- Bearer token validation and renewal
- Role-based access control for robot operations

### ⚡ Scalable Agent Runtime
- Amazon Bedrock AgentCore Runtime deployment
- Streaming response capabilities for real-time interaction
- Debug mode for local development and testing
- Configurable retry logic and error handling

## AWS Services Integration

- **Amazon Bedrock**: Language and vision models for reasoning and image analysis
- **Amazon Bedrock AgentCore**: Agent runtime environment with MCP integration
- **Amazon SQS**: FIFO queues for robot data streaming
- **Amazon Cognito**: User authentication
- **AWS Secrets Manager**: Secure credential storage
- **Amazon S3**: Image storage for analysis

## Configuration Management

The sample uses a centralized configuration approach:

```json
{
    "model_id": "us.anthropic.claude-3-5-haiku-20241022-v1:0",
    "gateway_url": "your_mcp_gateway_url",
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

## What You'll Learn

- Building agentic AI systems with Amazon Bedrock
- Integrating tools through Model Context Protocol (MCP)
- Processing real-time data streams with SQS
- Implementing secure authentication patterns
- Deploying agents with Bedrock AgentCore Runtime

## Use Cases

1. **Industrial Safety**: Robots detecting emergency situations in facilities
2. **Human-Robot Collaboration**: Gesture-based robot control in manufacturing
3. **Facility Management**: Voice-controlled robots for maintenance tasks

## Prerequisites

- AWS Account with Bedrock access
- Python 3.9+
- Basic understanding of AI agents

## Getting Started

1. Clone the repository and navigate to the project directory
2. Configure AWS credentials and update `config/config.json`
3. Install dependencies: `uv pip install -r requirements.txt`
5. Test the agent with natural language robot commands

This sample provides a comprehensive foundation for building intelligent robot control systems using AWS AI services and demonstrates best practices for agentic AI development in production environments.