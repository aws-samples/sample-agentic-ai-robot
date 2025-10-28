import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";
import { getAWSCredentials } from './aws-credentials'
import { getEnvVar } from './env-config'

let REGION = 'us-west-2'
let AGENT_RUNTIME_ARN = ''
let QUALIFIER = ''

// 환경 변수 초기화
const initializeEnvVars = async () => {
  REGION = await getEnvVar('REACT_APP_AWS_REGION', 'us-west-2')
  AGENT_RUNTIME_ARN = await getEnvVar('REACT_APP_AGENT_RUNTIME_ARN', '')
  QUALIFIER = await getEnvVar('REACT_APP_QUALIFIER', 'DEFAULT')
}

// Bedrock AgentCore 클라이언트 생성
const createBedrockAgentCoreClient = async () => {
  try {
    // 환경 변수 초기화
    await initializeEnvVars()
    
    console.log('AWS 자격 증명 가져오기 시도...');
    const credentials = await getAWSCredentials()

    console.log('AWS 자격 증명 성공:', {
      accessKeyId: credentials.accessKeyId,
      hasSecretAccessKey: !!credentials.secretAccessKey,
      hasSessionToken: !!credentials.sessionToken,
      expiration: credentials.expiration
    });

    return new BedrockAgentCoreClient({
      region: REGION,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    })
  } catch (error) {
    console.error('AWS 자격 증명 가져오기 실패:', error)
    throw error
  }
}

// AgentCore 스트리밍 응답 타입 정의
export interface AgentCoreResponse {
  type: 'chunk' | 'tool_use' | 'reasoning' | 'complete' | 'metadata' | 'error'
  data?: string
  tool_name?: string
  tool_input?: any
  tool_id?: string
  reasoning_text?: string
  final_response?: string
  metadata?: any
  error?: string
  isComplete?: boolean
}

