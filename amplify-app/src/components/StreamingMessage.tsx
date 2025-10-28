import React, { useState, useEffect, memo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  Avatar,
  useTheme,
  CircularProgress,
} from '@mui/material'
import {
  SmartToy as RobotIcon,
  Build as ToolIcon,
  Psychology as ReasoningIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Code as CodeIcon,
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import JsonView from '@uiw/react-json-view'
import { isValidS3Url, detectImageType } from '../lib/image-utils'
import { S3Image } from './S3Image'

// 타입 정의
export interface StreamMessage {
  id: string
  type: 'chunk' | 'tool_use' | 'reasoning' | 'complete' | 'metadata' | 'error'
  data?: string
  tool_name?: string
  tool_input?: any
  tool_id?: string
  reasoning_text?: string
  final_response?: string
  metadata?: any
  error?: string
  timestamp: Date
  isComplete?: boolean
  isUser?: boolean
}

interface StreamingMessageProps {
  message: StreamMessage
  isUser: boolean
  onUpdate?: (updatedMessage: StreamMessage) => void
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

// 스타일드 컴포넌트
const MessageContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})<{ isUser: boolean }>(({ theme, isUser }) => ({
  padding: '12px 16px',
  borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
  backgroundColor: isUser ? 'transparent' : 'transparent',
  background: isUser
    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
    : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  color: isUser ? 'white' : theme.palette.text.primary,
  maxWidth: '100%',
  marginBottom: '8px',
  wordWrap: 'break-word',
  border: isUser ? 'none' : `1px solid rgba(226, 232, 240, 0.8)`,
  boxShadow: isUser
    ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    : '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}))

const ToolUseContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)',
  border: `1px solid rgba(148, 163, 184, 0.3)`,
  borderRadius: 12,
  padding: 12,
  margin: '8px 0',
  color: theme.palette.text.primary,
  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transform: 'translateY(-1px)',
  },
  '& .tool-header': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  '& .tool-content': {
    background: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 8,
    padding: 8,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: '0.875rem',
    maxHeight: 200,
    overflow: 'auto',
    marginTop: 8,
    color: theme.palette.text.primary,
    border: '1px solid rgba(99, 102, 241, 0.15)',
    backdropFilter: 'blur(10px)',
  },
}))

const ReasoningContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  border: `1px solid rgba(245, 158, 11, 0.3)`,
  borderRadius: 12,
  padding: 16,
  margin: '8px 0',
  color: 'white',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  '& .reasoning-header': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
}))

const ErrorContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  border: `1px solid rgba(239, 68, 68, 0.3)`,
  borderRadius: 12,
  padding: 16,
  margin: '8px 0',
  color: 'white',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  '& .error-header': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
}))

const StreamingText = styled(Typography)({
  minHeight: '1.2em',
})

// 키프레임 애니메이션 정의
const keyframes = `
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`

