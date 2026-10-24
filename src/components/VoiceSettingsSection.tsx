import React, { useState, useEffect, useRef } from 'react';
import { VoiceSettings } from '../types';
import { fetchAvailableTtsVoices, previewTtsVoice, saveUserVoiceSettings } from '../services/interviewService';

interface VoiceSettingsSectionProps {
  currentSettings?: VoiceSettings;
  onSettingsChange?: (newSettings: VoiceSettings) => void;
  compact?: boolean;
}

export const VoiceSettingsSection: React.FC<VoiceSettingsSectionProps> = ({
  currentSettings,
  onSettingsChange,
  compact = false,
}) => {
  const [provider, setProvider] = useState<'google' | 'browser'>(currentSettings?.provider || 'google');
  const [selectedVoice, setSelectedVoice] = useState<string>(currentSettings?.voiceName || 'en-US-Journey-F');
  const [selectedLocale, setSelectedLocale] = useState<string>(currentSettings?.locale || 'en-US');
  const [selectedGender, setSelectedGender] = useState<'FEMALE' | 'MALE' | 'NEUTRAL'>(currentSettings?.gender || 'FEMALE');
  const [selectedFamily, setSelectedFamily] = useState<string>('All');

  const [voices, setVoices] = useState<any[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isLiveGoogleTts, setIsLiveGoogleTts] = useState(false);

  // Audio Preview States
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load available voices from backend
  useEffect(() => {
    let isMounted = true;
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const data = await fetchAvailableTtsVoices('en');
        if (isMounted && data.success && Array.isArray(data.voices)) {
          setVoices(data.voices);
          setIsLiveGoogleTts(data.isLive);
        }
      } catch (err) {
        console.warn('Voices load error:', err);
      } finally {
        if (isMounted) setIsLoadingVoices(false);
      }
    };
    loadVoices();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter voices based on locale, gender, family
  const filteredVoices = voices.filter(v => {
    if (selectedLocale && !v.languageCodes?.includes(selectedLocale)) {
      // allow if no exact match but starts with en
      const hasPrefix = v.languageCodes?.some((lc: string) => lc.startsWith(selectedLocale.split('-')[0]));
      if (!hasPrefix) return false;
    }
    if (selectedGender && v.ssmlGender !== selectedGender) return false;
    if (selectedFamily !== 'All' && v.family !== selectedFamily) return false;
    return true;
  });

  const activeVoiceList = filteredVoices.length > 0 ? filteredVoices : voices;

  const handleSelectVoice = (voiceName: string, gender: 'FEMALE' | 'MALE' | 'NEUTRAL', locale: string) => {
    setSelectedVoice(voiceName);
    setSelectedGender(gender);
    setSelectedLocale(locale);

    const updated: VoiceSettings = {
      provider,
      voiceName,
      locale,
      gender,
      speakingRate: 1.0,
      pitch: 0.0,
    };

    onSettingsChange?.(updated);
    try {
      localStorage.setItem('interviewiq_voice_settings', JSON.stringify(updated));
      saveUserVoiceSettings(updated);
    } catch (e) {
      console.warn('Failed to persist voice settings:', e);
    }
  };

  const handleProviderChange = (newProvider: 'google' | 'browser') => {
    setProvider(newProvider);
    const updated: VoiceSettings = {
      provider: newProvider,
      voiceName: selectedVoice,
      locale: selectedLocale,
      gender: selectedGender,
      speakingRate: 1.0,
      pitch: 0.0,
    };
    onSettingsChange?.(updated);
    localStorage.setItem('interviewiq_voice_settings', JSON.stringify(updated));
    saveUserVoiceSettings(updated);
  };

  // Preview voice
  const handlePreviewVoice = async () => {
    if (isPlayingPreview) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingPreview(false);
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);

    const sampleText = "Welcome to your mock interview. Let's begin by discussing your experience and approach to problem-solving.";

    try {
      if (provider === 'google' && isLiveGoogleTts) {
        const result = await previewTtsVoice({
          voiceName: selectedVoice,
          locale: selectedLocale,
          gender: selectedGender,
        });

        if (result.audioContent) {
          const audioSrc = `data:${result.format || 'audio/mp3'};base64,${result.audioContent}`;
          if (!audioRef.current) {
            audioRef.current = new Audio();
          }
          const audio = audioRef.current;
          audio.src = audioSrc;
          audio.onended = () => setIsPlayingPreview(false);
          audio.onerror = () => {
            setIsPlayingPreview(false);
            setPreviewError('Failed to playback audio stream.');
          };
          await audio.play();
          setIsPlayingPreview(true);
          return;
        }
      }

      // Browser speech synthesis fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(sampleText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to find matching browser voice
        const browserVoices = window.speechSynthesis.getVoices();
        const matchingVoice = browserVoices.find(bv => 
          (selectedGender === 'FEMALE' && (bv.name.toLowerCase().includes('female') || bv.name.toLowerCase().includes('zira') || bv.name.toLowerCase().includes('samantha'))) ||
          (selectedGender === 'MALE' && (bv.name.toLowerCase().includes('male') || bv.name.toLowerCase().includes('david') || bv.name.toLowerCase().includes('george')))
        ) || browserVoices.find(bv => bv.lang.startsWith('en')) || browserVoices[0];

        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        utterance.onstart = () => setIsPlayingPreview(true);
        utterance.onend = () => setIsPlayingPreview(false);
        utterance.onerror = () => setIsPlayingPreview(false);

        window.speechSynthesis.speak(utterance);
      } else {
        throw new Error('Speech synthesis is not supported on this browser.');
      }
    } catch (err: any) {
      console.error('Preview error:', err);
      setPreviewError(err?.message || 'Could not preview voice.');
      setIsPlayingPreview(false);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className={`flex flex-col gap-space-md ${compact ? 'p-0' : 'p-space-lg bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-space-xs border-b border-surface-variant flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
          </div>
          <div className="flex flex-col">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Interviewer Voice &amp; Speech Settings
            </h3>
            <span className="text-xs text-on-surface-variant font-normal">
              Select the voice model and cadence for your AI mock interviewer.
            </span>
          </div>
        </div>

        {/* Live Service Status */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isLiveGoogleTts 
              ? 'bg-secondary-container text-on-secondary-container' 
              : 'bg-surface-container-high text-on-surface-variant'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveGoogleTts ? 'bg-secondary' : 'bg-outline'}`} />
            <span>{isLiveGoogleTts ? 'Google Cloud TTS Live' : 'Browser Neural Speech Active'}</span>
          </span>
        </div>
      </div>

      {/* Provider Selector Tabs */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Speech Provider
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleProviderChange('google')}
            className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
              provider === 'google'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm font-bold text-on-surface">
                Google Cloud Text-to-Speech
              </span>
              <span className="material-symbols-outlined text-primary text-[16px]">
                {provider === 'google' ? 'check_circle' : 'radio_button_unchecked'}
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant">
              Journey, Neural2 &amp; Studio natural conversational models.
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleProviderChange('browser')}
            className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
              provider === 'browser'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm font-bold text-on-surface">
                Browser Speech Synthesis
              </span>
              <span className="material-symbols-outlined text-primary text-[16px]">
                {provider === 'browser' ? 'check_circle' : 'radio_button_unchecked'}
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant">
              Zero-latency client-side local speech synthesis fallback.
            </span>
          </button>
        </div>
      </div>

      {/* Voice Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {/* Locale Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-outline">Accent &amp; Locale</label>
          <select
            value={selectedLocale}
            onChange={(e) => setSelectedLocale(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="en-US">English (United States)</option>
            <option value="en-GB">English (United Kingdom)</option>
          </select>
        </div>

        {/* Gender Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-outline">Interviewer Gender</label>
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </select>
        </div>

        {/* Family Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-outline">Voice Model Family</label>
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="All">All Model Families</option>
            <option value="Journey">Journey (Conversational)</option>
            <option value="Neural2">Neural2 (Studio Clarity)</option>
            <option value="Studio">Studio (Executive)</option>
            <option value="WaveNet">WaveNet (Standard DeepMind)</option>
          </select>
        </div>
      </div>

      {/* Available Voices Grid */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Available Interviewer Voices ({activeVoiceList.length})
          </span>
          {isLoadingVoices && <span className="text-[11px] text-outline animate-pulse">Loading voices...</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
          {activeVoiceList.map((voice) => {
            const isSelected = selectedVoice === voice.name;
            return (
              <div
                key={voice.name}
                onClick={() => handleSelectVoice(voice.name, voice.ssmlGender, voice.languageCodes?.[0] || selectedLocale)}
                className={`p-2.5 rounded-lg border text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary-fixed/20 shadow-xs'
                    : 'border-outline-variant hover:bg-surface-container-low'
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-label-sm text-label-sm font-bold text-on-surface truncate">
                      {voice.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-semibold">
                      {voice.family || 'Neural'}
                    </span>
                  </div>
                  <span className="text-[11px] text-outline mt-0.5 truncate">
                    {voice.ssmlGender} • {voice.languageCodes?.[0] || 'en-US'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isSelected && (
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      check_circle
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Voice Preview & Test Button */}
      <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between gap-3 border border-outline-variant flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreviewVoice}
            disabled={isPreviewLoading}
            className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlayingPreview
                ? 'bg-error text-on-error'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isPreviewLoading ? 'sync' : isPlayingPreview ? 'stop' : 'play_arrow'}
            </span>
            <span>{isPlayingPreview ? 'Stop Sample' : isPreviewLoading ? 'Generating...' : 'Preview Selected Voice'}</span>
          </button>

          <span className="text-xs text-on-surface-variant hidden sm:inline">
            Active: <strong className="text-on-surface">{selectedVoice}</strong> ({selectedGender})
          </span>
        </div>

        {previewError && (
          <span className="text-xs text-error font-medium">
            {previewError}
          </span>
        )}

        <span className="text-[11px] text-outline italic">
          "Welcome to your mock interview..."
        </span>
      </div>
    </div>
  );
};
