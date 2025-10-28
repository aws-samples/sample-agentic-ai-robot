import boto3
import base64

def synthesize_speech(speed, text, langCode, voiceId):
    polly_client = boto3.client('polly')

    ssml_text = f'<speak><prosody rate="{speed}%">{text}</prosody></speak>'
    
    response = polly_client.synthesize_speech(
        Text=ssml_text,
        TextType='ssml', # 'ssml'|'text'
        Engine='neural',  # 'standard'|'neural'
        LanguageCode=langCode, 
        OutputFormat='mp3', # 'json'|'mp3'|'ogg_vorbis'|'pcm',
        VoiceId=voiceId
        # SampleRate=16000, # "8000", "16000", "22050", and "24000".
        # SpeechMarkTypes= # 'sentence'|'ssml'|'viseme'|'word'            
    )

    print(f"response = {response}")

    encoded_content = base64.b64encode(response['AudioStream'].read()).decode()

    with open('speech_output.mp3', 'wb') as file:
        file.write(base64.b64decode(encoded_content))
            
def main():
    speed = 100
    text = "안녕하세요. 멋진 하루 되세요."
    langCode = 'ko-KR' # 'en-US' | 'ko-KR'
    voiceId = 'Jihye' # 'Seoyeon' | 'Jihye'
    
    synthesize_speech(speed, text, langCode, voiceId)
    
if __name__ == "__main__":
    main()