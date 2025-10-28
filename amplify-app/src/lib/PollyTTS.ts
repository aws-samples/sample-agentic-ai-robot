import { PollyClient, SynthesizeSpeechCommand, VoiceId, OutputFormat, TextType, Engine } from "@aws-sdk/client-polly";
import { getAWSCredentials } from './aws-credentials'
import { getEnvVar } from './env-config'

let REGION = 'us-west-2'

// 환경 변수 초기화
const initializeEnvVars = async () => {
  REGION = await getEnvVar('REACT_APP_AWS_REGION', 'us-west-2')
}

// Polly 클라이언트 생성
const createPollyClient = async () => {
  try {
    await initializeEnvVars()
    const credentials = await getAWSCredentials()

    return new PollyClient({
      region: REGION,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    })
  } catch (error) {
    console.error('Polly 클라이언트 생성 실패:', error)
    throw error
  }
}

// TTS 옵션 인터페이스
export interface TTSOptions {
  voiceId?: VoiceId
  outputFormat?: OutputFormat
  sampleRate?: string
  textType?: TextType
  engine?: Engine
  speechRate?: number // 음성 속도 (50-200%, 기본값: 120%)
}

// 기본 TTS 옵션
const DEFAULT_TTS_OPTIONS: TTSOptions = {
  voiceId: VoiceId.Jihye, // 한국어 음성
  outputFormat: OutputFormat.MP3,
  sampleRate: '22050',
  textType: TextType.SSML, // SSML 사용으로 변경하여 prosody 지원
  engine: Engine.NEURAL,
  speechRate: 120 // 기본 속도를 120%로 설정 (더 빠르게)
}

// TTS 서비스 클래스
export class TTSService {
  private client: PollyClient | null = null
  private currentAudio: HTMLAudioElement | null = null
  private isPlaying = false
  private isPaused = false

  constructor() {
    this.initializeClient()
  }

  private async initializeClient() {
    try {
      this.client = await createPollyClient()
    } catch (error) {
      console.error('TTS 클라이언트 초기화 실패:', error)
    }
  }

  // 텍스트를 음성으로 변환
  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<Blob> {
    if (!this.client) {
      throw new Error('Polly 클라이언트가 초기화되지 않았습니다.')
    }

    const mergedOptions = { ...DEFAULT_TTS_OPTIONS, ...options }

    // SSML 텍스트 생성 (speechRate가 설정된 경우)
    let processedText = text
    if (mergedOptions.speechRate && mergedOptions.speechRate !== 100) {
      // HTML 태그 이스케이프 처리
      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
      
      processedText = `<speak><prosody rate="${mergedOptions.speechRate}%">${escapedText}</prosody></speak>`
    }

    try {
      const command = new SynthesizeSpeechCommand({
        Text: processedText,
        VoiceId: mergedOptions.voiceId!,
        OutputFormat: mergedOptions.outputFormat!,
        SampleRate: mergedOptions.sampleRate!,
        TextType: mergedOptions.textType!,
        Engine: mergedOptions.engine!
      })

      const response = await this.client.send(command)
      
      if (!response.AudioStream) {
        throw new Error('음성 데이터를 받지 못했습니다.')
      }

      // Uint8Array를 Blob으로 변환
      const audioData = await response.AudioStream.transformToByteArray()
      const buffer = audioData.buffer instanceof ArrayBuffer ? audioData.buffer : new ArrayBuffer(audioData.buffer.byteLength)
      if (!(audioData.buffer instanceof ArrayBuffer)) {
        new Uint8Array(buffer).set(audioData)
      }
      return new Blob([buffer], { type: `audio/${mergedOptions.outputFormat}` })
    } catch (error) {
      console.error('TTS 합성 실패:', error)
      throw error
    }
  }

  // 오디오 재생
  async playAudio(audioBlob: Blob): Promise<void> {
    try {
      // 이전 오디오 정리
      this.stopAudio()

      const audioUrl = URL.createObjectURL(audioBlob)
      this.currentAudio = new Audio(audioUrl)
      
      this.currentAudio.onended = () => {
        this.isPlaying = false
        this.isPaused = false
        URL.revokeObjectURL(audioUrl)
      }

      this.currentAudio.onerror = (error) => {
        console.error('오디오 재생 오류:', error)
        this.isPlaying = false
        this.isPaused = false
        URL.revokeObjectURL(audioUrl)
      }

      await this.currentAudio.play()
      this.isPlaying = true
      this.isPaused = false
    } catch (error) {
      console.error('오디오 재생 실패:', error)
      throw error
    }
  }

  // 텍스트를 TTS로 재생
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    try {
      const audioBlob = await this.synthesizeSpeech(text, options)
      await this.playAudio(audioBlob)
    } catch (error) {
      console.error('TTS 재생 실패:', error)
      throw error
    }
  }

  // 오디오 일시정지
  pauseAudio(): void {
    if (this.currentAudio && this.isPlaying && !this.isPaused) {
      this.currentAudio.pause()
      this.isPaused = true
    }
  }

  // 오디오 재개
  resumeAudio(): void {
    if (this.currentAudio && this.isPaused) {
      this.currentAudio.play()
      this.isPaused = false
    }
  }

  // 오디오 정지
  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    this.isPlaying = false
    this.isPaused = false
  }

  // 현재 재생 상태
  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      hasAudio: !!this.currentAudio
    }
  }
}

// 싱글톤 인스턴스
export const ttsService = new TTSService()
