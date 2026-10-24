import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface CameraPreviewProps {
  candidateName?: string;
  interviewState?: string;
  audioLevel?: number; // 0 - 100
  isMicActive?: boolean;
  onCameraStateChange?: (isActive: boolean) => void;
}

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'insecure_origin'
  | 'error';

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  candidateName = 'Candidate',
  interviewState = 'idle',
  audioLevel = 0,
  isMicActive = false,
  onCameraStateChange,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Stop any active camera media tracks
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Enumerate video devices
  const updateDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch {
      // Permission not yet granted for labels, will refresh after getUserMedia
    }
  }, [selectedDeviceId]);

  // Request webcam stream
  const startCamera = useCallback(
    async (deviceId?: string) => {
      // Check insecure context
      if (
        typeof window !== 'undefined' &&
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        setStatus('insecure_origin');
        setErrorMessage('Camera access requires HTTPS or localhost in your browser.');
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unavailable');
        setErrorMessage('Webcam access is not supported by this browser.');
        return;
      }

      stopTracks();
      setStatus('requesting');
      setErrorMessage(null);

      const targetDeviceId = deviceId || selectedDeviceId;
      const constraints: MediaStreamConstraints = {
        video: targetDeviceId
          ? {
              deviceId: { exact: targetDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false, // Audio is managed separately by speechRecognitionService to prevent feedback
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
          };
        }

        setStatus('active');
        onCameraStateChange?.(true);
        updateDeviceList();
      } catch (err: any) {
        console.warn('Webcam initialization notice:', err?.name || err);
        stopTracks();

        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setStatus('denied');
          setErrorMessage('Camera permission was denied. Click the lock/camera icon in your address bar to allow camera access.');
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          setStatus('unavailable');
          setErrorMessage('No camera hardware was detected on this device.');
        } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
          setStatus('unavailable');
          setErrorMessage('Camera is currently in use by another program or tab.');
        } else {
          setStatus('error');
          setErrorMessage(err?.message || 'Could not start camera feed.');
        }
        onCameraStateChange?.(false);
      }
    },
    [selectedDeviceId, stopTracks, onCameraStateChange, updateDeviceList]
  );

  // Disable camera
  const disableCamera = useCallback(() => {
    stopTracks();
    setStatus('idle');
    setErrorMessage(null);
    onCameraStateChange?.(false);
  }, [stopTracks, onCameraStateChange]);

  // Handle switching video device
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedDeviceId(newId);
    if (status === 'active') {
      startCamera(newId);
    }
  };

  // Clean unmount
  useEffect(() => {
    updateDeviceList();
    return () => {
      stopTracks();
    };
  }, [stopTracks, updateDeviceList]);

  return (
    <div className="flex flex-col bg-surface-container-low rounded-2xl border border-surface-variant/80 shadow-xs overflow-hidden">
      {/* Video Viewport Container */}
      <div className="relative aspect-video w-full bg-slate-900 rounded-t-2xl overflow-hidden flex items-center justify-center">
        {/* Real Live HTML5 Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-200 ${
            status === 'active' ? 'block' : 'hidden'
          } ${isMirrored ? 'scale-x-[-1]' : 'scale-x-100'}`}
        />

        {/* Status: Active Overlays */}
        {status === 'active' && (
          <>
            {/* Top Bar on Video: Live Badge & Controls */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold border border-white/10 pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Camera</span>
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                {/* Mirror Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMirrored(!isMirrored)}
                  className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                  title={isMirrored ? 'Disable mirror view' : 'Enable mirror view'}
                >
                  <span className="material-symbols-outlined text-[15px]">flip</span>
                </button>
              </div>
            </div>

            {/* Bottom Bar on Video: Candidate Info & Voice Status */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-xs text-white text-xs font-medium border border-white/10 pointer-events-auto">
                <span className="font-semibold truncate max-w-[120px]">{candidateName}</span>
                <span className="text-white/50 text-[10px]">|</span>
                <span className="text-[11px] text-emerald-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">
                    {isMicActive ? 'mic' : 'mic_none'}
                  </span>
                  <span>{isMicActive ? 'Mic Active' : 'Ready'}</span>
                </span>
              </div>

              {/* Live Audio Visualizer Overlay on Video */}
              {isMicActive && (
                <div className="flex items-end gap-0.5 h-4 px-2 py-1 rounded-md bg-black/65 backdrop-blur-xs border border-white/10 pointer-events-auto">
                  {[20, 50, 80, 100, 60, 30].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-emerald-400 transition-all duration-75"
                      style={{
                        height: `${Math.max(3, Math.min(14, (audioLevel / 100) * h))}px`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Status: Requesting Permissions */}
        {status === 'requesting' && (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-white/90">
            <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span className="text-xs font-semibold">Requesting camera access...</span>
            <span className="text-[11px] text-white/60">Please approve the browser camera prompt</span>
          </div>
        )}

        {/* Status: Idle / Disabled State */}
        {status === 'idle' && (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-white/90 max-w-xs">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white/80">
              <span className="material-symbols-outlined text-[26px]">videocam_off</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-white">Camera Preview Off</span>
              <span className="text-[11px] text-white/60 leading-relaxed">
                Enable your camera for a realistic interview experience. Video stays local and private.
              </span>
            </div>
            <button
              type="button"
              onClick={() => startCamera()}
              className="h-8 px-4 rounded-lg bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">videocam</span>
              <span>Enable Camera</span>
            </button>
          </div>
        )}

        {/* Status: Permission Denied */}
        {status === 'denied' && (
          <div className="flex flex-col items-center gap-2.5 p-6 text-center text-white/90 max-w-xs">
            <div className="w-10 h-10 rounded-xl bg-error/20 border border-error/40 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">videocam_off</span>
            </div>
            <span className="text-xs font-bold text-white">Camera Permission Denied</span>
            <span className="text-[11px] text-white/70 leading-relaxed">
              {errorMessage || 'Camera access was blocked. Please allow permissions in your address bar and retry.'}
            </span>
            <button
              type="button"
              onClick={() => startCamera()}
              className="h-7 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors mt-1"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              <span>Retry Permission</span>
            </button>
          </div>
        )}

        {/* Status: Unavailable / Hardware Error */}
        {(status === 'unavailable' || status === 'error' || status === 'insecure_origin') && (
          <div className="flex flex-col items-center gap-2.5 p-6 text-center text-white/90 max-w-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <span className="text-xs font-bold text-white">Camera Unavailable</span>
            <span className="text-[11px] text-white/70 leading-relaxed">
              {errorMessage || 'Camera is currently unavailable. You can continue with full voice interaction.'}
            </span>
            <button
              type="button"
              onClick={() => startCamera()}
              className="h-7 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors mt-1"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              <span>Check Again</span>
            </button>
          </div>
        )}
      </div>

      {/* Camera Control Footer & Device Switcher */}
      <div className="p-3 bg-surface-container-low flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Status pill & toggle */}
          <div className="flex items-center gap-2">
            {status === 'active' ? (
              <button
                type="button"
                onClick={disableCamera}
                className="h-7 px-2.5 rounded-lg bg-error/10 hover:bg-error/20 text-error font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Turn off webcam"
              >
                <span className="material-symbols-outlined text-[15px]">videocam_off</span>
                <span>Turn Off</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startCamera()}
                className="h-7 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Turn on webcam"
              >
                <span className="material-symbols-outlined text-[15px]">videocam</span>
                <span>Turn On</span>
              </button>
            )}

            {/* Speaking State indicator */}
            <span className="text-[11px] text-outline font-medium">
              {interviewState === 'listening'
                ? 'Candidate Speaking'
                : interviewState === 'interviewer_speaking'
                ? 'Interviewer Speaking'
                : 'Standby'}
            </span>
          </div>

          {/* Device Selection dropdown if multiple cameras exist */}
          {availableDevices.length > 1 && (
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-outline">Camera:</span>
              <select
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                className="h-7 px-2 rounded bg-surface-container border border-outline-variant text-on-surface text-[11px] font-medium focus:outline-none focus:border-primary max-w-[130px] truncate"
              >
                {availableDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Privacy & Visual Assessment Transparency Disclosure */}
        <div className="pt-2 border-t border-surface-variant flex items-start gap-1.5 text-[10px] text-outline leading-tight">
          <span className="material-symbols-outlined text-[12px] text-primary shrink-0 mt-0.5">lock</span>
          <span>
            <strong className="text-on-surface font-semibold">Candidate Privacy:</strong> Camera feed runs locally in browser. No video is recorded or sent to AI. Visual emotion analysis is disabled; evaluation is strictly based on spoken content.
          </span>
        </div>
      </div>
    </div>
  );
};
