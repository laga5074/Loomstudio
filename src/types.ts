export interface RecordingItem {
  id: string;
  title: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  resolution: string; // e.g., '1080p', '4K'
  fps: number;
  mimeType: string;
  createdAt: number; // timestamp
  blob: Blob;
  thumbnailUrl?: string;
  commentsCount?: number;
}

export interface VideoComment {
  id: string;
  recordingId: string;
  timestamp: number; // time in video (seconds)
  text: string;
  author: string;
  createdAt: number;
}

export interface EmojiReaction {
  id: string;
  recordingId: string;
  timestamp: number; // time in video (seconds)
  emoji: string;
  createdAt: number;
}

export interface ExtensionFile {
  path: string;
  name: string;
  content: string;
  language: string;
  category: 'manifest' | 'background' | 'offscreen' | 'popup' | 'options' | 'library' | 'player' | 'content' | 'shared' | 'docs';
}

export interface RecorderSettings {
  defaultResolution: '720p' | '1080p' | '1440p' | '4K';
  defaultFps: 30 | 60;
  audioEnabled: boolean;
  systemAudioEnabled: boolean;
  cameraEnabled: boolean;
  cameraPipShape: 'circle' | 'square' | 'rounded';
  countdownDuration: number; // seconds (0, 3, 5)
  autoPurgeDays: number; // 0 for off, or e.g., 30
  localEncryptionEnabled: boolean;
}

export interface MediaDeviceOption {
  deviceId: string;
  label: string;
}