function StreamingMessage({ message, isUser, onUpdate, onTTSPlay, onTTSPause, onTTSStop, ttsStatus }: StreamingMessageProps) {
  const theme = useTheme()

  // tool_use 메시지는 기본적으로 펼쳐져 있도록 설정
  const [isExpanded, setIsExpanded] = useState(true)
  const [displayText, setDisplayText] = useState('')
  const [displayToolInput, setDisplayToolInput] = useState('')

  // 키프레임 애니메이션을 head에 주입
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = keyframes
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // 스트리밍 상태 결정
  const isStreaming = message.type === 'chunk' && !message.isComplete

  // 메시지 데이터가 변경될 때마다 displayText 업데이트 (깜빡거림 방지)
  useEffect(() => {
    const newDisplayText = message.type === 'complete' && message.final_response
      ? message.final_response
      : message.data || ''

    if (newDisplayText !== displayText) {
      setDisplayText(newDisplayText)
    }
  }, [message.data, message.final_response, message.type])

  // tool_input이 변경될 때마다 displayToolInput 업데이트 (스트리밍 효과)
  useEffect(() => {
    if (message.type === 'tool_use') {
      let newToolInput = message.tool_input

      console.log('Tool input update:', {
        tool_input: message.tool_input,
        newToolInput,
        displayToolInput,
        messageId: message.id
      })

      if (newToolInput !== displayToolInput) {
        setDisplayToolInput(newToolInput)
      }
    }
  }, [message.tool_input, message.type, displayToolInput])

  // JSON 데이터를 안전하게 파싱하는 함수
  const parseJSONSafely = (data: any): any => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch (e) {
        // JSON이 완전하지 않은 경우 원본 문자열 반환
        return data
      }
    }
    return data
  }

  // 텍스트에서 S3 URL 추출 함수
  const extractS3UrlsFromText = (text: string): string[] => {
    if (!text) return []

    // s3:// 형식의 URL 찾기 (특수문자 포함)
    // 공백, 줄바꿈, 따옴표, 괄호 등으로 구분되는 S3 URL 매칭
    const s3UrlRegex = /s3:\/\/[^\s"'<>()[\]{}]+\.(jpg|jpeg|png|gif|webp)/gi
    const matches = text.match(s3UrlRegex)

    return matches ? matches.filter(url => isValidS3Url(url)) : []
  }

  // 이미지와 메타데이터 추출 함수
  const extractImageData = (data: any): Array<{ s3Url: string, metadata: any }> => {
    const imageData: Array<{ s3Url: string, metadata: any }> = []

    if (!data) return imageData

    const parsedData = parseJSONSafely(data)

    // filename 필드에서 S3 URL 추출 (detection/gesture tool 결과)
    if (parsedData?.filename && isValidS3Url(parsedData.filename)) {
      imageData.push({
        s3Url: parsedData.filename,
        metadata: {
          timestamp: parsedData.timestamp,
          results: parsedData.results,
          imageType: detectImageType(parsedData.filename),
        }
      })
    }

    // 기존 방식 호환성 유지: messages 배열에서 image_url 추출
    if (parsedData?.messages && Array.isArray(parsedData.messages)) {
      parsedData.messages.forEach((msg: any) => {
        if (msg.image_url) {
          imageData.push({
            s3Url: msg.image_url,
            metadata: {
              timestamp: msg.timestamp,
              results: msg.results,
              filename: msg.filename,
            }
          })
        }
      })
    }

    // 텍스트에서 S3 URL 추출 (AI 응답에서)
    if (typeof data === 'string') {
      const urls = extractS3UrlsFromText(data)
      urls.forEach(url => {
        imageData.push({
          s3Url: url,
          metadata: {
            imageType: detectImageType(url),
          }
        })
      })
    }

    return imageData
  }

  // 도구 사용 정보 렌더링
  const renderToolUse = () => {
    // toolInput이 없거나 비어있으면 접힌 상태로 시작
    const hasToolInput = displayToolInput && displayToolInput !== '' && displayToolInput !== null && displayToolInput !== undefined

    // 이미지 데이터 추출
    const imageData = extractImageData(displayToolInput)

    return (
      <ToolUseContainer>
        <Box className="tool-header">
          <ToolIcon sx={{ color: theme.palette.primary.main }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: theme.palette.text.primary }}>
              {message.tool_name || 'Unknown Tool'}
            </Typography>
            {message.tool_id && (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                {message.tool_id}
              </Typography>
            )}
          </Box>
          <Chip
            label={message.isComplete ? "완료" : "실행중"}
            size="small"
            sx={{
              background: message.isComplete
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(99, 102, 241, 0.1)',
              color: message.isComplete
                ? theme.palette.success.main
                : theme.palette.primary.main,
              border: message.isComplete
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-label': {
                color: message.isComplete
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
                fontWeight: 600,
              }
            }}
          />
          {hasToolInput && (
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{
                ml: 'auto',
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: theme.palette.primary.main,
                }
              }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>

        {/* 이미지 렌더링 - 각 detection 결과별로 구분 */}
        {imageData.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {imageData.map((item, index) => (
              <Box
                key={index}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: 'white',
                }}
              >
                {/* 메타데이터 헤더 */}
                {item.metadata.results && item.metadata.results.length > 0 && (
                  <Box sx={{
                    p: 1.5,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                  }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Detection #{index + 1}
                      </Typography>
                      {item.metadata.results.map((result: any, rIndex: number) => (
                        <Chip
                          key={rIndex}
                          label={`${result.class || 'unknown'} (${(result.confidence * 100).toFixed(1)}%)`}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: '20px',
                            background: result.risk_level === 'HIGH'
                              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                              : result.risk_level === 'MEDIUM'
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      ))}
                      {item.metadata.timestamp && (
                        <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                          {new Date(item.metadata.timestamp * 1000).toLocaleTimeString('ko-KR')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}

                {/* 이미지 */}
                <Box sx={{ p: 1 }}>
                  <S3Image
                    s3Url={item.s3Url}
                    alt={`${item.metadata.imageType || 'Detection'} ${index + 1}`}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {hasToolInput && (
          <Collapse in={isExpanded}>
            <Box className="tool-content">
              <JsonView
                value={parseJSONSafely(displayToolInput)}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                }}
                displayDataTypes={false}
                displayObjectSize={false}
                enableClipboard={false}
                collapsed={false}
              />
            </Box>
          </Collapse>
        )}
      </ToolUseContainer>
    )
  }

  // 추론 과정 렌더링
  const renderReasoning = () => (
    <ReasoningContainer>
      <Box className="reasoning-header">
        <ReasoningIcon sx={{ color: 'white' }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'white' }}>
          AI 추론 과정
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={isExpanded}>
        <Typography variant="body1" sx={{ color: 'white' }}>
          {message.reasoning_text}
        </Typography>
      </Collapse>
    </ReasoningContainer>
  )

  // 에러 렌더링
  const renderError = () => (
    <ErrorContainer>
      <Box className="error-header">
        <ErrorIcon sx={{ color: 'white' }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'white' }}>
          오류 발생
        </Typography>
      </Box>
      <Typography variant="body1" sx={{ color: 'white' }}>
        {message.error}
      </Typography>
    </ErrorContainer>
  )

  // 완료 상태 렌더링
  const renderComplete = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      <CompleteIcon sx={{ color: '#10b981', fontSize: 'small' }} />
      <Typography variant="subtitle2" sx={{ color: '#10b981', fontWeight: 600 }}>
        응답 완료
      </Typography>
    </Box>
  )

  // 메인 컨텐츠 렌더링
  const renderContent = () => {
    // 텍스트에서 이미지 추출 (chunk와 complete 타입에서)
    const imageData = (message.type === 'chunk' || message.type === 'complete')
      ? extractImageData(displayText)
      : []

    switch (message.type) {
      case 'tool_use':
        return renderToolUse()
      case 'reasoning':
        return renderReasoning()
      case 'error':
        return renderError()
      case 'complete':
        return (
          <Box>
            <StreamingText
              variant="body1"
              sx={{
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {displayText}
            </StreamingText>

            {/* 이미지 렌더링 */}
            {imageData.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {imageData.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      background: 'white',
                    }}
                  >
                    <Box sx={{ p: 1 }}>
                      <S3Image
                        s3Url={item.s3Url}
                        alt={`${item.metadata.imageType || 'Detection'} ${index + 1}`}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {renderComplete()}
          </Box>
        )
      case 'chunk':
      default:
        return (
          <Box>
            <StreamingText
              variant="body1"
              sx={{
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {displayText}
            </StreamingText>

            {/* 이미지 렌더링 */}
            {imageData.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {imageData.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      background: 'white',
                    }}
                  >
                    <Box sx={{ p: 1 }}>
                      <S3Image
                        s3Url={item.s3Url}
                        alt={`${item.metadata.imageType || 'Detection'} ${index + 1}`}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )
    }
  }

  // 사용자 메시지인지 확인 (간단한 텍스트인 경우)
  const isSimpleUserMessage = isUser && message.type === 'chunk' && !message.tool_name && !message.reasoning_text && !message.error

  // tool_use, reasoning, error 타입은 자체 스타일링이 있으므로 추가 박스 불필요
  const hasCustomStyling = message.type === 'tool_use' || message.type === 'reasoning' || message.type === 'error'

  // TTS 가능한 메시지인지 확인 (AI 응답이고 텍스트가 있고 TTS가 활성화된 경우)
  const canUseTTS = !isUser && (message.type === 'chunk' || message.type === 'complete') && displayText.trim() && ttsStatus?.isEnabled

  // 현재 메시지가 TTS로 재생 중인지 확인 (TTS가 활성화된 경우에만)
  const isCurrentTTSMessage = ttsStatus?.isEnabled && ttsStatus?.currentText === displayText && ttsStatus?.hasAudio

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, maxWidth: '85%' }}>
        {!isUser && (
          <Avatar sx={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <RobotIcon />
          </Avatar>
        )}
        <Box sx={{ width: '100%' }}>
          {isSimpleUserMessage ? (
            // 사용자 메시지는 기존 스타일 유지
            <MessageContainer isUser={isUser}>
              {renderContent()}
            </MessageContainer>
          ) : hasCustomStyling ? (
            // tool_use, reasoning, error는 자체 스타일링 사용
            renderContent()
          ) : (
            // 일반 AI 메시지는 더 깔끔한 스타일로 표시
            <Box sx={{
              p: 2,
              background: isUser
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              color: isUser ? 'white' : 'text.primary',
              borderRadius: isUser ? '20px 20px 4px 20px' : 0,
              border: isUser ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: isUser
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                : '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              wordWrap: 'break-word',
            }}>
              {renderContent()}
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                ml: isUser ? 0 : 1,
                mr: isUser ? 1 : 0,
                fontSize: '0.75rem'
              }}
            >
              {message.timestamp.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </Typography>

            {/* TTS 버튼들 - TTS가 활성화된 경우에만 표시 */}
            {canUseTTS && onTTSPlay && ttsStatus?.isEnabled && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isCurrentTTSMessage && ttsStatus?.isPlaying ? (
                  <Tooltip title="일시정지">
                    <IconButton
                      size="small"
                      onClick={onTTSPause}
                      sx={{
                        color: 'warning.main',
                        '&:hover': { backgroundColor: 'rgba(245, 158, 11, 0.1)' }
                      }}
                    >
                      <Pause sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="음성 재생">
                    <IconButton
                      size="small"
                      onClick={() => onTTSPlay(displayText)}
                      sx={{
                        color: isCurrentTTSMessage ? 'primary.main' : 'text.secondary',
                        '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' }
                      }}
                    >
                      <PlayArrow sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                )}

                {isCurrentTTSMessage && ttsStatus?.hasAudio && (
                  <Tooltip title="정지">
                    <IconButton
                      size="small"
                      onClick={onTTSStop}
                      sx={{
                        color: 'error.main',
                        '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                      }}
                    >
                      <Stop sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                )}

                {isCurrentTTSMessage && ttsStatus?.isPlaying && (
                  <VolumeUp sx={{ fontSize: '0.875rem', color: 'success.main' }} />
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

// memo 비교 함수 추가하여 불필요한 리렌더링 방지
export default memo(StreamingMessage, (prevProps, nextProps) => {
  // 메시지 내용이 동일한지 확인
  const prevMessage = prevProps.message
  const nextMessage = nextProps.message

  // TTS 상태 변경 시 리렌더링 필요
  const ttsStatusChanged =
    prevProps.ttsStatus?.isEnabled !== nextProps.ttsStatus?.isEnabled ||
    prevProps.ttsStatus?.isPlaying !== nextProps.ttsStatus?.isPlaying ||
    prevProps.ttsStatus?.isPaused !== nextProps.ttsStatus?.isPaused ||
    prevProps.ttsStatus?.hasAudio !== nextProps.ttsStatus?.hasAudio ||
    prevProps.ttsStatus?.currentText !== nextProps.ttsStatus?.currentText

  return (
    prevMessage.id === nextMessage.id &&
    prevMessage.type === nextMessage.type &&
    prevMessage.data === nextMessage.data &&
    prevMessage.final_response === nextMessage.final_response &&
    prevMessage.tool_name === nextMessage.tool_name &&
    prevMessage.tool_input === nextMessage.tool_input &&
    prevMessage.reasoning_text === nextMessage.reasoning_text &&
    prevMessage.error === nextMessage.error &&
    prevMessage.isComplete === nextMessage.isComplete &&
    prevMessage.isUser === nextMessage.isUser &&
    prevProps.isUser === nextProps.isUser &&
    !ttsStatusChanged
  )
})
