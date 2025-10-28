# 🎵 AWS Polly TTS System

> **Robot Voice Synthesis and Text-to-Speech Conversion Service**

<p>
  | <a href="./README.md">English</a> | <a href="./README-ko.md">한국어</a> |
</p>

This component is a TTS (Text-to-Speech) system that converts text into natural Korean voice using AWS Polly. It is used when robots deliver AI responses through voice or provide voice guidance according to situations.

## 🎯 Key Features

### 🎤 High-Quality Voice Synthesis
- **Neural Engine**: Uses AWS Polly's latest Neural Engine
- **Korean Support**: Support for Korean voices like Seoyeon, Jihye
- **SSML Support**: Fine control of voice speed, tone, emphasis, etc.
- **Various Formats**: Support for various audio formats like MP3, OGG, PCM

### ⚡ Real-time Processing
- **Fast Response**: Low-latency voice generation
- **Streaming**: Real-time streaming voice output
- **Caching**: Performance optimization through caching frequently used voices
- **Batch Processing**: Process multiple texts at once

### 🎛️ Voice Control
- **Speed Adjustment**: Dynamic voice playback speed adjustment
- **Volume Control**: Voice volume adjustment
- **Pause/Play**: Voice playback control
- **Repeat Playback**: Repeat specific sections

## 🏗️ System Architecture

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

## 📋 Supported Voice Settings

### Korean Voice List
| Voice ID | Gender | Characteristics | Usage Example |
|----------|--------|-----------------|---------------|
| `Seoyeon` | Female | Natural and friendly voice | General guidance, conversation |
| `Jihye` | Female | Clear and professional voice | Announcements, warning messages |

### Voice Format Options
| Format | Description | Usage |
|--------|-------------|-------|
| `mp3` | Compressed audio format | General voice output |
| `ogg_vorbis` | Open source audio format | Web browser compatibility |
| `pcm` | Uncompressed audio format | High-quality voice processing |

## ⚙️ Installation and Setup

### 1. AWS Polly Client Setup

```python
import boto3
import json

# Create Polly client
polly_client = boto3.client('polly', region_name='us-west-2')

# Get available voice list
voices = polly_client.describe_voices(LanguageCode='ko-KR')
for voice in voices['Voices']:
    print(f"Voice ID: {voice['Id']}, Name: {voice['Name']}")
```

### 2. Basic TTS Function Implementation

```python
def synthesize_speech(text, voice_id='Seoyeon', output_format='mp3', speed=100):
    """Function to convert text to voice"""
    
    # Generate SSML text (including speed control)
    ssml_text = f'<speak><prosody rate="{speed}%">{text}</prosody></speak>'
    
    try:
        # Voice synthesis using Polly
        response = polly_client.synthesize_speech(
            Text=ssml_text,
            TextType='ssml',
            Engine='neural',  # Use Neural Engine
            LanguageCode='ko-KR',
            OutputFormat=output_format,
            VoiceId=voice_id
        )
        
        return response['AudioStream'].read()
        
    except Exception as e:
        print(f"Voice synthesis error: {str(e)}")
        return None
```

## 🔧 Usage

```python
# Basic usage
text = "Hello! Have a great day today!"
audio_data = synthesize_speech(text)

# Save as voice file
with open('output.mp3', 'wb') as f:
    f.write(audio_data)
```

## 🧪 Testing

```bash
# Test TTS system
python robo-polly.py
```

## 📚 Additional Resources

- [AWS Polly Developer Guide](https://docs.aws.amazon.com/polly/)
- [SSML Reference Guide](https://docs.aws.amazon.com/polly/latest/dg/ssml.html)
- [Polly Voice List](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html)
- [boto3 Polly Client Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/polly.html)