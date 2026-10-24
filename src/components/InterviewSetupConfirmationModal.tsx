import React, { useState, useEffect } from 'react';
import { InterviewConfig, UserProfile, VoiceSettings } from '../types';
import { VoiceSettingsSection } from './VoiceSettingsSection';

interface InterviewSetupConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLaunch: () => void;
  config: InterviewConfig;
  userProfile?: UserProfile | null;
  onConfigChange?: (newConfig: InterviewConfig) => void;
}

export const InterviewSetupConfirmationModal: React.FC<InterviewSetupConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmLaunch,
  config,
  userProfile,
  onConfigChange,
}) => {
  const [micStatus, setMicStatus] = useState<'checking' | 'granted' | 'prompt' | 'denied'>('checking');
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'granted' | 'prompt' | 'denied'>('checking');
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);

  // Load saved voice settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('interviewiq_voice_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return config.voiceSettings || {
      provider: 'google',
      voiceName: 'en-US-Journey-F',
      locale: 'en-US',
      gender: 'FEMALE',
    };
  });

  // Check live microphone and camera permissions
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const checkPermissions = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const micPerm = await navigator.permissions.query({ name: 'microphone' as any });
            if (isMounted) setMicStatus(micPerm.state);
            micPerm.onchange = () => {
              if (isMounted) setMicStatus(micPerm.state);
            };
          } catch {
            if (isMounted) setMicStatus('prompt');
          }

          try {
            const camPerm = await navigator.permissions.query({ name: 'camera' as any });
            if (isMounted) setCameraStatus(camPerm.state);
            camPerm.onchange = () => {
              if (isMounted) setCameraStatus(camPerm.state);
            };
          } catch {
            if (isMounted) setCameraStatus('prompt');
          }
        } else {
          setMicStatus('prompt');
          setCameraStatus('prompt');
        }
      } catch {
        if (isMounted) {
          setMicStatus('prompt');
          setCameraStatus('prompt');
        }
      }
    };

    checkPermissions();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVoiceChange = (newVoice: VoiceSettings) => {
    setVoiceSettings(newVoice);
    if (onConfigChange) {
      onConfigChange({ ...config, voiceSettings: newVoice });
    }
  };

  const handleRequestMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicStatus('granted');
    } catch {
      setMicStatus('denied');
    }
  };

  const handleRequestCamTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setCameraStatus('granted');
    } catch {
      setCameraStatus('denied');
    }
  };

  const resumeContextAvailable = !!userProfile?.summary || (userProfile?.topSkills && userProfile.topSkills.length > 0);
  const jdContextAvailable = !!config.jobDescription && config.jobDescription.trim().length > 15;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-lg w-full p-space-xl border border-outline-variant flex flex-col gap-space-md max-h-[90vh] overflow-y-auto">
        {/* Header Icon & Status Pill */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-2 shadow-xs">
            <span className="material-symbols-outlined text-[26px]">verified</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>Ready for Next Phase</span>
          </div>

          <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold leading-tight">
            Interview Launch Confirmation
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed max-w-md">
            Review your tailored session configuration and hardware verification before entering the live interview room.
          </p>
        </div>

        {/* Configuration Review Card */}
        <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-2.5 border border-outline-variant/60 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-surface-variant">
            <span className="text-outline font-semibold">Target Track:</span>
            <span className="font-bold text-on-surface text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">stars</span>
              <span>{config.role} ({config.level})</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-outline font-semibold">Interview Type &amp; Difficulty:</span>
            <span className="font-bold text-on-surface">
              {config.type} Track • {config.difficulty} Difficulty
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-outline font-semibold">Questions &amp; Estimated Duration:</span>
            <span className="font-bold text-on-surface">
              {config.duration}
            </span>
          </div>

          {/* Voice Model Selection Strip */}
          <div className="flex items-center justify-between pt-1 border-t border-surface-variant flex-wrap gap-1">
            <span className="text-outline font-semibold">Interviewer Voice:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary font-mono text-[11px]">
                {voiceSettings.voiceName} ({voiceSettings.gender})
              </span>
              <button
                type="button"
                onClick={() => setIsVoicePickerOpen(!isVoicePickerOpen)}
                className="text-xs text-primary hover:underline font-semibold cursor-pointer"
              >
                {isVoicePickerOpen ? 'Hide' : 'Change'}
              </button>
            </div>
          </div>

          {/* Collapsible Voice Settings Picker */}
          {isVoicePickerOpen && (
            <div className="mt-2 pt-2 border-t border-outline-variant">
              <VoiceSettingsSection
                currentSettings={voiceSettings}
                onSettingsChange={handleVoiceChange}
                compact
              />
            </div>
          )}
        </div>

        {/* Context & Hardware Device Health Checks */}
        <div className="flex flex-col gap-2">
          <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-bold">
            Hardware &amp; Assessment Context Verification
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Microphone Status */}
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-on-surface">mic</span>
                <span className="font-medium text-on-surface">Microphone</span>
              </div>
              {micStatus === 'granted' ? (
                <span className="text-secondary font-bold flex items-center gap-0.5 text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Ready
                </span>
              ) : micStatus === 'denied' ? (
                <button
                  type="button"
                  onClick={handleRequestMicTest}
                  className="text-error font-bold text-[11px] hover:underline"
                >
                  Denied (Retry)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestMicTest}
                  className="text-primary font-bold text-[11px] hover:underline"
                >
                  Click to Test
                </button>
              )}
            </div>

            {/* Camera Status (Optional) */}
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-on-surface">videocam</span>
                <span className="font-medium text-on-surface">Webcam</span>
              </div>
              {cameraStatus === 'granted' ? (
                <span className="text-secondary font-bold flex items-center gap-0.5 text-[11px]">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Ready
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestCamTest}
                  className="text-outline font-semibold text-[11px] hover:text-primary"
                >
                  Optional (Test)
                </button>
              )}
            </div>

            {/* AI Bar-Raiser Engine Status */}
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">memory</span>
                <span className="font-medium text-on-surface">AI Bar-Raiser</span>
              </div>
              <span className="text-secondary font-bold flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Active
              </span>
            </div>

            {/* Resume / JD Alignment Context */}
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                <span className="font-medium text-on-surface">Calibration</span>
              </div>
              <span className="text-primary font-bold text-[11px]">
                {jdContextAvailable ? 'Job Description Calibrated' : resumeContextAvailable ? 'Resume Calibrated' : 'Track Standard'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-space-sm w-full pt-space-xs border-t border-surface-variant mt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high font-label-md text-label-md text-on-surface font-semibold transition-colors cursor-pointer"
          >
            Edit Setup
          </button>

          <button
            type="button"
            onClick={onConfirmLaunch}
            className="flex-1 py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/95 text-on-primary font-label-md text-label-md font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
          >
            <span>Launch Interview</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
