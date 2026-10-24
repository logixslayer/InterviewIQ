export interface TtsVoiceMetadata {
  name: string;
  languageCodes: string[];
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  naturalSampleRateHertz: number;
  family: 'Journey' | 'Neural2' | 'WaveNet' | 'Studio' | 'Standard';
  displayName: string;
}

// Curated Google Cloud TTS voices catalogue with family classification
const CURATED_GOOGLE_VOICES: TtsVoiceMetadata[] = [
  {
    name: 'en-US-Journey-F',
    languageCodes: ['en-US'],
    ssmlGender: 'FEMALE',
    naturalSampleRateHertz: 24000,
    family: 'Journey',
    displayName: 'Google Journey (Natural Conversational • Female)',
  },
  {
    name: 'en-US-Journey-D',
    languageCodes: ['en-US'],
    ssmlGender: 'MALE',
    naturalSampleRateHertz: 24000,
    family: 'Journey',
    displayName: 'Google Journey (Natural Conversational • Male)',
  },
  {
    name: 'en-US-Neural2-F',
    languageCodes: ['en-US'],
    ssmlGender: 'FEMALE',
    naturalSampleRateHertz: 24000,
    family: 'Neural2',
    displayName: 'Google Neural2 (Studio Clarity • Female)',
  },
  {
    name: 'en-US-Neural2-D',
    languageCodes: ['en-US'],
    ssmlGender: 'MALE',
    naturalSampleRateHertz: 24000,
    family: 'Neural2',
    displayName: 'Google Neural2 (Technical Depth • Male)',
  },
  {
    name: 'en-US-Studio-O',
    languageCodes: ['en-US'],
    ssmlGender: 'FEMALE',
    naturalSampleRateHertz: 24000,
    family: 'Studio',
    displayName: 'Google Studio (Executive Bar-Raiser • Female)',
  },
  {
    name: 'en-US-Studio-Q',
    languageCodes: ['en-US'],
    ssmlGender: 'MALE',
    naturalSampleRateHertz: 24000,
    family: 'Studio',
    displayName: 'Google Studio (Principal Architect • Male)',
  },
  {
    name: 'en-US-Wavenet-D',
    languageCodes: ['en-US'],
    ssmlGender: 'MALE',
    naturalSampleRateHertz: 24000,
    family: 'WaveNet',
    displayName: 'Google WaveNet (Balanced Pace • Male)',
  },
  {
    name: 'en-US-Wavenet-F',
    languageCodes: ['en-US'],
    ssmlGender: 'FEMALE',
    naturalSampleRateHertz: 24000,
    family: 'WaveNet',
    displayName: 'Google WaveNet (Expressive • Female)',
  },
  {
    name: 'en-GB-Neural2-B',
    languageCodes: ['en-GB'],
    ssmlGender: 'MALE',
    naturalSampleRateHertz: 24000,
    family: 'Neural2',
    displayName: 'Google British Neural2 (Direct • Male)',
  },
  {
    name: 'en-GB-Neural2-F',
    languageCodes: ['en-GB'],
    ssmlGender: 'FEMALE',
    naturalSampleRateHertz: 24000,
    family: 'Neural2',
    displayName: 'Google British Neural2 (Articulate • Female)',
  },
];

function getGcpTtsApiKey(): string | null {
  const key = process.env.GCP_TTS_API_KEY || process.env.GOOGLE_TTS_API_KEY;
  if (key && key.trim().length > 10 && key !== 'MY_GCP_KEY') {
    return key.trim();
  }
  return null;
}

/**
 * Returns available Google Cloud Text-to-Speech voices.
 * If credentials are live, queries Google Cloud API; otherwise returns curated catalog with fallback flag.
 */
export async function getAvailableTtsVoices(languageCode = 'en'): Promise<{
  provider: 'google' | 'browser';
  isLive: boolean;
  voices: TtsVoiceMetadata[];
}> {
  const apiKey = getGcpTtsApiKey();

  if (apiKey) {
    try {
      const url = `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}&languageCode=${languageCode}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.voices)) {
          const mapped: TtsVoiceMetadata[] = data.voices
            .filter((v: any) => v.languageCodes?.some((lc: string) => lc.startsWith('en')))
            .map((v: any) => {
              let family: TtsVoiceMetadata['family'] = 'Standard';
              if (v.name.includes('Journey')) family = 'Journey';
              else if (v.name.includes('Neural2')) family = 'Neural2';
              else if (v.name.includes('Studio')) family = 'Studio';
              else if (v.name.includes('Wavenet')) family = 'WaveNet';

              return {
                name: v.name,
                languageCodes: v.languageCodes,
                ssmlGender: v.ssmlGender || 'FEMALE',
                naturalSampleRateHertz: v.naturalSampleRateHertz || 24000,
                family,
                displayName: `${v.name} (${family} • ${v.ssmlGender || 'Female'})`,
              };
            });

          return {
            provider: 'google',
            isLive: true,
            voices: mapped.length > 0 ? mapped : CURATED_GOOGLE_VOICES,
          };
        }
      }
    } catch (err: any) {
      console.warn('Google Cloud TTS voices fetch failed, using curated catalogue:', err?.message);
    }
  }

  return {
    provider: 'browser',
    isLive: false,
    voices: CURATED_GOOGLE_VOICES,
  };
}

/**
 * Synthesizes text into audio using Google Cloud Text-to-Speech API.
 * Falls back to client-side browser speech synthesis if Google Cloud API key is not configured.
 */
export async function synthesizeSpeechAudio(params: {
  text: string;
  voiceName?: string;
  locale?: string;
  gender?: string;
  speakingRate?: number;
  pitch?: number;
}): Promise<{
  audioContent?: string; // base64 MP3
  format?: string;
  fallback?: boolean;
  voiceUsed: string;
  provider: 'google' | 'browser';
}> {
  const {
    text,
    voiceName = 'en-US-Journey-F',
    locale = 'en-US',
    gender = 'FEMALE',
    speakingRate = 1.0,
    pitch = 0.0,
  } = params;

  const apiKey = getGcpTtsApiKey();

  if (apiKey) {
    try {
      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
      const body = {
        input: { text },
        voice: {
          languageCode: locale,
          name: voiceName,
          ssmlGender: gender,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          pitch,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioContent) {
          return {
            audioContent: data.audioContent,
            format: 'audio/mp3',
            voiceUsed: voiceName,
            provider: 'google',
          };
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn('Google Cloud TTS synthesize API error:', errJson);
      }
    } catch (err: any) {
      console.warn('Google Cloud TTS synthesize call error:', err?.message);
    }
  }

  // Graceful browser fallback signal
  return {
    fallback: true,
    voiceUsed: voiceName,
    provider: 'browser',
  };
}
