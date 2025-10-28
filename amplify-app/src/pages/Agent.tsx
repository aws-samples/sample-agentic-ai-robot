import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  Chip,
  LinearProgress,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  Collapse,
  IconButton,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import {
  Navigation,
  Pause,
  Stop,
  VerticalAlignTop,
  VerticalAlignBottom,
  WavingHand,
  AccessibilityNew,
  TouchApp,
  MusicNote,
  Favorite,
  Security,
  Assessment,
  Home,
  DirectionsRun,  
  ExpandMore,
} from '@mui/icons-material'
import { invokeAgentCore, processAgentCoreStream, validateEnvironment } from '../lib/BedrockAgentCore'
import { invokeRobotControl, mapButtonTextToAction, isRobotControlButton, RobotAction } from '../lib/LambdaClient'
import ChatInterface from '../components/ChatInterface'
import { useStreamingMessages } from '../hooks/useStreamingMessages'
import { ttsService, TTSOptions } from '../lib/PollyTTS'
import robotControlMapping from '../config/robotControlButton.json'
import quickCommandMapping from '../config/quickCommandButton.json'

// 아이콘 매핑 함수 - 필요한 아이콘만 매핑
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactElement } = {
    Navigation: <Navigation />,
    Pause: <Pause />,
    Stop: <Stop />,
    VerticalAlignTop: <VerticalAlignTop />,
    VerticalAlignBottom: <VerticalAlignBottom />,
    WavingHand: <WavingHand />,
    AccessibilityNew: <AccessibilityNew />,
    TouchApp: <TouchApp />,
    MusicNote: <MusicNote />,
    Favorite: <Favorite />,
    Security: <Security />,
    Assessment: <Assessment />,
    Home: <Home />,
  }
  
  return iconMap[iconName] || <DirectionsRun />
}

interface AgentCoreStatus {
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

interface RobotControlStatus {
  isExecuting: boolean
  lastAction: string | null
  error: string | null
}

interface AIResponseStatus {
  isWaiting: boolean
  isProcessing: boolean
}

interface TTSStatus {
  isEnabled: boolean
  isPlaying: boolean
  isPaused: boolean
  hasAudio: boolean
  currentText: string
  error: string | null
}

// 스타일드 컴포넌트
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  border: `2px solid rgba(203, 213, 225, 0.9)`,
  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    borderColor: theme.palette.primary.light,
    transform: 'translateY(-4px)',
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
    transform: 'translateY(-2px) scale(1.02)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)',
  },
}))

// 반응형 컨테이너 스타일
const ResponsiveContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(100vh - 64px - 28px)', // 헤더와 푸터 높이 제외, minHeight로 변경
  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  width: '100%',
  padding: theme.spacing(3),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'auto', // 스크롤 활성화
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    minHeight: 'calc(100vh - 64px - 28px)', // 작은 화면에서도 동일한 높이 계산
  },
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(4),
  },
}))

// 반응형 메인 레이아웃
const MainLayout = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  flexGrow: 1,
  minHeight: 0,
  height: 'auto', // height를 auto로 변경하여 내용에 따라 조정
  margin: '0 auto',
  width: '100%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    height: '100%', // 데스크톱에서는 전체 높이 사용
  },
}))

