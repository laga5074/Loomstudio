import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  MessageSquare,
  Smile,
  Plus,
  Trash2,
  Share2,
  FileText,
  Clock,
  Sparkles,
  Maximize,
  Minimize
} from 'lucide-react';
import { RecordingItem, VideoComment, EmojiReaction } from '../types';
import { dbService } from '../lib/indexedDb';

interface VideoPlayerModalProps {
  recording: RecordingItem | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ recording, onClose }) => {
  if (!recording) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(recording.duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [activeFloatingEmojis, setActiveFloatingEmojis] = useState<{ id: string; emoji: string }[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoObjectUrl = useRef<string | null>(null);

  // Setup video source & fetch comments/reactions from IndexedDB
  useEffect(() => {
    if (recording.blob) {
      videoObjectUrl.current = URL.createObjectURL(recording.blob);
    }

    const loadData = async () => {
      const comms = await dbService.getCommentsByRecording(recording.id);
      setComments(comms);
      const reactList = await dbService.getReactionsByRecording(recording.id);
      setReactions(reactList);
    };
    loadData();

    return () => {
      if (videoObjectUrl.current) {
        URL.revokeObjectURL(videoObjectUrl.current);
      }
    };
  }, [recording.id]);

  // Handle Video Time Update and trigger emoji animations
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Check if any emoji reaction matches current timestamp (within 0.5s window)
      const matchingReactions = reactions.filter(
        (r) => Math.abs(r.timestamp - cur) < 0.4
      );

      if (matchingReactions.length > 0) {
        const bursts = matchingReactions.map((r) => ({ id: r.id + '_' + Math.random(), emoji: r.emoji }));
        setActiveFloatingEmojis(bursts);
        setTimeout(() => setActiveFloatingEmojis([]), 1500);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const jumpToTime = (timeSec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeSec;
      setCurrentTime(timeSec);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Add Comment at current video timestamp
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: VideoComment = {
      id: 'comm_' + Date.now(),
      recordingId: recording.id,
      timestamp: Math.round(currentTime),
      text: newCommentText.trim(),
      author: 'Local User',
      createdAt: Date.now(),
    };

    await dbService.addComment(newComment);
    setComments((prev) => [...prev, newComment].sort((a, b) => a.timestamp - b.timestamp));
    setNewCommentText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    await dbService.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  // Add Emoji Reaction at current video timestamp
  const handleAddReaction = async (emoji: string) => {
    const newReact: EmojiReaction = {
      id: 'react_' + Date.now(),
      recordingId: recording.id,
      timestamp: Math.round(currentTime),
      emoji,
      createdAt: Date.now(),
    };

    await dbService.addReaction(newReact);
    setReactions((prev) => [...prev, newReact]);

    // Show instant burst
    setActiveFloatingEmojis([{ id: newReact.id, emoji }]);
    setTimeout(() => setActiveFloatingEmojis([]), 1500);
  };

  const handleDownloadVideo = () => {
    if (videoObjectUrl.current) {
      const a = document.createElement('a');
      a.href = videoObjectUrl.current;
      a.download = `${recording.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownloadJsonMetadata = () => {
    const metadata = {
      recording,
      comments,
      reactions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title.replace(/[^a-z0-9]/gi, '_')}_metadata.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(Math.floor(sec % 60)).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div id="player-modal-backdrop" className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div id="player-modal-card" className="bg-[#0F0F12] border border-white/10 rounded-2xl max-w-6xl w-full p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto flex flex-col gap-6 text-[#E0E0E6]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D]">MEDIA REVIEWVAULT</span>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
              <span>{recording.title}</span>
            </h2>
            <p className="text-[10px] text-white/50 font-mono mt-0.5">
              {recording.resolution} • {recording.fps} FPS • Browser IndexedDB Stream
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadVideo}
              className="px-4 py-2 rounded-full bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 fill-black" />
              <span>Download MP4</span>
            </button>

            <button
              onClick={handleDownloadJsonMetadata}
              className="px-3.5 py-2 rounded-full bg-[#16161A] hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider border border-white/10 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#00FF9D]" />
              <span>Export Metadata</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Grid: Player on Left, Comments / Timeline on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video rounded-2xl bg-[#0A0A0C] overflow-hidden border border-white/10 group shadow-2xl">
              <video
                ref={videoRef}
                src={videoObjectUrl.current || undefined}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration || recording.duration);
                }}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
              />

              {/* Bursting Emoji Overlay */}
              {activeFloatingEmojis.length > 0 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center gap-4 z-30">
                  {activeFloatingEmojis.map((e) => (
                    <span key={e.id} className="text-6xl animate-bounce drop-shadow-2xl">
                      {e.emoji}
                    </span>
                  ))}
                </div>
              )}

              {/* Custom Timeline Controls Overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0A0A0C]/90 via-[#0A0A0C]/50 to-transparent p-4 flex flex-col gap-2">
                {/* Timeline Progress Bar */}
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 rounded-lg bg-white/20 appearance-none cursor-pointer accent-[#00FF9D]"
                />

                <div className="flex items-center justify-between text-xs text-white/80 font-mono">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="p-1 hover:text-[#00FF9D]">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                    <span className="text-[11px] font-bold">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="p-1 hover:text-[#00FF9D]"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Emoji Reaction Buttons */}
            <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D]">
                Pin Reaction Stamp at {formatTime(currentTime)}
              </span>
              <div className="flex items-center gap-2">
                {['😀', '🔥', '👍', '❤️', '👏', '💡', '🚀'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAddReaction(emoji)}
                    className="p-2.5 rounded-xl bg-[#16161A] hover:bg-white/10 text-xl transition-all hover:scale-110 active:scale-95 border border-white/5"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Timeline Comments */}
          <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-5 flex flex-col h-[480px]">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-4">
              <MessageSquare className="w-4 h-4 text-[#00FF9D]" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                Timeline Annotations ({comments.length})
              </h3>
            </div>

            {/* Comment Thread List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-xs text-white/40">
                  No timestamped notes yet. Pause video at any frame to pin a comment.
                </div>
              ) : (
                comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 rounded-xl bg-[#0A0A0C] border border-white/10 space-y-1.5 hover:border-[#00FF9D]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => jumpToTime(comm.timestamp)}
                        className="px-2 py-0.5 rounded bg-[#00FF9D]/10 text-[#00FF9D] font-mono text-[10px] font-bold border border-[#00FF9D]/30 flex items-center gap-1 hover:bg-[#00FF9D]/20"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(comm.timestamp)}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteComment(comm.id)}
                        className="text-white/40 hover:text-rose-400 text-xs p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs text-white/80 leading-relaxed">{comm.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Add Input */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                placeholder={`Note at ${formatTime(currentTime)}...`}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#00FF9D]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-wider transition-all shrink-0"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
