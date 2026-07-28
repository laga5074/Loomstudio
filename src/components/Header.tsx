import React from 'react';
import { ShieldCheck, Video, Download, Code2, Sparkles, LayoutDashboard, Monitor, ExternalLink } from 'lucide-react';
import { downloadExtensionZip } from '../lib/extensionGenerator';

interface HeaderProps {
  activeTab: 'landing' | 'recorder' | 'library' | 'extension';
  setActiveTab: (tab: 'landing' | 'recorder' | 'library' | 'extension') => void;
  onQuickRecord: () => void;
  recordingsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onQuickRecord,
  recordingsCount,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-[#0F0F12]/95 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          id="brand-logo"
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-[#00FF9D] to-[#00A3FF] rounded-lg flex items-center justify-center p-0.5 shadow-md shadow-[#00FF9D]/10 group-hover:scale-105 transition-transform">
            <div className="w-4 h-4 border-2 border-black rounded-sm bg-black/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">LocalLoom</span>
              <span className="px-2 py-0.5 rounded-full border border-[#00FF9D]/30 bg-[#00FF9D]/10 text-[#00FF9D] text-[10px] font-bold uppercase tracking-wider">
                100% LOCAL
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav id="nav-tabs" className="hidden md:flex items-center gap-1 bg-[#16161A] p-1 rounded-full border border-white/10 text-xs font-semibold text-white/60">
          <button
            id="tab-landing-btn"
            onClick={() => setActiveTab('landing')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'landing'
                ? 'bg-white/10 text-[#00FF9D] border border-[#00FF9D]/30'
                : 'hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            id="tab-recorder-btn"
            onClick={() => setActiveTab('recorder')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'recorder'
                ? 'bg-white/10 text-[#00FF9D] border border-[#00FF9D]/30'
                : 'hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Studio Recorder</span>
          </button>

          <button
            id="tab-library-btn"
            onClick={() => setActiveTab('library')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'library'
                ? 'bg-white/10 text-[#00FF9D] border border-[#00FF9D]/30'
                : 'hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Local Vault</span>
            {recordingsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] bg-[#00FF9D] text-black font-black rounded-full ml-1">
                {recordingsCount}
              </span>
            )}
          </button>

          <button
            id="tab-extension-btn"
            onClick={() => setActiveTab('extension')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'extension'
                ? 'bg-white/10 text-[#00FF9D] border border-[#00FF9D]/30'
                : 'hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Chrome Package</span>
          </button>
        </nav>

        {/* Action CTAs */}
        <div id="header-actions" className="flex items-center gap-2.5">
          <button
            id="btn-quick-record"
            onClick={onQuickRecord}
            className="px-4 py-2 bg-[#00FF9D] text-black rounded-full font-extrabold text-xs uppercase tracking-widest hover:bg-[#00FF9D]/90 transition-all shadow-lg shadow-[#00FF9D]/20 flex items-center gap-2 active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span>Start Recording</span>
          </button>

          <button
            id="btn-download-extension-zip"
            onClick={() => downloadExtensionZip()}
            title="Download Chrome Extension .ZIP"
            className="px-4 py-2 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#00FF9D] transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add to Chrome</span>
          </button>
        </div>
      </div>
    </header>
  );
};