// 반응형 사이드 패널
const SidePanel = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  height: 'calc(100vh - 200px)', // ChatPanel과 동일한 높이
  flex: '0 0 auto',
  overflow: 'auto', // 스크롤 가능하도록
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  // 스크롤바 숨기기 (Webkit 기반 브라우저)
  '&::-webkit-scrollbar': {
    width: 0,
    background: 'transparent',
  },
  // Firefox에서 스크롤바 숨기기
  scrollbarWidth: 'none',
  // IE/Edge에서 스크롤바 숨기기
  msOverflowStyle: 'none',
  [theme.breakpoints.up('sm')]: {
    width: '100%',
    height: 'calc(100vh - 180px)', // 중간 화면에서 높이 조정
  },
  [theme.breakpoints.up('md')]: {
    width: '350px',
    flex: '0 0 350px',
    height: 'calc(100vh - 160px)', // 데스크톱에서 ChatPanel과 동일한 높이
  },
  [theme.breakpoints.up('lg')]: {
    width: '380px',
    flex: '0 0 380px',
    height: 'calc(100vh - 140px)', // 큰 화면에서 ChatPanel과 동일한 높이
  },
  [theme.breakpoints.up('xl')]: {
    width: '420px',
    flex: '0 0 420px',
    height: 'calc(100vh - 120px)', // 매우 큰 화면에서 ChatPanel과 동일한 높이
  },
}))

// 반응형 채팅 패널
const ChatPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: '100%',
  minHeight: 0,
  height: 'calc(100vh - 200px)', // 화면 높이에 맞춰 설정
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.up('sm')]: {
    minWidth: '100%',
    height: 'calc(100vh - 180px)', // 중간 화면에서 높이 조정
  },
  [theme.breakpoints.up('md')]: {
    minWidth: '500px',
    height: 'calc(100vh - 160px)', // 데스크톱에서 더 큰 높이
  },
  [theme.breakpoints.up('lg')]: {
    minWidth: '700px',
    height: 'calc(100vh - 140px)', // 큰 화면에서 최대 높이
  },
  [theme.breakpoints.up('xl')]: {
    minWidth: '900px',
    height: 'calc(100vh - 120px)', // 매우 큰 화면에서 최대 높이
  },
}))


