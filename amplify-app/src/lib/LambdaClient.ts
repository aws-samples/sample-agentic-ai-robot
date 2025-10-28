import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { getAWSCredentials } from './aws-credentials'
import { getEnvVar } from './env-config'

// Lambda 함수 설정 변수
let LAMBDA_FUNCTION_ARN = ''
let LAMBDA_REGION = 'ap-northeast-2'

// 환경 변수 초기화
const initializeLambdaEnvVars = async () => {
  LAMBDA_FUNCTION_ARN = await getEnvVar('REACT_APP_LAMBDA_FUNCTION_ARN', '')
  LAMBDA_REGION = await getEnvVar('REACT_APP_LAMBDA_REGION', 'ap-northeast-2')
}

// Lambda 클라이언트 생성
const createLambdaClient = async () => {
  try {
    // 환경 변수 초기화
    await initializeLambdaEnvVars()
    
    console.log('AWS 자격 증명 가져오기 시도...');
    const credentials = await getAWSCredentials()

    console.log('Lambda 클라이언트 생성:', {
      accessKeyId: credentials.accessKeyId,
      hasSecretAccessKey: !!credentials.secretAccessKey,
      hasSessionToken: !!credentials.sessionToken,
      region: LAMBDA_REGION
    });

    return new LambdaClient({
      region: LAMBDA_REGION,
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

// 로봇 제어 액션 타입 정의
export type RobotAction = 'HAPPY' | 'NEUTRAL' | 'SAD' | 'ANGRY'

// Lambda 함수 호출 인터페이스
export interface RobotControlRequest {
  action: RobotAction
  message?: string
  debug?: boolean
}

// Lambda 함수 호출 응답 인터페이스
export interface RobotControlResponse {
  statusCode: number
  body: boolean
}

// 로봇 제어 Lambda 함수 호출
export const invokeRobotControl = async (request: RobotControlRequest, debug: boolean = false): Promise<RobotControlResponse> => {
  // 환경 변수 초기화
  await initializeLambdaEnvVars()
  
  const client = await createLambdaClient()
  
  try {
    // debug 파라미터를 request에 추가
    const requestWithDebug = {
      ...request,
      debug: debug
    }

    const command = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION_ARN,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(requestWithDebug),
      LogType: 'None', // 로그를 반환하지 않음
    })

    console.log('Lambda 함수 호출:', {
      functionName: LAMBDA_FUNCTION_ARN,
      debug: debug,
      payload: requestWithDebug
    });

    const response = await client.send(command)
    
    if (!response.Payload) {
      throw new Error('Lambda 함수에서 응답을 받지 못했습니다.')
    }

    // Lambda 응답 파싱
    const responseBody = JSON.parse(new TextDecoder().decode(response.Payload))
    
    console.log('Lambda 함수 응답:', responseBody)
    
    return {
      statusCode: responseBody.statusCode || 200,
      body: responseBody.body || false
    }
    
  } catch (error) {
    console.error('Lambda 함수 호출 오류:', error)
    throw new Error(`로봇 제어 명령 실행 중 오류가 발생했습니다: ${
      error instanceof Error ? error.message : '알 수 없는 오류'
    }`)
  }
}

// 로봇 제어 버튼 매핑 정보 타입
interface RobotControlButton {
  text: string
  action: RobotAction
  icon: string
  color: string
}

// 로봇 제어 버튼 매핑 정보 로드
const loadRobotControlMapping = (): Record<string, RobotAction> => {
  try {
    const mappingData = require('../config/robotControlButton.json')
    const actionMap: Record<string, RobotAction> = {}
    
    mappingData.robotControlButtons.forEach((button: RobotControlButton) => {
      actionMap[button.text] = button.action
    })
    
    return actionMap
  } catch (error) {
    console.error('로봇 제어 매핑 정보 로드 실패:', error)
    return {}
  }
}

// 버튼 텍스트를 액션으로 매핑하는 함수 (로봇 제어 버튼만)
export const mapButtonTextToAction = (buttonText: string): RobotAction | null => {
  const actionMap = loadRobotControlMapping()
  return actionMap[buttonText] || null
}

// 로봇 제어 버튼인지 확인하는 함수
export const isRobotControlButton = (buttonText: string): boolean => {
  const actionMap = loadRobotControlMapping()
  return buttonText in actionMap
}
