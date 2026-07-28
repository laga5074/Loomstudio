import React, { useState, useEffect } from 'react';
import {
  FileVideo,
  Play,
  Trash2,
  Download,
  HardDrive,
  Search,
  Plus,
  Clock,
  Calendar,
  Edit2,
  Check,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { RecordingItem } from '../types';
import { dbService } from '../lib/indexedDb';

interface VideoLibraryProps {
  onSelectRecording: (recording: RecordingItem) => void;
  onRefreshTrigger?: number;
}

export const VideoLibrary: React.FC<VideoLibraryProps> = ({
  onSelectRecording,
  onRefreshTrigger,
}) => {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number }>({ usage: 0, quota: 1 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecordings = async () => {
    setIsLoading(true);
    try {
      const items = await dbService.getAllRecordings();
      setRecordings(items);

      const estimate = await dbService.getStorageEstimate();
      setStorageEstimate(estimate);
    } catch (err) {
      console.error('Failed to load recordings from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, [onRefreshTrigger]);

  // Load a realistic Sample Video if the user wants to test right away
  const handleLoadSampleVideo = async () => {
    // Generate a minimal sample webm canvas video
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Draw nice gradient sample background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('LocalLoom Sample Recording', 320, 340);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px sans-serif';
    ctx.fillText('100% Stored in Browser IndexedDB', 420, 400);

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const sampleItem: RecordingItem = {
        id: 'sample_' + Date.now(),
        title: 'Demo Walkthrough - Privacy-First Recorder',
        duration: 15,
        fileSize: blob.size || 1500000,
        resolution: '1080p',
        fps: 30,
        mimeType: 'video/webm',
        createdAt: Date.now(),
        blob: blob,
      };

      await dbService.saveRecording(sampleItem);
      fetchRecordings();
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 500);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this recording from local storage?')) {
      await dbService.deleteRecording(id);
      fetchRecordings();
    }
  };

  const handleStartRename = (item: RecordingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditingTitle(item.title);
  };

  const handleSaveRename = async (item: RecordingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      const updated = { ...item, title: editingTitle.trim() };
      await dbService.updateRecording(updated);
      setEditingId(null);
      fetchRecordings();
    }
  };

  const handleDownloadFile = (item: RecordingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredRecordings = recordings.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const storageUsageMb = (storageEstimate.usage / (1024 * 1024)).toFixed(1);
  const storageQuotaGb = (storageEstimate.quota / (1024 * 1024 * 1024)).toFixed(1);
  const usagePercentage = Math.min(
    ((storageEstimate.usage / (storageEstimate.quota || 1)) * 100),
    100
  ).toFixed(1);

  return (
    <div id="video-library-container" className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6 bg-[#0A0A0C] text-[#E0E0E6]">
      {/* Library Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D]">PERSISTENT MEDIA VAULT</span>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
            <FileVideo className="w-5 h-5 text-[#00FF9D]" />
            <span>Local IndexedDB Library</span>
          </h1>
        </div>

        <button
          onClick={handleLoadSampleVideo}
          className="px-4 py-2 bg-[#16161A] hover:bg-white/10 text-[#00FF9D] font-bold text-xs uppercase tracking-wider rounded-full border border-white/10 flex items-center gap-2 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00FF9D]" />
          <span>Load Demo Video</span>
        </button>
      </div>

      {/* Storage Meter Bar */}
      <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2 text-white/80">
            <HardDrive className="w-4 h-4 text-[#00FF9D]" />
            <span className="text-[11px] font-bold uppercase tracking-wider">IndexedDB Storage Allocated</span>
          </div>
          <span className="text-[#00FF9D] font-mono text-[11px] font-bold">
            {storageUsageMb} MB / {storageQuotaGb} GB ({usagePercentage}%)
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-[#16161A] overflow-hidden border border-white/5">
          <div
            className="h-full bg-[#00FF9D] transition-all duration-500"
            style={{ width: `${Math.max(Number(usagePercentage), 1)}%` }}
          />
        </div>
      </div>

      {/* Toolbar Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search local vault recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F0F12] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#00FF9D]"
          />
        </div>
      </div>

      {/* Grid of Videos */}
      {isLoading ? (
        <div className="py-20 text-center text-white/40 text-xs font-mono uppercase tracking-widest">Reading IndexedDB...</div>
      ) : filteredRecordings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-[#16161A] text-[#00FF9D] border border-white/10 flex items-center justify-center mx-auto">
            <FileVideo className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">Local Vault Empty</h3>
          <p className="text-xs text-white/60">
            {searchQuery
              ? 'No recordings match your search query.'
              : 'You haven\'t saved any recordings yet. Record now or load a demo video!'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleLoadSampleVideo}
              className="px-5 py-2.5 rounded-full bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-md inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>Load Demo Video</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecordings.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectRecording(item)}
              className="group bg-[#0F0F12] border border-white/10 hover:border-[#00FF9D]/50 rounded-2xl overflow-hidden shadow-xl transition-all cursor-pointer flex flex-col"
            >
              {/* Card Media Preview Header */}
              <div className="aspect-video bg-[#0A0A0C] relative flex items-center justify-center overflow-hidden border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-[#00FF9D] ml-0.5" />
                </div>

                <div className="absolute top-2 left-2 bg-[#0A0A0C]/90 px-2 py-0.5 rounded border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/70">
                  {item.resolution}
                </div>

                <div className="absolute bottom-2 right-2 bg-[#0A0A0C]/90 px-2 py-0.5 rounded border border-white/10 text-[10px] font-mono font-bold text-[#00FF9D]">
                  {Math.floor(item.duration / 60)}:
                  {String(Math.floor(item.duration % 60)).padStart(2, '0')}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="bg-[#16161A] border border-white/20 rounded px-2 py-1 text-xs text-white flex-1 focus:outline-none focus:border-[#00FF9D]"
                      />
                      <button
                        onClick={(e) => handleSaveRename(item, e)}
                        className="p-1 rounded bg-[#00FF9D] text-black"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-xs line-clamp-1 group-hover:text-[#00FF9D] transition-colors">
                        {item.title}
                      </h3>
                      <button
                        onClick={(e) => handleStartRename(item, e)}
                        className="text-white/40 hover:text-white p-1"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1.5 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-white/40" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{(item.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#00FF9D] bg-[#00FF9D]/10 px-2 py-0.5 rounded border border-[#00FF9D]/30">
                    LOCAL VAULT
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDownloadFile(item, e)}
                      title="Download MP4 Video"
                      className="px-2.5 py-1 rounded-lg bg-[#00FF9D] hover:bg-[#00FF9D]/90 text-black font-extrabold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 fill-black" />
                      <span>MP4</span>
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete"
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
