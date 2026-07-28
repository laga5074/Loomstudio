import React, { useState } from 'react';
import {
  Code2,
  Download,
  Copy,
  Check,
  FileCode,
  Folder,
  Layers,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Settings,
  Sliders,
  FileVideo
} from 'lucide-react';
import { EXTENSION_FILES } from '../data/extensionCode';
import { downloadExtensionZip } from '../lib/extensionGenerator';

export const ExtensionStudio: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState(EXTENSION_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'simulator' | 'install'>('code');

  // Simulator State
  const [simMode, setSimMode] = useState<'screen' | 'camera' | 'both'>('screen');
  const [simQuality, setSimQuality] = useState('1080p');
  const [simMic, setSimMic] = useState(true);
  const [simAudio, setSimAudio] = useState(true);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="extension-studio-container" className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6 bg-[#0A0A0C] text-[#E0E0E6]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D]">CHROME EXTENSION BUNDLE</span>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Code2 className="w-5 h-5 text-[#00FF9D]" />
            <span>Manifest V3 Extension Package</span>
          </h1>
        </div>

        <button
          onClick={() => downloadExtensionZip()}
          className="px-5 py-2.5 rounded-full bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-[#00FF9D]/20 flex items-center gap-2 hover:bg-[#00FF9D]/90 transition-all shrink-0"
        >
          <Download className="w-4 h-4 fill-black" />
          <span>Download Extension .ZIP</span>
        </button>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveSubTab('code')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeSubTab === 'code'
              ? 'bg-[#16161A] text-[#00FF9D] border border-[#00FF9D]/30'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Source Code Explorer</span>
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeSubTab === 'simulator'
              ? 'bg-[#16161A] text-[#00FF9D] border border-[#00FF9D]/30'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Popup Simulator</span>
        </button>

        <button
          onClick={() => setActiveSubTab('install')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeSubTab === 'install'
              ? 'bg-[#16161A] text-[#00FF9D] border border-[#00FF9D]/30'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Install Guide</span>
        </button>
      </div>

      {/* TAB 1: CODE EXPLORER */}
      {activeSubTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Tree Sidebar */}
          <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D] flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#00FF9D]" />
              <span>Manifest Files ({EXTENSION_FILES.length})</span>
            </h3>

            <div className="space-y-1">
              {EXTENSION_FILES.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                    selectedFile.path === file.path
                      ? 'bg-[#00FF9D]/10 text-[#00FF9D] font-bold border border-[#00FF9D]/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{file.path}</span>
                  <span className="text-[9px] text-white/40 uppercase font-mono font-bold ml-1">
                    {file.language}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Code Viewer */}
          <div className="lg:col-span-3 bg-[#0F0F12] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
            <div className="bg-[#0A0A0C] px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs text-[#00FF9D]">
                <FileCode className="w-4 h-4 text-white/40" />
                <span>{selectedFile.path}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1 rounded-full bg-[#16161A] hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#00FF9D]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 bg-[#0A0A0C] font-mono text-xs text-white/80 overflow-auto whitespace-pre leading-relaxed select-text">
              {selectedFile.content}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POPUP SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="font-extrabold text-white text-base uppercase tracking-wider">Chrome Toolbar Popup Mockup</h3>
            <p className="text-xs text-white/50">
              Simulates MV3 popup interface with hardware-accelerated offscreen recording options.
            </p>
          </div>

          {/* Chrome Extension Mockup Window */}
          <div className="w-[340px] mx-auto rounded-2xl bg-[#0F0F12] border border-white/10 p-4 shadow-2xl space-y-4">
            <header className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎥</span>
                <span className="font-extrabold text-white text-sm">LocalLoom MV3</span>
              </div>
              <span className="text-[9px] font-bold bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30 px-2 py-0.5 rounded uppercase tracking-wider">
                100% LOCAL
              </span>
            </header>

            <div className="flex gap-1 bg-[#0A0A0C] p-1 rounded-xl border border-white/10">
              {(['screen', 'camera', 'both'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSimMode(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    simMode === m ? 'bg-[#00FF9D] text-black' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {m === 'both' ? 'Both' : m}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 bg-[#0A0A0C] p-3 rounded-xl border border-white/10 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-white/80">🎙️ Microphone</span>
                <input
                  type="checkbox"
                  checked={simMic}
                  onChange={(e) => setSimMic(e.target.checked)}
                  className="accent-[#00FF9D]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/80">🔊 System Audio</span>
                <input
                  type="checkbox"
                  checked={simAudio}
                  onChange={(e) => setSimAudio(e.target.checked)}
                  className="accent-[#00FF9D]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/80">📐 Quality</span>
                <select
                  value={simQuality}
                  onChange={(e) => setSimQuality(e.target.value)}
                  className="bg-[#16161A] border border-white/10 text-white rounded px-2 py-1 text-[11px] font-bold focus:outline-none focus:border-[#00FF9D]"
                >
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="1440p">1440p 2K</option>
                  <option value="4K">4K Ultra HD</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => alert('Simulator: Chrome Extension MediaRecorder initiated!')}
              className="w-full py-3 rounded-full bg-[#00FF9D] text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-[#00FF9D]/20 flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
              <span>Start Extension Stream</span>
            </button>

            <footer className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-bold uppercase tracking-wider text-white/50">
              <button onClick={() => alert('Opens library.html tab')} className="hover:text-[#00FF9D]">
                📁 Local Vault
              </button>
              <button onClick={() => alert('Opens options.html tab')} className="hover:text-[#00FF9D]">
                ⚙️ Config
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* TAB 3: INSTALLATION GUIDE */}
      {activeSubTab === 'install' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <h3 className="font-extrabold text-white text-base uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#00FF9D]" />
              <span>How to Load Unpacked in Google Chrome</span>
            </h3>

            <ol className="space-y-3 text-xs text-white/80 leading-relaxed list-decimal list-inside">
              <li className="p-3 rounded-xl bg-[#0A0A0C] border border-white/10">
                Click <strong className="text-[#00FF9D]">Download Extension .ZIP</strong> above and save the zip file to your computer.
              </li>
              <li className="p-3 rounded-xl bg-[#0A0A0C] border border-white/10">
                Extract <code className="text-[#00FF9D] font-mono">localloom-chrome-extension.zip</code> to a local folder.
              </li>
              <li className="p-3 rounded-xl bg-[#0A0A0C] border border-white/10">
                Open Google Chrome and navigate to <code className="text-[#00FF9D] font-mono">chrome://extensions/</code> in the address bar.
              </li>
              <li className="p-3 rounded-xl bg-[#0A0A0C] border border-white/10">
                Toggle on <strong className="text-[#00FF9D]">Developer mode</strong> in the upper right corner.
              </li>
              <li className="p-3 rounded-xl bg-[#0A0A0C] border border-white/10">
                Click <strong className="text-[#00FF9D]">Load unpacked</strong> and select the extracted folder.
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
