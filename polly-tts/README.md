# 🎵 AWS Polly TTS 시스템

> **로봇 음성 합성 및 텍스트-음성 변환 서비스**

이 컴포넌트는 AWS Polly를 활용하여 텍스트를 자연스러운 한국어 음성으로 변환하는 TTS(Text-to-Speech) 시스템입니다. 로봇이 AI 응답을 음성으로 전달하거나, 상황에 따른 음성 안내를 제공할 때 사용됩니다.

## 🎯 주요 기능

### 🎤 고품질 음성 합성
- **Neural Engine**: AWS Polly의 최신 Neural Engine 사용
- **한국어 지원**: Seoyeon, Jihye 등 한국어 음성 지원
- **SSML 지원**: 음성 속도, 톤, 강세 등 세밀한 제어
- **다양한 포맷**: MP3, OGG, PCM 등 다양한 오디오 포맷 지원

### ⚡ 실시간 처리
- **빠른 응답**: 낮은 지연시간으로 음성 생성
- **스트리밍**: 실시간 스트리밍 음성 출력
- **캐싱**: 자주 사용되는 음성 캐싱으로 성능 최적화
- **배치 처리**: 여러 텍스트를 한 번에 처리

### 🎛️ 음성 제어
- **속도 조절**: 음성 재생 속도 동적 조절
- **볼륨 제어**: 음성 크기 조절
- **일시정지/재생**: 음성 재생 제어
- **반복 재생**: 특정 구간 반복 재생

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Text Input    │───▶│   AWS Polly     │───▶│   Audio Output   │
│  (AI Response)  │    │   (TTS Engine)  │    │  (Robot Speaker)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   SSML Processing│    │   Audio Buffer  │
                       │   (Speed/Tone)   │    │   Management    │
                       └──────────────────┘    └─────────────────┘
```

## 📋 지원하는 음성 설정

### 한국어 음성 목록
| Voice ID | 성별 | 특징 | 사용 예시 |
|----------|------|------|-----------|
| `Seoyeon` | 여성 | 자연스럽고 친근한 목소리 | 일반적인 안내, 대화 |
| `Jihye` | 여성 | 명확하고 전문적인 목소리 | 공지사항, 경고 메시지 |

### 음성 포맷 옵션
| 포맷 | 설명 | 용도 |
|------|------|------|
| `mp3` | 압축된 오디오 포맷 | 일반적인 음성 출력 |
| `ogg_vorbis` | 오픈소스 오디오 포맷 | 웹 브라우저 호환성 |
| `pcm` | 무압축 오디오 포맷 | 고품질 음성 처리 |

## ⚙️ 설치 및 설정

### 1. AWS Polly 클라이언트 설정

```python
import boto3
import json

# Polly 클라이언트 생성
polly_client = boto3.client('polly', region_name='us-west-2')

# 사용 가능한 음성 목록 조회
voices = polly_client.describe_voices(LanguageCode='ko-KR')
for voice in voices['Voices']:
    print(f"Voice ID: {voice['Id']}, Name: {voice['Name']}")
```

### 2. 기본 TTS 함수 구현

```python
def synthesize_speech(text, voice_id='Seoyeon', output_format='mp3', speed=100):
    """텍스트를 음성으로 변환하는 함수"""
    
    # SSML 텍스트 생성 (속도 조절 포함)
    ssml_text = f'<speak><prosody rate="{speed}%">{text}</prosody></speak>'
    
    try:
        # Polly를 사용한 음성 합성
        response = polly_client.synthesize_speech(
            Text=ssml_text,
            TextType='ssml',
            Engine='neural',  # Neural Engine 사용
            LanguageCode='ko-KR',
            OutputFormat=output_format,
            VoiceId=voice_id
        )
        
        return response['AudioStream'].read()
        
    except Exception as e:
        print(f"음성 합성 오류: {str(e)}")
        return None
```

## 🔧 사용 방법

```python
# 기본 사용법
text = "안녕하세요! 오늘도 좋은 하루 되세요!"
audio_data = synthesize_speech(text)

# 음성 파일로 저장
with open('output.mp3', 'wb') as f:
    f.write(audio_data)
```

## 🧪 테스트

```bash
# TTS 시스템 테스트
python robo-polly.py
```

## 📚 추가 리소스

- [AWS Polly 개발자 가이드](https://docs.aws.amazon.com/polly/)
- [SSML 참조 가이드](https://docs.aws.amazon.com/polly/latest/dg/ssml.html)
- [Polly 음성 목록](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html)
- [boto3 Polly 클라이언트 문서](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/polly.html)
