# 🎮 Agentic RoboDog - Web Interface

> **AI-based Robot Control and Monitoring Web Application**

<p>
  | <a href="./README.md">English</a> | <a href="./README-ko.md">한국어</a> |
</p>

A modern robot control interface built using React 18, TypeScript, and AWS Amplify. It provides AI conversation through AWS Bedrock AgentCore and real-time robot control functionality, offering users an immersive experience to interact directly with robots using natural language.

<div align="center">
  <img src="../assets/client-app.png" alt="Client Application" />
</div>

## 🚀 Key Features

### 🤖 AI Robot Control
- **Real-time AI Conversation**: Natural language processing through AWS Bedrock AgentCore
- **Robot Control Buttons**: Intuitive button interface for robot action control
- **Quick Commands**: Execute frequently used commands quickly
- **Streaming Response**: Receive AI responses in real-time
- **Natural Language Commands**: Support for natural language commands like "Patrol the danger zone", "Show me the video of where the fire occurred"

### 🎵 Voice Features
- **TTS (Text-to-Speech)**: Korean voice output using AWS Polly
- **Voice Control**: Play, pause, stop functionality
- **Auto Play**: Automatic voice output when AI response is complete
- **Various Voices**: Support for Korean voices like Seoyeon, Jihye

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized experience on all devices
- **Material-UI**: Sophisticated components and animations
- **Real-time Status Display**: Connection status, robot control status, etc.
- **Collapsible Panels**: Space-efficient interface
- **Dark/Light Theme**: Theme change according to user preference

### 🔐 Security and Authentication
- **AWS Cognito**: Secure user authentication
- **IAM Permission Management**: Access only to necessary AWS services
- **Environment Variable Security**: Protection of sensitive information
- **JWT Token Management**: Automatic token renewal and security

### 📊 Real-time Monitoring
- **Robot Status Monitoring**: Real-time display of current location, status, sensor data
- **IoT Sensor Data**: Visualization of temperature, gas, and other sensor information
- **Video Streaming**: Real-time video through Kinesis Video Streams
- **Danger Alert**: Immediate notification and visual emphasis when danger is detected

## 🛠 Technology Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript 4.9.5** - Type safety
- **Create React App** - Development environment and build tools
- **Material-UI 7.3.2** - UI component library
- **React Router 6.28.0** - Client-side routing

### Backend & AI
- **AWS Amplify 6.15.5** - Backend services
- **AWS Bedrock AgentCore** - AI conversation engine
- **AWS Polly** - Text-to-speech conversion
- **AWS Lambda** - Robot control functions
- **AWS Cognito** - User authentication

### Development Tools
- **ESLint** - Code quality management
- **Testing Library** - Component testing
- **Craco** - Create React App configuration override

## 📁 Project Structure

```
amplify-app/
├── src/
│   ├── components/              # Reusable components
│   │   ├── ChatInterface.tsx   # Chat interface
│   │   ├── Layout.tsx          # Main layout
│   │   └── StreamingMessage.tsx # Streaming message component
│   ├── pages/                  # Page components
│   │   ├── Agent.tsx           # AI agent page (main)
│   │   ├── Dashboard.tsx       # Dashboard page
│   │   └── Home.tsx            # Home page
│   ├── lib/                    # Utilities and configuration
│   │   ├── BedrockAgentCore.ts # AI agent communication
│   │   ├── PollyTTS.ts         # Voice synthesis service
│   │   ├── LambdaClient.ts     # Lambda function client
│   │   ├── amplify.ts          # Amplify configuration
│   │   └── aws-credentials.ts  # AWS credentials
│   ├── config/                 # Configuration files
│   │   ├── robotControlButton.json # Robot control button configuration
│   │   └── quickCommandButton.json # Quick command configuration
│   ├── hooks/                  # Custom hooks
│   │   └── useStreamingMessages.ts # Message state management
│   └── App.tsx                 # Main app component
├── amplify/                    # Amplify backend configuration
│   ├── backend.ts              # Backend definition
│   ├── auth/resource.ts        # Authentication configuration
│   └── data/resource.ts        # Data configuration
├── public/                     # Static files
├── package.json                # Dependency management
├── craco.config.js             # CRA configuration override
└── README.md                   # Project documentation
```

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+ 
- npm or yarn
- AWS account with appropriate permissions
- AWS CLI configuration (optional)

### 2. Environment Variable Setup

The frontend manages environment variables through the `src/env.json` file:

```json
{
  "REACT_APP_AWS_REGION": "us-west-2",
  "REACT_APP_AGENT_RUNTIME_ARN": "arn:aws:bedrock-agentcore:us-west-2:YOUR_AWS_ACCOUNT_ID:runtime/YOUR_RUNTIME_NAME",
  "REACT_APP_QUALIFIER": "DEFAULT"
}
```

**Key Environment Variables:**
- `REACT_APP_AWS_REGION`: AWS region (default: us-west-2)
- `REACT_APP_AGENT_RUNTIME_ARN`: Bedrock AgentCore runtime ARN
- `REACT_APP_QUALIFIER`: Runtime qualifier (default: DEFAULT)

