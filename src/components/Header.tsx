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
    <header id="app-header" className="sticky top-0 z-40 bg-[#0F0F12]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 py-2.5 transition-all overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          id="brand-logo"
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#00FF9D] to-[#00A3FF] rounded-lg flex items-center justify-center p-0.5 shadow-md shadow-[#00FF9D]/10 group-hover:scale-105 transition-transform">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-black rounded-sm bg-black/20 flex items-center justify-center">
              <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-black rounded-full" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">LocalLoom</span>
              <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.5 rounded-full border border-[#00FF9D]/30 bg-[#00FF9D]/10 text-[#00FF9D] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                100% LOCAL
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav id="nav-tabs" className="hidden md:flex items-center gap-1 bg-[#16161A] p-1 rounded-full border border-white/10 text-xs font-semibold text-white/60">
          <button
            id="tab-landing-btn"
            onClick={() => setActiveTab('landing')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 relative ${
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
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
        <div id="header-actions" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            id="btn-quick-record"
            onClick={onQuickRecord}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#00FF9D] text-black rounded-full font-extrabold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-[#00FF9D]/90 transition-all shadow-md shadow-[#00FF9D]/20 flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black animate-pulse" />
            <span>Start Recording</span>
          </button>

          <button
            id="btn-download-extension-zip"
            onClick={() => downloadExtensionZip()}
            title="Download Chrome Extension .ZIP"
            className="p-2 sm:px-3.5 sm:py-2 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#00FF9D] transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px] sm:text-xs">Add to Chrome</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center justify-around mt-2 pt-2 border-t border-white/10 text-[10px] font-bold">
        <button
          onClick={() => setActiveTab('landing')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg ${activeTab === 'landing' ? 'text-[#00FF9D] bg-white/10' : 'text-white/60'}`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('recorder')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg ${activeTab === 'recorder' ? 'text-[#00FF9D] bg-white/10' : 'text-white/60'}`}
        >
          <Monitor className="w-3 h-3" />
          <span>Studio</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg ${activeTab === 'library' ? 'text-[#00FF9D] bg-white/10' : 'text-white/60'}`}
        >
          <LayoutDashboard className="w-3 h-3" />
          <span>Vault ({recordingsCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('extension')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg ${activeTab === 'extension' ? 'text-[#00FF9D] bg-white/10' : 'text-white/60'}`}
        >
          <Code2 className="w-3 h-3" />
          <span>Extension</span>
        </button>
      </div>
    </header>
  );
};

