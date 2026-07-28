import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Video,
  Monitor,
  Camera,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Pause,
  RotateCcw,
  Sliders,
  Settings,
  Shield,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  ExternalLink,
  Layers,
  Sparkles,
  Link,
  Download,
  Share2,
  Film,
  Clipboard,
  Upload
} from 'lucide-react';
import { RecordingItem, RecorderSettings, MediaDeviceOption } from '../types';
import { dbService } from '../lib/indexedDb';
import { ScreenshotModal } from './ScreenshotModal';

interface RecorderAppProps {
  onRecordingSaved: (recording: RecordingItem) => void;
}

export const RecorderApp: React.FC<RecorderAppProps> = ({ onRecordingSaved }) => {
  // Check if getDisplayMedia is supported
  const isDisplayMediaAvailable = typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function';

  // Modal State
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState<boolean>(false);

  // Mode configuration: 'reaction' (YouTube/TikTok/IG/FB/MP4 video + Cam), 'camera'
  const [mode, setMode] = useState<'reaction' | 'screen' | 'camera' | 'both'>('reaction');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p' | '4K'>('1080p');
  const [aspectFormat, setAspectFormat] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  const [fps, setFps] = useState<30 | 60>(30);
  const [micEnabled, setMicEnabled] = useState(true);
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(true);
  const [pipShape, setPipShape] = useState<'circle' | 'square' | 'rounded'>('circle');
  const [pipPosition, setPipPosition] = useState<{ x: number; y: number }>({ x: 68, y: 62 }); // percentage from top/left
  const [pipSize, setPipSize] = useState<number>(28); // percentage width (15..50)
  const [isDraggingPip, setIsDraggingPip] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialPipX: number; initialPipY: number } | null>(null);
  const monitorContainerRef = useRef<HTMLDivElement | null>(null);
  const [countdown, setCountdown] = useState<number>(3);

  // Social Reaction Video Link state
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [embeddedEmbedUrl, setEmbeddedEmbedUrl] = useState<string>('');
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string>('');
  const [isResolvingVideo, setIsResolvingVideo] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  // Automatically detect platform based on current URL
  const detectedPlatform = useMemo(() => {
    const trimmed = videoUrl.trim().toLowerCase();
    if (!trimmed) return 'none';
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return 'youtube';
    if (trimmed.includes('tiktok.com')) return 'tiktok';
    if (trimmed.includes('instagram.com')) return 'instagram';
    if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) return 'facebook';
    return 'direct';
  }, [videoUrl]);

  // Device lists
  const [videoDevices, setVideoDevices] = useState<MediaDeviceOption[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

  // Active recording states
  const [recordingState, setRecordingState] = useState<'idle' | 'countdown' | 'recording' | 'paused'>('idle');
  const [countdownLeft, setCountdownLeft] = useState<number>(3);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedItem, setLastSavedItem] = useState<RecordingItem | null>(null);

  // Audio level visualizer state
  const [audioLevel, setAudioLevel] = useState<number>(20);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasAnimRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const videoAudioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement | null>(null);
  const socialVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Helper to get best available camera stream with robust mobile front/back and device selection support
  const getBestCameraStream = async (deviceId?: string, micId?: string) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported in this environment.');
    }

    // If specific device ID requested and not generic preset
    if (deviceId && deviceId !== 'user' && deviceId !== 'environment') {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: micEnabled ? (micId ? { deviceId: { exact: micId } } : true) : false,
        });
      } catch (err) {
        console.warn('Exact deviceId stream request failed, falling back:', err);
      }
    }

    // Back camera requested on mobile
    if (deviceId === 'environment') {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } },
          audio: micEnabled ? true : false,
        });
      } catch (e) {
        console.warn('Environment facingMode failed, falling back to front camera:', e);
      }
    }

    // Default to Front Camera on Mobile/Desktop
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: micEnabled ? true : false,
      });
    } catch (err) {
      console.warn('FacingMode user failed, trying basic video:', err);
    }

    // Fallback to basic video
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: micEnabled ? true : false,
    });
  };

  // Live camera preview initialization and device enumeration
  const startCameraPreview = useCallback(async () => {
    if (mode !== 'reaction' && mode !== 'camera' && mode !== 'both') return;
    try {
      const stream = await getBestCameraStream(selectedVideoDevice, selectedAudioDevice);
      cameraStreamRef.current = stream;

      if (cameraPreviewRef.current) {
        cameraPreviewRef.current.srcObject = stream;
        cameraPreviewRef.current.play().catch(() => {});
      }

      // Enumerate devices now that permission is granted
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices
          .filter((d) => d.kind === 'videoinput')
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || (i === 0 ? '📱 Front Camera (User)' : `📷 Camera ${i + 1}`)
          }));
        const audioInputs = devices
          .filter((d) => d.kind === 'audioinput')
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `🎙️ Microphone ${i + 1}`
          }));

        if (videoInputs.length > 0) {
          setVideoDevices(videoInputs);
        } else {
          setVideoDevices([
            { deviceId: 'user', label: '📱 Front Camera (User)' },
            { deviceId: 'environment', label: '📷 Back Camera (Environment)' },
          ]);
        }
        if (audioInputs.length > 0) setAudioDevices(audioInputs);
      }
    } catch (err: any) {
      console.warn('Camera preview initialization failed:', err);
    }
  }, [mode, selectedVideoDevice, selectedAudioDevice, micEnabled]);

  // Trigger camera preview on load or settings change
  useEffect(() => {
    startCameraPreview();
  }, [mode, selectedVideoDevice, startCameraPreview]);

  // Drag handlers for Camera PIP Bubble
  const handlePipMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDraggingPip(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialPipX: pipPosition.x,
      initialPipY: pipPosition.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingPip || !dragStartRef.current || !monitorContainerRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const rect = monitorContainerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaX = ((clientX - dragStartRef.current.startX) / rect.width) * 100;
      const deltaY = ((clientY - dragStartRef.current.startY) / rect.height) * 100;

      let newX = dragStartRef.current.initialPipX + deltaX;
      let newY = dragStartRef.current.initialPipY + deltaY;

      // Clamp within monitor bounds
      newX = Math.max(0, Math.min(100 - pipSize, newX));
      newY = Math.max(0, Math.min(100 - pipSize, newY));

      setPipPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingPip(false);
    };

    if (isDraggingPip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingPip, pipSize]);

  // Helper to parse input social media URL into video stream via server proxy or direct stream
  const processSocialUrl = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed.startsWith('local-file:')) {
      setIsResolvingVideo(false);
      return;
    }

    setIsResolvingVideo(true);
    videoAudioSourceRef.current = null;

    try {
      // Fetch resolved stream URL from Express backend
      const res = await fetch(`/api/resolve-video?url=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setResolvedVideoSrc(data.streamUrl || '');
        setEmbeddedEmbedUrl(data.embedUrl || '');
        setIsResolvingVideo(false);
        return;
      }
    } catch (err) {
      console.warn('Backend video resolve warning, using client fallback:', err);
    }

    // Direct proxy fallback for external video links
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      setResolvedVideoSrc('');
      setEmbeddedEmbedUrl(`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=0&enablejsapi=1`);
    } else {
      const proxiedUrl = `/api/proxy-video?url=${encodeURIComponent(trimmed)}`;
      setResolvedVideoSrc(proxiedUrl);
      setEmbeddedEmbedUrl('');
    }
    setIsResolvingVideo(false);
  };

  // Upload local video file
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      videoAudioSourceRef.current = null;
      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(`local-file:${file.name}`);
      setResolvedVideoSrc(objectUrl);
      setEmbeddedEmbedUrl('');
      setIsResolvingVideo(false);
    }
  };

  // Paste URL from Clipboard & Auto Load
  const handlePasteUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setVideoUrl(text.trim());
          processSocialUrl(text.trim());
          return;
        }
      }
      const text = prompt('Paste video link (YouTube, TikTok, Instagram, Facebook, MP4):');
      if (text && text.trim()) {
        setVideoUrl(text.trim());
        processSocialUrl(text.trim());
      }
    } catch (err) {
      const text = prompt('Paste video link (YouTube, TikTok, Instagram, Facebook, MP4):');
      if (text && text.trim()) {
        setVideoUrl(text.trim());
        processSocialUrl(text.trim());
      }
    }
  };

  useEffect(() => {
    const trimmed = videoUrl.trim();
    if (!trimmed) {
      setResolvedVideoSrc('');
      setEmbeddedEmbedUrl('');
      setIsResolvingVideo(false);
      return;
    }
    const timer = setTimeout(() => {
      processSocialUrl(trimmed);
    }, 450);
    return () => clearTimeout(timer);
  }, [videoUrl]);

  // Timer logic during active recording
  useEffect(() => {
    if (recordingState === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Sim audio level animation
      audioIntervalRef.current = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 60) + 30);
      }, 150);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setAudioLevel(10);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [recordingState]);

  // Start Countdown -> Launch Recording
  const startRecordingFlow = () => {
    setErrorMessage(null);
    setLastSavedItem(null);
    if (countdown > 0) {
      setRecordingState('countdown');
      setCountdownLeft(countdown);
      const cdInterval = setInterval(() => {
        setCountdownLeft((prev) => {
          if (prev <= 1) {
            clearInterval(cdInterval);
            initiateCapture();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      initiateCapture();
    }
  };

  // Initiate Stream Capture & MediaRecorder safely
  const initiateCapture = async () => {
    recordedChunksRef.current = [];
    setElapsedSeconds(0);

    try {
      let finalStream: MediaStream;

      // 1. Get or verify active Camera stream
      let camStream: MediaStream | null = cameraStreamRef.current;
      if (!camStream || !camStream.active || camStream.getVideoTracks().length === 0) {
        if (mode === 'camera' || mode === 'both' || mode === 'reaction') {
          try {
            camStream = await getBestCameraStream(selectedVideoDevice, selectedAudioDevice);
            cameraStreamRef.current = camStream;

            if (cameraPreviewRef.current) {
              cameraPreviewRef.current.srcObject = camStream;
              cameraPreviewRef.current.play().catch(() => {});
            }
          } catch (camErr: any) {
            console.warn('Camera stream warning:', camErr);
            if (mode === 'camera') {
              throw new Error(camErr.message || 'Camera access was denied.');
            }
          }
        }
      }

      // 2. Composite Canvas Stream for Reaction Mode or Direct Stream
      if (mode === 'reaction' || mode === 'camera' || (mode === 'camera' && !isDisplayMediaAvailable)) {
        // Calculate dimensions based on resolution & selected aspectFormat
        let baseDim = 1080;
        if (resolution === '720p') baseDim = 720;
        if (resolution === '1440p') baseDim = 1440;
        if (resolution === '4K') baseDim = 2160;

        let canvasWidth = 1920;
        let canvasHeight = 1080;

        if (aspectFormat === '16:9') {
          canvasHeight = baseDim;
          canvasWidth = Math.round(baseDim * (16 / 9));
        } else if (aspectFormat === '9:16') {
          canvasWidth = baseDim;
          canvasHeight = Math.round(baseDim * (16 / 9));
        } else if (aspectFormat === '1:1') {
          canvasWidth = baseDim;
          canvasHeight = baseDim;
        } else if (aspectFormat === '4:5') {
          canvasWidth = baseDim;
          canvasHeight = Math.round(baseDim * (5 / 4));
        }

        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        // Check if social video element is ready or if we need tab screen capture (for iframe embed or missing stream)
        if (mode === 'reaction') {
          if (socialVideoRef.current && (socialVideoRef.current.videoWidth > 0 || socialVideoRef.current.readyState >= 1)) {
            try {
              socialVideoRef.current.muted = false;
              await socialVideoRef.current.play();
              setIsVideoPlaying(true);
            } catch (pErr) {
              console.warn('Auto play reaction video warning:', pErr);
            }
          } else if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            // Screen / Tab capture fallback for embedded iframe videos or unstreamable links
            try {
              const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: 'browser' } as any,
                audio: true,
              });
              screenStreamRef.current = displayStream;

              let hiddenVid = screenVideoRef.current;
              if (!hiddenVid) {
                hiddenVid = document.createElement('video');
                hiddenVid.autoplay = true;
                hiddenVid.muted = true;
                hiddenVid.playsInline = true;
                screenVideoRef.current = hiddenVid;
              }
              hiddenVid.srcObject = displayStream;
              await hiddenVid.play().catch(() => {});
            } catch (dispErr) {
              console.warn('Tab screen capture fallback rejected or cancelled:', dispErr);
            }
          }
        }

        const drawFrame = () => {
          if (!ctx) return;
          // Background fill - pure black base
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (mode === 'camera') {
            // Draw full camera feed on canvas with contain fit
            if (cameraPreviewRef.current && (cameraPreviewRef.current.videoWidth > 0 || cameraPreviewRef.current.readyState >= 1)) {
              try {
                const vW = cameraPreviewRef.current.videoWidth || canvas.width;
                const vH = cameraPreviewRef.current.videoHeight || canvas.height;
                const vAspect = vW / vH;
                const cAspect = canvas.width / canvas.height;

                let dW = canvas.width;
                let dH = canvas.height;
                let dX = 0;
                let dY = 0;

                if (vAspect > cAspect) {
                  dH = canvas.width / vAspect;
                  dY = (canvas.height - dH) / 2;
                } else {
                  dW = canvas.height * vAspect;
                  dX = (canvas.width - dW) / 2;
                }
                ctx.drawImage(cameraPreviewRef.current, dX, dY, dW, dH);
              } catch (camDrawErr) {
                console.warn('Camera draw warning:', camDrawErr);
              }
            }
          } else {
            // Reaction Mode: Draw social video element OR screen video element centered with contain fit
            const activeVideoElem = (socialVideoRef.current && (socialVideoRef.current.videoWidth > 0 || socialVideoRef.current.readyState >= 1))
              ? socialVideoRef.current
              : (screenVideoRef.current && (screenVideoRef.current.videoWidth > 0 || screenVideoRef.current.readyState >= 1))
                ? screenVideoRef.current
                : null;

            if (activeVideoElem) {
              try {
                const vW = activeVideoElem.videoWidth || canvas.width;
                const vH = activeVideoElem.videoHeight || canvas.height;
                const vAspect = vW / vH;
                const cAspect = canvas.width / canvas.height;

                let dW = canvas.width;
                let dH = canvas.height;
                let dX = 0;
                let dY = 0;

                if (vAspect > cAspect) {
                  dH = canvas.width / vAspect;
                  dY = (canvas.height - dH) / 2;
                } else {
                  dW = canvas.height * vAspect;
                  dX = (canvas.width - dW) / 2;
                }
                ctx.drawImage(activeVideoElem, dX, dY, dW, dH);
              } catch (vidDrawErr) {
                console.warn('Social video canvas draw warning:', vidDrawErr);
              }
            }

            // Draw camera PIP overlay (NO text, NO watermark)
            if (cameraPreviewRef.current && cameraPreviewRef.current.readyState >= 2) {
              try {
                const pipWidth = canvas.width * (pipSize / 100);
                const pipHeight = pipShape === 'circle' ? pipWidth : canvas.height * (pipSize / 100) * 0.75;
                const pipX = canvas.width * (pipPosition.x / 100);
                const pipY = canvas.height * (pipPosition.y / 100);

                ctx.save();
                if (pipShape === 'circle') {
                  ctx.beginPath();
                  ctx.arc(pipX + pipWidth / 2, pipY + pipWidth / 2, pipWidth / 2, 0, Math.PI * 2);
                  ctx.closePath();
                  ctx.clip();
                } else if (pipShape === 'rounded') {
                  ctx.beginPath();
                  ctx.roundRect(pipX, pipY, pipWidth, pipHeight, 24);
                  ctx.closePath();
                  ctx.clip();
                }

                ctx.drawImage(cameraPreviewRef.current, pipX, pipY, pipWidth, pipHeight);

                // Border
                ctx.restore();
                ctx.lineWidth = 6;
                ctx.strokeStyle = '#00FF9D';
                if (pipShape === 'circle') {
                  ctx.beginPath();
                  ctx.arc(pipX + pipWidth / 2, pipY + pipWidth / 2, pipWidth / 2, 0, Math.PI * 2);
                  ctx.stroke();
                } else {
                  ctx.strokeRect(pipX, pipY, pipWidth, pipHeight);
                }
              } catch (pipDrawErr) {
                console.warn('PIP draw warning:', pipDrawErr);
              }
            }
          }

          canvasAnimRef.current = requestAnimationFrame(drawFrame);
        };

        drawFrame();

        const canvasStream = canvas.captureStream(fps);

        // Mix mic audio, reaction video audio, and screen capture audio together
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            if (!audioCtxRef.current) {
              audioCtxRef.current = new AudioContextClass();
            }
            const audioCtx = audioCtxRef.current;
            if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
            }

            const dest = audioCtx.createMediaStreamDestination();

            // Mic / Camera track
            if (camStream && camStream.getAudioTracks().length > 0) {
              const micSource = audioCtx.createMediaStreamSource(camStream);
              micSource.connect(dest);
            }

            // Screen audio track if tab/window capture active
            if (screenStreamRef.current && screenStreamRef.current.getAudioTracks().length > 0) {
              try {
                const screenAudioSource = audioCtx.createMediaStreamSource(screenStreamRef.current);
                screenAudioSource.connect(dest);
              } catch (sErr) {
                console.warn('Screen audio source warning:', sErr);
              }
            }

            // Reaction Video audio
            if (socialVideoRef.current && socialVideoRef.current.src) {
              if (!videoAudioSourceRef.current) {
                try {
                  videoAudioSourceRef.current = audioCtx.createMediaElementSource(socialVideoRef.current);
                } catch (e) {
                  console.warn('Video audio source attach warning:', e);
                }
              }
              if (videoAudioSourceRef.current) {
                videoAudioSourceRef.current.connect(dest);
                videoAudioSourceRef.current.connect(audioCtx.destination);
              }
            }

            const mixedTrack = dest.stream.getAudioTracks()[0];
            if (mixedTrack) {
              canvasStream.addTrack(mixedTrack);
            }
          } else if (camStream && camStream.getAudioTracks().length > 0) {
            canvasStream.addTrack(camStream.getAudioTracks()[0]);
          }
        } catch (audioErr) {
          console.warn('Audio mix fallback:', audioErr);
          if (camStream && camStream.getAudioTracks().length > 0) {
            canvasStream.addTrack(camStream.getAudioTracks()[0]);
          }
        }

        finalStream = canvasStream;
      } else if (mode === 'screen' || mode === 'both') {
        if (typeof navigator.mediaDevices?.getDisplayMedia !== 'function') {
          throw new Error(
            'Screen capture is restricted in this embedded iframe. Switch to Reaction Mode or Cam Mode to record!'
          );
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: fps },
          audio: systemAudioEnabled,
        });
        screenStreamRef.current = screenStream;

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = screenStream;
          previewVideoRef.current.play().catch(() => {});
        }

        screenStream.getVideoTracks()[0].onended = () => {
          stopRecording();
        };

        finalStream = screenStream;
      } else {
        if (!cameraStreamRef.current) {
          throw new Error('No camera stream available.');
        }
        finalStream = cameraStreamRef.current;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = cameraStreamRef.current;
          previewVideoRef.current.play().catch(() => {});
        }
      }

      // 3. MediaRecorder Setup
      const mimeType = MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(finalStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (canvasAnimRef.current) cancelAnimationFrame(canvasAnimRef.current);

        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
        const recordId = 'rec_' + Date.now();
        const durationSec = Math.max(elapsedSeconds, 1);

        const newRecording: RecordingItem = {
          id: recordId,
          title: `Reaction Record (${resolution}) - ${new Date().toLocaleTimeString()}`,
          duration: durationSec,
          fileSize: blob.size,
          resolution,
          fps,
          mimeType: 'video/mp4',
          createdAt: Date.now(),
          blob,
        };

        await dbService.saveRecording(newRecording);

        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        setRecordingState('idle');
        setLastSavedItem(newRecording);
        onRecordingSaved(newRecording);

        // Auto download MP4 file to user's device immediately
        handleDownloadMp4(newRecording);
      };

      recorder.start(500);
      setRecordingState('recording');
      // Auto play reaction video if HTML5 video
      if (socialVideoRef.current) {
        socialVideoRef.current.play().catch(() => {});
        setIsVideoPlaying(true);
      }
    } catch (err: any) {
      console.error('Recording initialization error:', err);
      setRecordingState('idle');
      setErrorMessage(err.message || 'Permission denied or stream failed.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (socialVideoRef.current) socialVideoRef.current.pause();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      if (socialVideoRef.current) socialVideoRef.current.play();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (socialVideoRef.current) socialVideoRef.current.pause();
    }
  };

  const handleDownloadMp4 = (item: RecordingItem) => {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const formatTimer = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div id="recorder-app-container" className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5 text-[#E0E0E6] overflow-x-hidden">
      {/* Hidden Canvas Compositor */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F12] border border-white/10 p-5 rounded-2xl shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00FF9D]/10 border border-[#00FF9D]/30 flex items-center justify-center text-[#00FF9D]">
              <Film className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Social Reaction & Studio Recorder</h1>
            <span className="px-2.5 py-0.5 rounded-full border border-[#00FF9D]/30 bg-[#00FF9D]/10 text-[#00FF9D] text-[10px] font-bold uppercase tracking-widest">
              MP4 LOCAL ENGINE
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            React to YouTube, TikTok, Instagram, or Facebook videos with your webcam and save as MP4 to your device.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsScreenshotModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#00FF9D]/10 border border-[#00FF9D]/40 hover:bg-[#00FF9D]/20 text-[#00FF9D] text-xs font-bold flex items-center gap-1.5 transition-colors uppercase tracking-wider shadow-lg shadow-[#00FF9D]/10"
          >
            <Camera className="w-3.5 h-3.5 text-[#00FF9D]" />
            <span>Screenshot & Extension</span>
          </button>
          <button
            onClick={openInNewTab}
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-[#00FF9D]/50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors uppercase tracking-wider"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#00FF9D]" />
            <span>Open Standalone Tab</span>
          </button>
        </div>
      </div>

      {/* Save Success Banner with Direct MP4 Download Button */}
      {lastSavedItem && (
        <div className="p-4 rounded-2xl bg-[#00FF9D]/10 border border-[#00FF9D] text-white text-xs flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#00FF9D] shrink-0" />
            <div>
              <p className="font-extrabold text-white text-sm">Reaction Recording Saved Locally!</p>
              <p className="text-white/70 text-xs mt-0.5">
                Saved into browser IndexedDB as MP4 ({Math.round(lastSavedItem.fileSize / (1024 * 1024))} MB).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadMp4(lastSavedItem)}
              className="px-6 py-2.5 rounded-full bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-widest hover:bg-[#00FF9D]/90 transition-all shadow-lg shadow-[#00FF9D]/20 flex items-center gap-2"
            >
              <Download className="w-4 h-4 fill-black" />
              <span>Download MP4 File</span>
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={openInNewTab}
            className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-100 hover:bg-rose-500/30 font-bold text-[11px] uppercase tracking-wider"
          >
            Try In New Tab
          </button>
        </div>
      )}

      {/* Main Studio High-Density Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monitor Screen */}
        <div className="lg:col-span-2 space-y-4">

          {/* Social Media Link Bar for Reaction Mode */}
          {mode === 'reaction' && (
            <div className="p-3.5 sm:p-4 bg-[#0F0F12] border border-white/10 rounded-2xl space-y-3 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D] flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  Target Reaction Video URL
                </span>
                <span className="text-[10px] text-white/50">YouTube • TikTok • Instagram • Facebook • MP4</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube, TikTok, Instagram, Facebook, or MP4 link..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full sm:flex-1 bg-[#0A0A0C] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#00FF9D] transition-colors"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handlePasteUrl}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    title="Paste link from clipboard and load video automatically"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-[#00FF9D]" />
                    <span>Paste</span>
                  </button>
                  <label
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                    title="Upload local video file from computer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#00FF9D]" />
                    <span>Upload</span>
                    <input type="file" accept="video/*" onChange={handleLocalFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Quick Presets & Detected Platform Badge */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] text-white/40 uppercase font-bold">Platform:</span>
                <button
                  onClick={() => {
                    const u = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                    setVideoUrl(u);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
                    detectedPlatform === 'youtube'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/50 shadow-md shadow-rose-500/20'
                      : 'bg-[#16161A] hover:bg-white/10 border-white/10 text-rose-400'
                  }`}
                >
                  🔴 YouTube
                </button>
                <button
                  onClick={() => {
                    const u = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
                    setVideoUrl(u);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
                    detectedPlatform === 'tiktok'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/50 shadow-md shadow-cyan-500/20'
                      : 'bg-[#16161A] hover:bg-white/10 border-white/10 text-cyan-400'
                  }`}
                >
                  🎵 TikTok Reel
                </button>
                <button
                  onClick={() => {
                    const u = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
                    setVideoUrl(u);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
                    detectedPlatform === 'instagram'
                      ? 'bg-pink-500/20 border-pink-500 text-pink-300 ring-2 ring-pink-500/50 shadow-md shadow-pink-500/20'
                      : 'bg-[#16161A] hover:bg-white/10 border-white/10 text-pink-400'
                  }`}
                >
                  📸 Instagram Reel
                </button>
                <button
                  onClick={() => {
                    const u = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
                    setVideoUrl(u);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
                    detectedPlatform === 'facebook'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/50 shadow-md shadow-blue-500/20'
                      : 'bg-[#16161A] hover:bg-white/10 border-white/10 text-blue-400'
                  }`}
                >
                  📘 Facebook Clip
                </button>
              </div>
            </div>
          )}

          {/* Main Monitor Display Frame */}
          <div
            ref={monitorContainerRef}
            className={`relative rounded-2xl bg-[#0F0F12] border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center select-none transition-all ${
              aspectFormat === '9:16'
                ? 'aspect-[9/16] w-full max-w-[340px] mx-auto min-h-[500px]'
                : aspectFormat === '1:1'
                ? 'aspect-square w-full max-w-[460px] mx-auto'
                : aspectFormat === '4:5'
                ? 'aspect-[4/5] w-full max-w-[420px] mx-auto'
                : 'aspect-video w-full'
            }`}
          >
            {/* Countdown Overlay */}
            {recordingState === 'countdown' && (
              <div className="absolute inset-0 z-30 bg-[#0A0A0C]/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
                <span className="text-8xl font-black text-[#00FF9D] tracking-tighter animate-pulse">{countdownLeft}</span>
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">Initializing Reaction Stream...</p>
              </div>
            )}

            {/* Display for Social Reaction Video */}
            {mode === 'reaction' ? (
              isResolvingVideo ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 z-10">
                  <div className="w-8 h-8 rounded-full border-2 border-[#00FF9D] border-t-transparent animate-spin" />
                  <p className="text-xs font-bold text-white/70">Connecting Reaction Video Stream...</p>
                </div>
              ) : !resolvedVideoSrc && !embeddedEmbedUrl ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#00FF9D]/10 border border-[#00FF9D]/30 flex items-center justify-center text-[#00FF9D]">
                    <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">No Reaction Video Loaded</h3>
                    <p className="text-xs text-white/50 max-w-sm mt-1">
                      Paste a YouTube, TikTok, Instagram, or Facebook link above or click <span className="text-[#00FF9D] font-bold">Paste</span>.
                    </p>
                  </div>
                </div>
              ) : resolvedVideoSrc ? (
                <video
                  ref={socialVideoRef}
                  src={resolvedVideoSrc}
                  controls
                  loop
                  autoPlay
                  muted
                  playsInline
                  crossOrigin={resolvedVideoSrc.startsWith('blob:') || resolvedVideoSrc.startsWith('data:') ? undefined : 'anonymous'}
                  onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
                  onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
                  onError={() => {
                    console.warn('Direct MP4 video stream failed to play, switching to embedded player fallback');
                    setResolvedVideoSrc('');
                  }}
                  className="w-full h-full object-contain bg-black"
                />
              ) : embeddedEmbedUrl ? (
                <div className="relative w-full h-full">
                  <iframe
                    src={embeddedEmbedUrl}
                    title="Target Reaction Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0 bg-black"
                  />
                  <div className="absolute top-2 left-2 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-md bg-black/80 border border-[#00FF9D]/40 text-[#00FF9D] text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm">
                      Embed Player Sync Active
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#00FF9D]/10 border border-[#00FF9D]/30 flex items-center justify-center text-[#00FF9D]">
                    <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">No Reaction Video Loaded</h3>
                    <p className="text-xs text-white/50 max-w-sm mt-1">
                      Paste a YouTube, TikTok, Instagram, or Facebook link above or click <span className="text-[#00FF9D] font-bold">Paste</span> or <span className="text-[#00FF9D] font-bold">Upload</span>.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            )}

            {/* Draggable & Resizable Camera PIP Overlay */}
            {(mode === 'reaction' || mode === 'both' || mode === 'camera') && (
              <div
                style={{
                  left: `${pipPosition.x}%`,
                  top: `${pipPosition.y}%`,
                  width: `${pipSize}%`,
                  aspectRatio: pipShape === 'circle' ? '1/1' : '16/9',
                }}
                onMouseDown={handlePipMouseDown}
                onTouchStart={handlePipMouseDown}
                className={`absolute z-20 border-2 border-[#00FF9D] shadow-2xl overflow-hidden bg-black cursor-grab active:cursor-grabbing group hover:border-white transition-shadow ${
                  pipShape === 'circle' ? 'rounded-full' : pipShape === 'rounded' ? 'rounded-2xl' : 'rounded-lg'
                }`}
                title="Click and drag to move camera anywhere on reaction video"
              >
                <video
                  ref={cameraPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute inset-0 bg-[#00FF9D]/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-black bg-[#00FF9D] px-2 py-0.5 rounded shadow">
                    Drag Cam
                  </span>
                </div>
              </div>
            )}

            {/* Live Recording HUD Overlay */}
            {(recordingState === 'recording' || recordingState === 'paused') && (
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3 bg-[#0A0A0C]/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-xl pointer-events-auto">
                  <span className={`w-2.5 h-2.5 rounded-full ${recordingState === 'recording' ? 'bg-[#00FF9D] animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[11px] font-extrabold text-white uppercase tracking-widest">
                    {recordingState === 'recording' ? 'REC' : 'PAUSED'}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#00FF9D] ml-1">{formatTimer(elapsedSeconds)}</span>
                </div>

                <div className="bg-[#0A0A0C]/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 text-[10px] font-bold text-white/80 uppercase tracking-widest">
                  {resolution} • MP4 EXPORT
                </div>
              </div>
            )}

            {/* Live Audio Level Meter */}
            {recordingState === 'recording' && (
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-[#0A0A0C]/80 px-3 py-1.5 rounded-full border border-white/10">
                <Mic className="w-3.5 h-3.5 text-[#00FF9D]" />
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00FF9D] transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Active Recording Controls Bar */}
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <div className="p-4 rounded-2xl bg-[#0F0F12] border border-white/10 flex items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                {recordingState === 'recording' ? (
                  <button
                    onClick={pauseRecording}
                    className="px-4 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-2 transition-all uppercase tracking-wider"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={resumeRecording}
                    className="px-4 py-2 rounded-full bg-[#00FF9D]/10 hover:bg-[#00FF9D]/20 text-[#00FF9D] font-bold text-xs border border-[#00FF9D]/30 flex items-center gap-2 transition-all uppercase tracking-wider"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2.5 rounded-full border text-xs transition-all ${
                    isMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-white/5 text-white/80 border-white/10 hover:text-white'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#00FF9D]" />}
                </button>
              </div>

              <button
                onClick={stopRecording}
                className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop & Save MP4</span>
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Control Panel & Settings */}
        <div className="space-y-5 bg-[#0F0F12] p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#00FF9D]" />
              <h2 className="font-bold text-white text-xs uppercase tracking-widest">Configuration</h2>
            </div>
            <span className="text-[10px] font-mono text-[#00FF9D]">MP4 Native</span>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Capture Target</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('reaction')}
                className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all ${
                  mode === 'reaction'
                    ? 'bg-[#00FF9D]/10 border-[#00FF9D] text-[#00FF9D]'
                    : 'bg-[#16161A] border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4 text-[#00FF9D]" />
                <span>Reaction Link + Cam</span>
              </button>

              <button
                onClick={() => setMode('camera')}
                className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all ${
                  mode === 'camera'
                    ? 'bg-[#00FF9D]/10 border-[#00FF9D] text-[#00FF9D]'
                    : 'bg-[#16161A] border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Webcam Only</span>
              </button>
            </div>
          </div>

          {/* Video Aspect Ratio / Social Format Selector */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Record Video Format</label>
              <span className="text-[10px] text-[#00FF9D] font-mono">{aspectFormat} Ratio</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAspectFormat('16:9')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  aspectFormat === '16:9'
                    ? 'bg-[#00FF9D]/10 border-[#00FF9D] text-[#00FF9D]'
                    : 'bg-[#16161A] border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <span>🔴 16:9</span>
                </div>
                <p className="text-[9px] text-white/40 mt-0.5 font-medium">YouTube / Desktop</p>
              </button>

              <button
                onClick={() => setAspectFormat('9:16')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  aspectFormat === '9:16'
                    ? 'bg-[#00FF9D]/10 border-[#00FF9D] text-[#00FF9D]'
                    : 'bg-[#16161A] border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <span>📱 9:16</span>
                </div>
                <p className="text-[9px] text-white/40 mt-0.5 font-medium">Reels / Shorts / TikTok</p>
              </button>

              <button
                onClick={() => setAspectFormat('1:1')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  aspectFormat === '1:1'
                    ? 'bg-[#00FF9D]/10 border-[#00FF9D] text-[#00FF9D]'
                    : 'bg-[#16161A] border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <span>📸 1:1</span>
                </div>
                <p className="text-[9px] text-white/40 mt-0.5 font-medium">Instagram Post</p>
              </button>

              <button
                onClick={() => setAspectFormat('4:5')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  aspectFormat === '4:5'
                    ? 'bg-[#00FF9D]/10 border-[#00FF9D] text-[#00FF9D]'
                    : 'bg-[#16161A] border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <span>📲 4:5</span>
                </div>
                <p className="text-[9px] text-white/40 mt-0.5 font-medium">Social Feed</p>
              </button>
            </div>
          </div>

          {/* Camera Device Switcher for PC & Mobile */}
          {(mode === 'reaction' || mode === 'camera' || mode === 'both') && (
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Camera Source (PC & Mobile)</label>
                <span className="text-[10px] text-[#00FF9D] font-mono">Switch Camera</span>
              </div>
              <select
                value={selectedVideoDevice}
                onChange={(e) => setSelectedVideoDevice(e.target.value)}
                className="w-full bg-[#16161A] border border-white/10 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#00FF9D]"
              >
                {videoDevices.length > 0 ? (
                  videoDevices.map((d) => (
                    <option key={d.deviceId || d.label} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="user">📱 Front Camera (User)</option>
                    <option value="environment">📷 Back Camera (Environment)</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* PIP Camera Resize & Position Controls */}
          {(mode === 'reaction' || mode === 'camera' || mode === 'both') && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Cam Size ({pipSize}%)</label>
                <span className="text-[10px] text-[#00FF9D] font-mono">Drag handle or slide</span>
              </div>
              <input
                type="range"
                min={15}
                max={50}
                value={pipSize}
                onChange={(e) => setPipSize(Number(e.target.value))}
                className="w-full accent-[#00FF9D] bg-white/10 rounded-lg cursor-pointer h-1.5"
              />

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Cam Position Presets</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setPipPosition({ x: 4, y: 4 })}
                    className="px-2 py-1.5 rounded bg-[#16161A] hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70"
                  >
                    ↖ Top Left
                  </button>
                  <button
                    onClick={() => setPipPosition({ x: 100 - pipSize - 4, y: 4 })}
                    className="px-2 py-1.5 rounded bg-[#16161A] hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70"
                  >
                    ↗ Top Right
                  </button>
                  <button
                    onClick={() => setPipPosition({ x: 4, y: 100 - pipSize - 4 })}
                    className="px-2 py-1.5 rounded bg-[#16161A] hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70"
                  >
                    ↙ Bottom Left
                  </button>
                  <button
                    onClick={() => setPipPosition({ x: 100 - pipSize - 4, y: 100 - pipSize - 4 })}
                    className="px-2 py-1.5 rounded bg-[#16161A] hover:bg-white/10 border border-white/10 text-[10px] font-bold text-[#00FF9D]"
                  >
                    ↘ Bottom Right
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Webcam Frame Style</label>
                <div className="flex gap-2">
                  {(['circle', 'rounded', 'square'] as const).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => setPipShape(shape)}
                      className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold capitalize transition-all ${
                        pipShape === shape
                          ? 'bg-[#00FF9D]/10 border-[#00FF9D] text-[#00FF9D]'
                          : 'bg-[#16161A] border-white/10 text-white/50'
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Audio Toggles */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80">Microphone Audio</span>
              <input
                type="checkbox"
                checked={micEnabled}
                onChange={(e) => setMicEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-[#00FF9D] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/80">System Sound</span>
              <input
                type="checkbox"
                checked={systemAudioEnabled}
                onChange={(e) => setSystemAudioEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-[#00FF9D] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Countdown</label>
              <select
                value={countdown}
                onChange={(e) => setCountdown(Number(e.target.value))}
                className="w-full bg-[#16161A] border border-white/10 rounded-xl p-2 text-xs text-white"
              >
                <option value={0}>Instant (0s)</option>
                <option value={3}>3 Seconds</option>
                <option value={5}>5 Seconds</option>
              </select>
            </div>
          </div>

          {/* Main Action Start Button */}
          {recordingState === 'idle' && (
            <button
              onClick={startRecordingFlow}
              className="w-full py-4 rounded-full bg-[#00FF9D] hover:bg-[#00FF9D]/90 text-black font-extrabold text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#00FF9D]/20 flex items-center justify-center gap-3 transition-all active:scale-98"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-black animate-pulse" />
              <span>Start Reaction Recording</span>
            </button>
          )}
        </div>
      </div>

      {/* Screenshot & Extension Modal */}
      <ScreenshotModal
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        activeVideoRef={socialVideoRef}
        canvasRef={canvasRef}
      />
    </div>
  );
};