// AgentCore 호출 함수
export const invokeAgentCore = async (
  prompt: string,
  sessionId?: string,
  debug: boolean = false
): Promise<ReadableStream<AgentCoreResponse>> => {
  const client = await createBedrockAgentCoreClient()
  
  try {
    // 요청 페이로드를 JSON으로 생성
    const payload = JSON.stringify({
      prompt: prompt,
      debug: debug,
      session_id: sessionId || generateSessionId(),
      prompt_uuid: `uuid-${Date.now()}`,
      user_timezone: "UTC",
      last_k_turns: 5,
    })

    const command = new InvokeAgentRuntimeCommand({
      agentRuntimeArn: AGENT_RUNTIME_ARN,
      qualifier: QUALIFIER || "DEFAULT",
      contentType: "text/event-stream; charset=utf-8",
      accept: "application/json, text/event-stream",
      payload: new TextEncoder().encode(payload),
    })

    console.log('BedrockAgentCore 요청 command', command)
    
    // Promise 기반으로 스트림 처리
    return new Promise<ReadableStream<AgentCoreResponse>>((resolve, reject) => {
      client.send(command).then(
        (response) => {
          if (!response.response) {
            reject(new Error('No response stream received from AgentCore'))
            return
          }
          
          console.log('BedrockAgentCore 응답 받음, 스트림 처리 시작')
          
          // 스트림을 처리하여 AgentCoreResponse 형태로 변환
          const readableStream = new ReadableStream({
            async start(controller) {
              try {
                // AWS SDK의 스트림을 직접 처리
                const stream = response.response!
                
                // 통일된 Web Streams API 사용
                const reader = (stream as ReadableStream).getReader()
                const decoder = new TextDecoder()
                let buffer = ''
                
                const processStream = async () => {
                  try {
                    while (true) {
                      const { done, value } = await reader.read()
                      
                      if (done) {
                        console.log('Stream completed')
                        controller.close()
                        break
                      }
                      
                      // 실시간으로 청크 처리
                      const text = decoder.decode(value, { stream: true })
                      
                      buffer += text
                      
                      // 즉시 라인별로 처리 (버퍼링 최소화)
                      const lines = buffer.split('\n')
                      buffer = lines.pop() || ''
                      
                      for (const line of lines) {
                        const trimmedLine = line.trim()
                        
                        if (trimmedLine.startsWith('data: ')) {
                          const jsonData = trimmedLine.substring(6)
                                                    
                          try {
                            const parsedData = JSON.parse(jsonData)
                            
                            // 통일된 이벤트 처리
                            if (parsedData.type === 'complete') {
                              console.log('Stream marked as done')
                              controller.enqueue({
                                type: 'complete',
                                final_response: parsedData.final_response,
                                isComplete: true
                              })
                              controller.close()
                              return
                            } else if (parsedData.type === 'chunk') {
                              controller.enqueue({
                                type: 'chunk',
                                data: parsedData.data
                              })
                            } else if (parsedData.type === 'tool_use') {
                              controller.enqueue({
                                type: 'tool_use',
                                tool_name: parsedData.tool_name,
                                tool_input: parsedData.tool_input,
                                tool_id: parsedData.tool_id
                              })
                            } else if (parsedData.type === 'reasoning') {
                              controller.enqueue({
                                type: 'reasoning',
                                reasoning_text: parsedData.reasoning_text
                              })
                            } else if (parsedData.type === 'metadata') {
                              controller.enqueue({
                                type: 'metadata',
                                metadata: parsedData.metadata
                              })
                            } else if (parsedData.error) {
                              controller.enqueue({
                                type: 'error',
                                error: parsedData.error
                              })
                            }
                          } catch (parseError) {
                            console.warn('JSON 파싱 실패:', jsonData, parseError)
                            // 파싱 실패한 경우에도 텍스트 데이터로 처리
                            if (jsonData.trim()) {
                              controller.enqueue({
                                type: 'chunk',
                                data: jsonData
                              })
                            }
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Error processing stream:', error)
                    controller.enqueue({
                      type: 'error',
                      error: error instanceof Error ? error.message : 'Unknown error'
                    })
                    controller.close()
                  }
                }
                
                // 비동기로 스트림 처리 시작
                processStream()
              } catch (error) {
                console.error('Error processing AgentCore stream:', error)
                controller.enqueue({
                  type: 'error',
                  error: error instanceof Error ? error.message : 'Unknown error occurred'
                })
                controller.close()
              }
            }
          })
          
          resolve(readableStream)
        },
        (error) => {
          console.error('Error invoking AgentCore:', error)
          reject(error)
        }
      )
    })
  } catch (error) {
    console.error('Error invoking AgentCore:', error)
    throw error
  }
}

// 세션 ID 생성 함수
const generateSessionId = (): string => {
//   return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return 'session-test'
}

// 스트림을 읽고 처리하는 헬퍼 함수 - 새로운 이벤트 구조에 맞게 수정
export const processAgentCoreStream = async (
  stream: ReadableStream<AgentCoreResponse>,
  onEvent?: (event: any) => void,
  onChunk?: (data: string) => void,
  onToolUse?: (toolName: string, toolInput: any, toolId?: string) => void,
  onReasoning?: (reasoning: string) => void,
  onComplete?: (finalResponse: string) => void,
  onError?: (error: string) => void
): Promise<string> => {
  const reader = stream.getReader()
  let fullResponse = ''
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      // 새로운 이벤트 구조: 전체 이벤트를 그대로 전달
      if (onEvent) {
        onEvent(value)
      }
      
      // 기존 호환성을 위한 처리
      switch (value.type) {
        case 'chunk':
          if (value.data) {
            fullResponse += value.data
            onChunk?.(value.data)
          }
          break
          
        case 'tool_use':
          console.log('processAgentCoreStream: tool_use processing:', { tool_name: value.tool_name, tool_input: value.tool_input, tool_id: value.tool_id })
          onToolUse?.(value.tool_name || '', value.tool_input, value.tool_id)
          break
          
        case 'reasoning':
          onReasoning?.(value.reasoning_text || '')
          break
          
        case 'complete':
          if (value.final_response) {
            fullResponse = value.final_response
            onComplete?.(value.final_response)
          }
          break
          
        case 'error':
          onError?.(value.error || 'Unknown error')
          break
          
        case 'metadata':
          // 메타데이터는 로깅용으로만 사용
          console.log('AgentCore metadata:', value.metadata)
          break
      }
    }
    
    return fullResponse
  } finally {
    reader.releaseLock()
  }
}

// 환경 변수 검증 함수
export const validateEnvironment = async (): Promise<boolean> => {
  const requiredEnvVars = [
    'REACT_APP_AWS_REGION',
    'REACT_APP_AGENT_RUNTIME_ARN',
    'REACT_APP_LAMBDA_FUNCTION_ARN',
    'REACT_APP_LAMBDA_REGION'
  ]
  
  const { validateRequiredEnvVars } = await import('./env-config')
  return await validateRequiredEnvVars(requiredEnvVars)
}
