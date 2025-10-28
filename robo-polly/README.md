# Robot Text to Speech

[robo-polly.py](./robo-polly/robo-polly.py)와 같이 polly를 이용해 text를 speech로 변환합니다. 아래와 같이 출력 포맷으로 mp3, ogg등을 선택할 수 있습니다. 음성은 voiceId로 설정하는데, 'Seoyeon' 또는 'Jihye'를 사용할 수 있습니다.

```python
polly_client = boto3.client('polly')
ssml_text = f'<speak><prosody rate="{speed}%">{text}</prosody></speak>'
response = polly_client.synthesize_speech(
    Text=ssml_text,
    TextType='ssml', 
    Engine='neural', 
    LanguageCode=langCode, 
    OutputFormat='mp3', # 'json'|'mp3'|'ogg_vorbis'|'pcm',
    VoiceId=voiceId
)
```
