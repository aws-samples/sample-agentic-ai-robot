import React, { useRef, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Avatar,
  Chip,
  IconButton,
  Alert,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import {
  Send as SendIcon,
  SmartToy as RobotIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import StreamingMessage from './StreamingMessage'
import { StreamMessage } from './StreamingMessage'

// 스타일드 컴포넌트
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  border: `1px solid rgba(226, 232, 240, 0.8)`,
  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    borderColor: theme.palette.primary.light,
    transform: 'translateY(-2px)',
  },
}))

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  padding: '12px 20px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fontSize: '0.875rem',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  '&.MuiButton-contained': {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    '&:hover': {
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    },
  },
}))

interface AgentCoreStatus {
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

interface ChatInterfaceProps {
  messages: StreamMessage[]
  inputText: string
  setInputText: (text: string) => void
  onSendMessage: (text: string) => void
  onResetChat: () => void
  agentCoreStatus: AgentCoreStatus
  isDisabled?: boolean
  onTTSPlay?: (text: string) => void
  onTTSPause?: () => void
  onTTSStop?: () => void
  ttsStatus?: {
    isEnabled: boolean
    isPlaying: boolean
    isPaused: boolean
    hasAudio: boolean
    currentText: string
  }
}

export default function ChatInterface({
  messages,
  inputText,
  setInputText,
  onSendMessage,
  onResetChat,
  agentCoreStatus,
  isDisabled = false,
  onTTSPlay,
  onTTSPause,
  onTTSStop,
  ttsStatus,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage(inputText)
    }
  }

  return (
    <StyledCard sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '400px', // 최소 높이 보장
      height: '100%', // 부모 컨테이너의 높이를 모두 사용
      maxHeight: '100%' // 부모 컨테이너 높이를 최대한 활용
    }}>
      {/* 채팅 헤더 */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        borderRadius: '20px 20px 0 0'
      }}>
        <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 36, height: 36 }}>
          <RobotIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>
            Agentic RoboDog
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            AI를 통해 실시간 로봇 제어 및 모니터링
          </Typography>
        </Box>
        <Chip 
          label={agentCoreStatus.isLoading ? "연결중..." : 
                 agentCoreStatus.isConnected ? "온라인" : "오프라인"} 
          color={agentCoreStatus.isLoading ? "warning" : 
                 agentCoreStatus.isConnected ? "success" : "error"} 
          size="small" 
          sx={{ 
            ml: 'auto',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            '& .MuiChip-label': {
              color: 'white',
            }
          }} 
        />
        <IconButton
          onClick={onResetChat}
          size="small"
          disabled={isDisabled}
          sx={{ 
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* AgentCore 연결 오류 알림 */}
      {agentCoreStatus.error && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              AgentCore 연결 오류: {agentCoreStatus.error}
            </Typography>
          </Alert>
        </Box>
      )}

      {/* 채팅 메시지 영역 */}
      <Box sx={{ 
        flex: 1, 
        p: 2, 
        overflow: 'auto', 
        minHeight: 0,
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        {messages.map((message) => (
          <StreamingMessage
            key={message.id}
            message={message}
            isUser={message.isUser ?? false}
            onTTSPlay={onTTSPlay}
            onTTSPause={onTTSPause}
            onTTSStop={onTTSStop}
            ttsStatus={ttsStatus}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* 입력 영역 - 패널 하단 고정 */}
      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '0 0 20px 20px'
      }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            placeholder={isDisabled ? "AI 응답을 기다리는 중..." : "메시지를 입력하세요..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            multiline
            maxRows={3}
            disabled={isDisabled}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2,
                bgcolor: isDisabled ? 'grey.100' : 'grey.50'
              } 
            }}
          />
          <IconButton
            color="primary"
            onClick={() => onSendMessage(inputText)}
            disabled={!inputText.trim() || isDisabled}
            sx={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white', 
              width: 40,
              height: 40,
              borderRadius: 2,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              },
              '&:disabled': { 
                background: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
                transform: 'none',
                boxShadow: 'none'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </StyledCard>
  )
}
