# Agentic AI Robot: Industrial Safety Monitoring with AI and MCP

<div align="center">
  <img src="./assets/logo.png" alt="Logo" width="100"/>
</div>

This sample demonstrates how to build an intelligent robot control system using Amazon Bedrock models, Model Context Protocol (MCP), and AWS services. The project showcases agentic AI patterns for real-time robot command processing, emergency detection, and human-robot interaction in industrial safety scenarios.

> **한국어 문서**: [README-ko.md](README-ko.md)를 참조하세요.

## Overview

This project combines Agentic AI, IoT, and robotics to create a next-generation industrial safety management solution. An intelligent robot autonomously patrols hazardous areas, collects data, performs edge inference, and an AI agent comprehensively analyzes this information to control patrol routes and responses in real-time.

<div align="center">
  <img src="./assets/booth.jpeg" alt="Demo Booth Setup"/>
</div>

<div align="center">
  <img src="./assets/client-app.png" alt="Client Application" />
</div>

*This project was demonstrated at AWS AI x Industry Week.*

### Key Features

- **🧠 Agentic AI-based Autonomous Control**: Intelligently handles unpredictable situations
- **🗣️ Natural Language Robot Control**: Easy interaction for non-technical users
- **🔄 Fully Integrated AWS Services**: Complete integration from data collection to visualization
- **⚡ Real-time Edge Inference**: Immediate hazard detection and response without network latency

## 🎥 Demo Video

*Click the image above to watch our full demonstration video of the Agentic AI Robot in action.*