export default function Dashboard() {
  const { messages, addMessage, updateMessage, appendToMessage, clearMessages, findMessageById } = useStreamingMessages()
  const [inputText, setInputText] = useState('')
  const [agentCoreStatus, setAgentCoreStatus] = useState<AgentCoreStatus>({
    isConnected: false,
    isLoading: false,
    error: null,
  })
  const [robotControlStatus, setRobotControlStatus] = useState<RobotControlStatus>({
    isExecuting: false,
    lastAction: null,
    error: null,
  })
  const [aiResponseStatus, setAiResponseStatus] = useState<AIResponseStatus>({
    isWaiting: false,
    isProcessing: false,
  })
  const [ttsStatus, setTtsStatus] = useState<TTSStatus>({
    isEnabled: false,
    isPlaying: false,
    isPaused: false,
    hasAudio: false,
    currentText: '',
    error: null,
  })
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [debugMode, setDebugMode] = useState<boolean>(true) // Debug mode state
  const [settingsExpanded, setSettingsExpanded] = useState<boolean>(false) // Settings card collapse state
  const [robotControlExpanded, setRobotControlExpanded] = useState<boolean>(true) // Robot control card collapse state
  const [quickCommandExpanded, setQuickCommandExpanded] = useState<boolean>(true) // Quick command card collapse state
  const hasInitialized = useRef(false) // 초기화 상태를 추적하는 ref
  
  // 초기 메시지 추가 (중복 방지 로직 포함)
  useEffect(() => {
    if (messages.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true
      addMessage({
        type: 'chunk',
        data: '안녕하세요! Agentic RoboDog 입니다. 무엇을 도와드릴까요?',
        isUser: false,
      })
    }
  }, [messages.length, addMessage])

  // AgentCore 연결 상태 확인
  useEffect(() => {
    const checkAgentCoreConnection = async () => {
      setAgentCoreStatus(prev => ({ ...prev, isLoading: true, error: null }))
      
      try {
        const isValid = validateEnvironment()
        if (!isValid) {
          throw new Error('환경 변수가 올바르게 설정되지 않았습니다.')
        }
        
        setAgentCoreStatus({
          isConnected: true,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        setAgentCoreStatus({
          isConnected: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'AgentCore 연결 실패',
        })
      }
    }

    checkAgentCoreConnection()
  }, [])

  // 컴포넌트 언마운트 시 TTS 정리
  useEffect(() => {
    return () => {
      ttsService.stopAudio()
    }
  }, [])

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    // AI 응답 대기 상태로 설정
    setAiResponseStatus({
      isWaiting: true,
      isProcessing: false,
    })

    // 사용자 메시지 추가
    const userMessageId = addMessage({
      type: 'chunk',
      data: text.trim(),
      isUser: true,
    })
    setInputText('')

    // AgentCore 연결 상태 확인
    if (!agentCoreStatus.isConnected) {
      setAiResponseStatus({
        isWaiting: false,
        isProcessing: false,
      })
      addMessage({
        type: 'error',
        error: 'AgentCore에 연결할 수 없습니다. 환경 설정을 확인해주세요.',
        isUser: false,
      })
      return
    }

    try {
      // AI 응답 처리 시작
      setAiResponseStatus({
        isWaiting: false,
        isProcessing: true,
      })

      // AgentCore 호출 (debug 모드 포함)
      const stream = await invokeAgentCore(text.trim(), currentSessionId, debugMode)
      
      // 세션 ID 업데이트 (첫 번째 호출인 경우)
      if (!currentSessionId) {
        setCurrentSessionId(`session-${Date.now()}`)
      }

      let isFirstChunk = true
      let currentMessageId = ''
      let lastMessageType: string | null = null

      await processAgentCoreStream(
        stream,
        // onEvent: 전체 이벤트 처리
        (event: any) => {
          console.log('Event received:', event)
        },
        // onChunk: 스트리밍 텍스트 처리
        (chunk: string) => {
          if (isFirstChunk) {
            // 첫 번째 청크가 오면 새 메시지 생성
            currentMessageId = addMessage({
              type: 'chunk',
              data: chunk,
              isUser: false,
            })
            lastMessageType = 'chunk'
            isFirstChunk = false
            
          } else {
            // tool_use 후에 오는 chunk는 별도 메시지로 생성하고 이전 tool_use 완료 처리
            if (lastMessageType === 'tool_use') {
              // 이전 tool_use 메시지를 완료 상태로 업데이트
              if (currentMessageId) {
                updateMessage(currentMessageId, {
                  isComplete: true,
                })
              }
              
              currentMessageId = addMessage({
                type: 'chunk',
                data: chunk,
                isUser: false,
              })
              lastMessageType = 'chunk'
            } else if (lastMessageType === 'chunk') {
              // 기존 chunk 메시지에 추가
              if (currentMessageId) {
                appendToMessage(currentMessageId, chunk)
                
              } else {
                // currentMessageId가 없는 경우 새 메시지 생성
                currentMessageId = addMessage({
                  type: 'chunk',
                  data: chunk,
                  isUser: false,
                })
                lastMessageType = 'chunk'
                
              }
            } else {
              // 다른 타입 후에 오는 chunk는 새 메시지 생성
              currentMessageId = addMessage({
                type: 'chunk',
                data: chunk,
                isUser: false,
              })
              lastMessageType = 'chunk'
            }
          }
        },
        // onToolUse: 도구 사용 정보 처리
        (toolName: string, toolInput: any, toolId?: string) => {
          // tool_id가 다르면 이전 tool_use를 완료 상태로 업데이트하고 새로운 메시지 생성
          const currentMessage = findMessageById(currentMessageId)
          const shouldCreateNewMessage = lastMessageType !== 'tool_use' || 
            (currentMessage && currentMessage.tool_id !== toolId)
          
          if (shouldCreateNewMessage) {
            // 이전 tool_use 메시지가 있으면 완료 상태로 업데이트
            if (lastMessageType === 'tool_use' && currentMessageId) {
              updateMessage(currentMessageId, {
                isComplete: true,
              })
            }
            
            // 새로운 tool_use 메시지 생성
            const toolMessageId = addMessage({
              type: 'tool_use',
              tool_name: toolName,
              tool_input: toolInput,
              tool_id: toolId,
              isUser: false,
            })
            currentMessageId = toolMessageId
            lastMessageType = 'tool_use'
          } else {
            // 같은 tool_id면 기존 메시지의 tool_input을 업데이트 (스트리밍이므로 교체)
            if (currentMessage) {
              updateMessage(currentMessageId, {
                tool_name: toolName,
                tool_input: toolInput,
                tool_id: toolId,
              })
            }
          }
        },
        // onReasoning: 추론 과정 처리
        (reasoning: string) => {
          if (lastMessageType === 'reasoning') {
            // 이전 메시지가 reasoning 타입이면 기존 메시지에 추가
            const currentMessage = findMessageById(currentMessageId)
            if (currentMessage) {
              updateMessage(currentMessageId, {
                reasoning_text: (currentMessage.reasoning_text || '') + reasoning,
              })
            }
          } else {
            // tool_use 후에 오는 reasoning이면 이전 tool_use 완료 처리
            if (lastMessageType === 'tool_use' && currentMessageId) {
              updateMessage(currentMessageId, {
                isComplete: true,
              })
            }
            
            // 새로운 reasoning 메시지 생성
            const reasoningMessageId = addMessage({
              type: 'reasoning',
              reasoning_text: reasoning,
              isUser: false,
            })
            currentMessageId = reasoningMessageId
            lastMessageType = 'reasoning'
          }
        },
        // onComplete: 최종 응답 처리
        (finalResponse: string) => {
          // 현재 메시지가 tool_use 타입이면 완료 상태로 업데이트
          if (lastMessageType === 'tool_use') {
            updateMessage(currentMessageId, {
              isComplete: true,
            })
          } else {
            // chunk 메시지면 complete 타입으로 변경
            updateMessage(currentMessageId, {
              type: 'complete',
              data: finalResponse,
              isComplete: true,
            })
          }
          lastMessageType = 'complete'
          
          // TTS 재생 (AI 응답이 완료되면)
          if (ttsStatus.isEnabled && finalResponse.trim()) {
            handleTTSPlay(finalResponse)
          }
          
          // AI 응답 완료
          setAiResponseStatus({
            isWaiting: false,
            isProcessing: false,
          })
        },
        // onError: 에러 처리
        (error: string) => {
          updateMessage(currentMessageId, {
            type: 'error',
            error: `오류가 발생했습니다: ${error}`,
          })
          // AI 응답 에러
          setAiResponseStatus({
            isWaiting: false,
            isProcessing: false,
          })
        }
      )

    } catch (error) {
      console.error('AgentCore 호출 오류:', error)
      setAiResponseStatus({
        isWaiting: false,
        isProcessing: false,
      })
      addMessage({
        type: 'error',
        error: `AgentCore 호출 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`,
        isUser: false,
      })
    }
  }

  const handleButtonClick = async (command: string) => {
    // JSON에서 버튼 정보 찾기
    const buttonInfo = robotControlMapping.robotControlButtons.find(btn => btn.text === command)
    
    if (buttonInfo) {
      // 사용자 메시지를 채팅창에 먼저 추가
      addMessage({
        type: 'chunk',
        data: command,
        isUser: true,
      })
      
      // 로봇 제어 버튼은 Lambda 함수로 직접 제어
      try {
        setRobotControlStatus(prev => ({ 
          ...prev, 
          isExecuting: true, 
          error: null,
          lastAction: command 
        }))
        
        const response = await invokeRobotControl({ 
          action: buttonInfo.action as RobotAction,
          message: buttonInfo.message 
        }, debugMode)
        
        if (response.statusCode === 200 && response.body) {
          addMessage({
            type: 'chunk',
            data: buttonInfo.message || `로봇 제어 명령 "${command}"이 성공적으로 실행되었습니다.`,
            isUser: false,
          })
          setRobotControlStatus(prev => ({ 
            ...prev, 
            isExecuting: false,
            error: null 
          }))
        } else {
          throw new Error('로봇 제어 명령 실행에 실패했습니다.')
        }
      } catch (error) {
        console.error('로봇 제어 오류:', error)
        setRobotControlStatus(prev => ({ 
          ...prev, 
          isExecuting: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        }))
        
        addMessage({
          type: 'error',
          error: `로봇 제어 명령 실행 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : '알 수 없는 오류'
          }`,
          isUser: false,
        })
      }
    } else {
      // 빠른 명령, 긴급 신고 등은 기존 BedrockAgentCore 방식으로 처리
      handleSendMessage(command)
    }
  }

  const handleResetChat = () => {
    clearMessages()
    hasInitialized.current = false // 리셋 시 초기화 상태도 리셋
    // TTS 정리
    ttsService.stopAudio()
    setTtsStatus(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      hasAudio: false,
      currentText: '',
      error: null,
    }))
  }

  // TTS 관련 함수들
  const handleTTSPlay = async (text: string) => {
    if (!ttsStatus.isEnabled || !text.trim()) return

    try {
      setTtsStatus(prev => ({ ...prev, error: null }))
      await ttsService.speak(text)
      
      // 재생 상태 업데이트
      const playbackState = ttsService.getPlaybackState()
      setTtsStatus(prev => ({
        ...prev,
        isPlaying: playbackState.isPlaying,
        isPaused: playbackState.isPaused,
        hasAudio: playbackState.hasAudio,
        currentText: text,
      }))
    } catch (error) {
      console.error('TTS 재생 실패:', error)
      setTtsStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'TTS 재생 실패',
        isPlaying: false,
        isPaused: false,
      }))
    }
  }

  const handleTTSPause = () => {
    ttsService.pauseAudio()
    setTtsStatus(prev => ({ ...prev, isPaused: true, isPlaying: false }))
  }

  const handleTTSResume = () => {
    ttsService.resumeAudio()
    setTtsStatus(prev => ({ ...prev, isPaused: false, isPlaying: true }))
  }

  const handleTTSStop = () => {
    ttsService.stopAudio()
    setTtsStatus(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      hasAudio: false,
      currentText: '',
    }))
  }

  const handleTTSToggle = () => {
    if (ttsStatus.isPlaying) {
      handleTTSStop()
    } else if (ttsStatus.isPaused) {
      handleTTSResume()
    } else if (ttsStatus.currentText) {
      handleTTSPlay(ttsStatus.currentText)
    }
  }

  // 전체 비활성화 상태 계산
  const isDisabled = robotControlStatus.isExecuting || aiResponseStatus.isWaiting || aiResponseStatus.isProcessing

  return (
    <ResponsiveContainer>
      <MainLayout>
        {/* 왼쪽 패널 - 제어 버튼들 */}
        <SidePanel>
          
       
          {/* 로봇 제어 패널 - 접을 수 있는 카드 */}
          <StyledCard sx={{ 
            flex: '0 0 auto',
            '&:hover': {
              transform: 'translateY(-4px)',
            }
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mb: robotControlExpanded ? 2 : 0,
                  cursor: 'pointer',
                  py: 0.5,
                  px: 0.5
                }}
                onClick={() => setRobotControlExpanded(!robotControlExpanded)}
              >
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary', 
                  fontSize: '1rem',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  로봇 제어
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {robotControlStatus.isExecuting && (
                    <LinearProgress sx={{ width: 40, height: 3, borderRadius: 2 }} />
                  )}
                  <IconButton 
                    size="small"
                    sx={{ 
                      transform: robotControlExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      p: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <ExpandMore />
                  </IconButton>
                </Box>
              </Box>
              
              <Collapse in={robotControlExpanded}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                  {robotControlStatus.lastAction && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      마지막 실행: {robotControlStatus.lastAction}
                    </Typography>
                  )}
                  {robotControlStatus.error && (
                    <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem' }}>
                      오류: {robotControlStatus.error}
                    </Typography>
                  )}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { 
                      xs: '1fr', 
                      sm: '1fr 1fr', 
                      md: '1fr 1fr',
                      lg: '1fr 1fr',
                      xl: '1fr 1fr'
                    }, 
                    gap: { xs: 1, sm: 1.5, md: 2 },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    {robotControlMapping.robotControlButtons.map((button, index) => {
                      // 버튼 색상별 그라데이션 정의 - 더 세련된 색상
                      const getButtonGradient = (color: string) => {
                        switch (color) {
                          case 'primary':
                            return 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' // 블루-바이올렛
                          case 'secondary':
                            return 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' // 바이올렛-핑크
                          case 'success':
                            return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' // 그린
                          case 'warning':
                            return 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)' // 앰버-옐로우
                          case 'error':
                            return 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' // 레드-핑크
                          case 'info':
                            return 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' // 시안-블루
                          default:
                            return 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                        }
                      }

                      const getButtonHoverGradient = (color: string) => {
                        switch (color) {
                          case 'primary':
                            return 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                          case 'secondary':
                            return 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)'
                          case 'success':
                            return 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                          case 'warning':
                            return 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
                          case 'error':
                            return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                          case 'info':
                            return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                          default:
                            return 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                        }
                      }

                      return (
                        <StyledButton
                          key={index}
                          variant="contained"
                          fullWidth
                          startIcon={getIconComponent(button.icon)}
                          disabled={isDisabled}
                          onClick={() => handleButtonClick(button.text)}
                          sx={{ 
                            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }, 
                            py: { xs: 1, sm: 1.5, md: 1.5 },
                            minHeight: { xs: '40px', sm: '44px', md: '48px' },
                            background: getButtonGradient(button.color),
                            color: 'white',
                            fontWeight: 600,
                            '&:hover': {
                              background: getButtonHoverGradient(button.color),
                              transform: 'translateY(-2px)',
                            },
                            '& .MuiSvgIcon-root': {
                              color: 'white',
                            }
                          }}
                        >
                          {button.text}
                        </StyledButton>
                      )
                    })}
                  </Box>
                </Box>
              </Collapse>
            </CardContent>
          </StyledCard>

          {/* 빠른 명령 패널 - 접을 수 있는 카드 */}
          <StyledCard sx={{ 
            flex: '0 0 auto',
            '&:hover': {
              transform: 'translateY(-4px)',
            }
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mb: quickCommandExpanded ? 2 : 0,
                  cursor: 'pointer',
                  py: 0.5,
                  px: 0.5
                }}
                onClick={() => setQuickCommandExpanded(!quickCommandExpanded)}
              >
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary', 
                  fontSize: '1rem',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  빠른 명령
                </Typography>
                <IconButton 
                  size="small"
                  sx={{ 
                    transform: quickCommandExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    p: 0.5,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ExpandMore />
                </IconButton>
              </Box>
              
              <Collapse in={quickCommandExpanded}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {quickCommandMapping.quickCommandButtons.map((button, index) => (
                      <StyledButton
                        key={index}
                        variant="outlined"
                        fullWidth
                        startIcon={getIconComponent(button.icon)}
                        disabled={isDisabled}
                        onClick={() => handleButtonClick(button.text)}
                        sx={{ 
                          fontSize: { xs: '0.95rem', sm: '1rem', md: '1.05rem' }, 
                          textAlign: 'left', 
                          py: { xs: 1, sm: 1.5, md: 1.5 },
                          minHeight: { xs: '40px', sm: '44px', md: '48px' }
                        }}
                      >
                        {button.text}
                      </StyledButton>
                    ))}
                  </Box>
                </Box>
              </Collapse>
            </CardContent>
          </StyledCard>

          {/* 설정 패널 - 접을 수 있는 카드 */}
          <StyledCard sx={{ 
            flex: '0 0 auto',
            '&:hover': {
              transform: 'translateY(-4px)',
            }
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mb: settingsExpanded ? 2 : 0,
                  cursor: 'pointer',
                  py: 0.5,
                  px: 0.5
                }}
                onClick={() => setSettingsExpanded(!settingsExpanded)}
              >
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary', 
                  fontSize: '1rem',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  설정
                </Typography>
                <IconButton 
                  size="small"
                  sx={{ 
                    transform: settingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    p: 0.5,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ExpandMore />
                </IconButton>
              </Box>
              
              <Collapse in={settingsExpanded}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                  {/* Debug 모드 토글 */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        color: 'text.primary', 
                        fontSize: '0.9rem',
                        lineHeight: 1.2
                      }}>
                        로봇 제어 생략
                      </Typography>
                      <Tooltip title={debugMode ? "로봇 제어 기능 Off (MCP 서버 연결 없음)" : "로봇 제어 기능 On (MCP 서버 연동)"}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={debugMode}
                              onChange={(e) => setDebugMode(e.target.checked)}
                              color="primary"
                              disabled={isDisabled}
                              size="small"
                            />
                          }
                          label={debugMode ? "ON" : "OFF"}
                          labelPlacement="end"
                          sx={{ m: 0 }}
                        />
                      </Tooltip>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {debugMode 
                        ? "로봇 제어 기능 Off (MCP 서버 연결 없음)" 
                        : "로봇 제어 기능 On (MCP 서버 연동)"
                      }
                    </Typography>
                  </Box>

                  <Divider />

                  {/* TTS 설정 토글 */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        color: 'text.primary', 
                        fontSize: '0.9rem',
                        lineHeight: 1.2
                      }}>
                        음성 출력 (TTS)
                      </Typography>
                      <Tooltip title={ttsStatus.isEnabled ? "TTS 기능 활성화" : "TTS 기능 비활성화"}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={ttsStatus.isEnabled}
                              onChange={(e) => {
                                const newEnabled = e.target.checked
                                if (!newEnabled) {
                                  // TTS를 끌 때 기존 재생 중인 오디오 정지
                                  ttsService.stopAudio()
                                  setTtsStatus(prev => ({
                                    ...prev,
                                    isEnabled: newEnabled,
                                    isPlaying: false,
                                    isPaused: false,
                                    hasAudio: false,
                                    currentText: '',
                                    error: null,
                                  }))
                                } else {
                                  // TTS를 켤 때는 단순히 활성화만
                                  setTtsStatus(prev => ({ ...prev, isEnabled: newEnabled }))
                                }
                              }}
                              color="primary"
                              disabled={isDisabled}
                              size="small"
                            />
                          }
                          label={ttsStatus.isEnabled ? "ON" : "OFF"}
                          labelPlacement="end"
                          sx={{ m: 0 }}
                        />
                      </Tooltip>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {ttsStatus.isEnabled 
                        ? "각 메시지의 재생 버튼을 클릭하여 음성으로 들을 수 있습니다" 
                        : "TTS 기능이 비활성화되었습니다"
                      }
                    </Typography>
                  </Box>
                </Box>
              </Collapse>
            </CardContent>
          </StyledCard>
          
        </SidePanel>

        {/* 중앙 패널 - 채팅 인터페이스 */}
        <ChatPanel>
          <ChatInterface
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            onSendMessage={handleSendMessage}
            onResetChat={handleResetChat}
            agentCoreStatus={agentCoreStatus}
            isDisabled={isDisabled}
            onTTSPlay={handleTTSPlay}
            onTTSPause={handleTTSPause}
            onTTSStop={handleTTSStop}
            ttsStatus={ttsStatus}
          />
        </ChatPanel>

      </MainLayout>
    </ResponsiveContainer>
  )
}