> **Note**: `amplify_outputs.json` is automatically generated by Amplify CLI and should not be edited manually.

### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

### 4. Deploy Amplify Backend

```bash
# Deploy Amplify backend
npx ampx sandbox

# or production deployment
npx ampx deploy
```

### 5. Start Development Server

```bash
npm start
# or
yarn start
```

The development server runs at http://localhost:3000.

## 🎮 User Experience

### 1. Autonomous Patrol Observation
- Observe intelligent robot dog autonomously patrolling designated factory environment in real-time
- Instantly detect various dangerous situations such as fire outbreaks, dangerous worker gestures, equipment abnormalities through cameras mounted on the robot
- Confirm that danger information is displayed on the real-time dashboard

### 2. Natural Language Command Experience
- Users can give natural language commands through voice or text
- Support for natural language commands like "Patrol the danger zone", "Show me the video of where the fire occurred"
- Directly confirm the process where AI agent and MCP server understand commands and robot immediately performs the task

### 3. Integrated Monitoring
- Integrated monitoring through Amazon Managed Grafana dashboard
- Real-time display of robot's current location, status, sensor data (temperature, gas, etc.)
- Real-time video stream through Kinesis Video Streams
- Visual emphasis of related data with warning alerts when dangerous situations occur

## 🎮 Usage

### 1. Login
- Secure login through AWS Cognito
- Support for email/password or social login
- Seamless user experience with automatic token renewal

### 2. AI Conversation
- Enter message in text input field
- Send message with Enter key or send button
- Receive AI responses in real-time
- Immediate feedback through streaming responses

### 3. Robot Control
- Use robot control buttons in left panel
- Execute various commands like movement, actions, gestures
- Each button provides intuitive icons and descriptions
- Execute frequently used commands immediately with quick command buttons

### 4. Voice Features
- Enable TTS functionality in settings
- Automatic voice output of AI responses
- Control play, pause, stop
- Select various Korean voices

### 5. Real-time Monitoring
- Check real-time information in robot status dashboard
- Visualize IoT sensor data
- Check robot's view through video stream
- Immediate alerts when dangerous situations occur

## 🔧 Development Guide

### Component Writing

When writing new components, use TypeScript and Material-UI:

```tsx
import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { styled } from '@mui/material/styles'

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  // ... additional styles
}))

interface MyComponentProps {
  title: string
  onAction: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
      <StyledButton onClick={onAction}>
        Execute
      </StyledButton>
    </Box>
  )
}
```

### API Communication

Use dedicated clients for communication with AWS services:

```tsx
import { invokeAgentCore } from '../lib/BedrockAgentCore'
import { ttsService } from '../lib/PollyTTS'

// Invoke AI agent
const stream = await invokeAgentCore(prompt, sessionId, debugMode)

// TTS playback
await ttsService.speak(text, { speechRate: 120 })
```

### State Management

Use custom hooks to manage state:

```tsx
import { useStreamingMessages } from '../hooks/useStreamingMessages'

function MyComponent() {
  const { messages, addMessage, updateMessage } = useStreamingMessages()
  
  // Add message
  const messageId = addMessage({
    type: 'chunk',
    data: 'Hello World',
    isUser: false,
  })
}
```

## 🚀 Deployment

### Development Environment

```bash
npm run build
npm run start
```

### Production Deployment

```bash
# Deploy Amplify backend
npx ampx deploy

# Build frontend
npm run build

# Deploy to S3 (automatic when using Amplify hosting)
```

## 🎭 Usage Scenarios

### Scenario 1: Autonomous Patrol and Danger Detection
1. **Start Robot Autonomous Patrol**: Robot autonomously patrols designated factory environment
2. **Detect Dangerous Situations**: Detect fire, gas leaks, worker safety hazards, etc.
3. **Real-time Alerts**: Immediately display dangerous situations on dashboard
4. **AI Analysis**: AI analyzes situation and suggests response measures

### Scenario 2: Natural Language Command Experience
1. **User Participation**: User inputs commands in natural language
2. **AI Command Interpretation**: "Patrol the danger zone" → Robot control command conversion
3. **Robot Execution**: Robot immediately performs the task
4. **Result Feedback**: Confirm execution results in real-time

### Scenario 3: Emergency Situation Response
1. **Emergency Situation Occurrence**: Detect emergency situations like fire, gas leaks
2. **Automatic Response**: AI analyzes situation and establishes optimal response measures
3. **Robot Control**: Emergency stop, evacuation route guidance, rescue request, etc.
4. **Situation Report**: Provide detailed situation report to administrators

## 🧪 Testing

### Unit Testing
```bash
# Run tests
npm test

# Test coverage
npm run test:coverage
```

### Integration Testing
```bash
# Full system test
npm run test:integration

# E2E test
npm run test:e2e
```

### Performance Testing
```bash
# Load test
npm run test:load

# Memory usage test
npm run test:memory
```