| Demo Video 1 | Demo Video 2 |
|:---:|:---:|
| [![Demo1](https://img.youtube.com/vi/plwrFz4fmFg/0.jpg)](https://www.youtube.com/shorts/plwrFz4fmFg) | [![Demo2](https://img.youtube.com/vi/qiS9_LSYsV8/0.jpg)](https://www.youtube.com/shorts/qiS9_LSYsV8) |

## Architecture

<img width="800" alt="architecture_robo" src="./assets/architecture.png" />

### Technology Stack

- **🧠 Agentic AI & MCP Server**: Amazon Bedrock AgentCore, Strands Agent SDK, AWS Lambda
- **🤖 Robot Control & IoT Integration**: AWS IoT Core, IoT Greengrass
- **📹 Real-time Video Streaming**: Amazon Kinesis Video Streams
- **📊 Data Collection & Visualization**: AWS IoT SiteWise, Amazon Grafana

## Core Components

### 1. Autonomous Patrol & Real-time Hazard Detection
- Intelligent robot autonomously patrols designated factory environments
- Instant detection of various hazard situations: fire outbreaks, dangerous worker gestures, equipment abnormalities
- Real-time dashboard display of hazard information

### 2. Natural Language Robot Control
- Natural language commands like "Patrol the hazardous area" or "Show me the video from where the fire occurred"
- AI agent and MCP server understand commands and convert them to robot control signals
- Real-time verification of task execution

### 3. Integrated Control Dashboard
- Unified monitoring through Amazon Managed Grafana dashboard
- Real-time display of robot's current location, status, sensor data (temperature, gas, etc.)
- Real-time video streams through Kinesis Video Streams
- Visual emphasis of related data with warning alerts when hazard situations occur

## Technical Implementation

### Agentic AI & MCP
- Natural language command interpretation using Strands Agent SDK
- AI construction that comprehensively plans robot behavior by integrating various sensor data
- AI Agent and MCP server deployed in Bedrock AgentCore environment

### IoT & Robotics
- Secure cloud connection of robots and sensors through AWS IoT Core
- Edge computing environment construction through IoT Greengrass
- Real-time inference such as gesture recognition and fire detection

### Real-time Video Processing & Analysis
- Real-time video data streaming through Kinesis Video Streams
- Video analysis through AI models on Greengrass or cloud
- Real-time processing for hazard situation detection

### Data Integration & Visualization
- Integration of robot status and IoT sensor data through AWS IoT SiteWise
- Intuitive dashboard provision through Amazon Managed Grafana

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

## AWS Services Used

- **Amazon Bedrock**: Language and vision models for reasoning and image analysis
- **Amazon Bedrock AgentCore**: Agent runtime environment with MCP integration
- **Amazon SQS**: FIFO queues for robot data streaming
- **Amazon Cognito**: User authentication
- **AWS Secrets Manager**: Secure credential storage
- **Amazon S3**: Image storage for analysis
- **AWS IoT Core**: Device connectivity and messaging
- **AWS Lambda**: Serverless compute for processing
- **AWS Polly**: Text-to-speech conversion

---

## Getting Started

### Prerequisites

- **AWS Account** with Bedrock access enabled
- **Python 3.9+** and pip
- **Node.js 18+** and npm/yarn
- **AWS CLI** configured with appropriate permissions
- Basic understanding of AI agents and IoT concepts

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/aws-samples/sample-agentic-ai-robot.git
   cd sample-agentic-ai-robot
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.template .env
   
   # Edit with your AWS resource values
   nano .env
   
   # Generate all configuration files
   python scripts/generate_configs.py
   ```
   
   > **📋 Detailed Configuration Guide**: See [CONFIGURATION.md](CONFIGURATION.md) for comprehensive environment setup instructions and configuration file management.

3. **Deploy Backend Services**
   ```bash
   # Install backend dependencies
   cd agent-runtime
   pip install -r requirements.txt
   
   # Deploy AgentCore runtime
   ./scripts/deploy.sh
   ```

4. **Setup Frontend Application**
   ```bash
   # Navigate to frontend directory
   cd ../amplify-frontend
   
   # Install dependencies
   npm install
   
   # Deploy Amplify backend
   npx ampx sandbox
   
   # Start development server
   npm start
   ```

5. **Deploy IoT Components**
   ```bash
   # Return to root directory
   cd ..
   
   # Deploy feedback manager
   cd feedback-manager
   python create_feedback_manager.py
   
   # Deploy robot controller
   cd ../robo-controller
   python create_robo_controller.py
   
   # Deploy MCP gateway
   cd ../agent-gateway
   python mcp-interface/create_gateway_tool.py
   ```

### Configuration Files

The project uses centralized configuration management:

| File | Purpose | Location |
|------|---------|----------|
| `.env` | Master environment variables | Root directory |
| `config.json` | Agent runtime configuration | `agent-runtime/config/` |
| `amplify_outputs.json` | Amplify backend config | `amplify-frontend/` |
| `env.json` | Frontend environment | `amplify-frontend/src/` |

### Component Overview

| Component | Purpose | Technology |
|-----------|---------|------------|
| **agent-runtime** | AI agent backend | Amazon Bedrock, Python |
| **agent-gateway** | MCP server for robot control | AWS Lambda, MCP |
| **amplify-frontend** | Web interface | React, AWS Amplify |
| **feedback-manager** | IoT data processing | AWS IoT Core, SQS |
| **robo-controller** | Direct robot commands | AWS Lambda |
| **robo-polly** | Text-to-speech | AWS Polly |

## Contributors

We would like to thank the following contributors for their valuable contributions to this project:

- **Development** - [Jinseon Lee](https://www.linkedin.com/in/jinseon-lee-160a2a13b), [Yoojung Lee](https://www.linkedin.com/in/yoo-lee), [Kyoungsu Park](https://www.linkedin.com/in/kyoungsu-park-9b9a1068), [YeonKyung Park](https://www.linkedin.com/in/yeon-kyung-park-790b52195), [Sejin Kim](https://www.linkedin.com/in/saygenie)
  
- **Support** - [Cheolmin Ki](https://www.linkedin.com/in/cheolminki), [Yongjin Lee](https://www.linkedin.com/in/yongjin-lee-1167a710), [Hyewon Lee](https://www.linkedin.com/in/hyewon-l-629b55188), [Areum Lee](https://www.linkedin.com/in/areum-l-752258386)

---

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
