import React, { useState } from 'react';
import {
  ShieldCheck,
  Video,
  Download,
  Lock,
  HardDrive,
  Sparkles,
  Check,
  X,
  Play,
  Monitor,
  Camera,
  Mic,
  MessageSquare,
  Smile,
  Zap,
  Sliders,
  ChevronDown,
  ArrowRight,
  Code2,
  FileVideo,
  Layers,
  Cpu
} from 'lucide-react';
import { downloadExtensionZip } from '../lib/extensionGenerator';

interface LandingPageProps {
  onStartRecording: () => void;
  onOpenExtensionTab: () => void;
  onOpenPrivacyModal: () => void;
  onOpenLibraryTab: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartRecording,
  onOpenExtensionTab,
  onOpenPrivacyModal,
  onOpenLibraryTab,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [previewMode, setPreviewMode] = useState<'screen' | 'camera' | 'both'>('both');

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div id="landing-page-container" className="min-h-screen bg-[#0A0A0C] text-[#E0E0E6] flex flex-col space-y-16 pb-12">
      {/* HIGH DENSITY HERO SECTION */}
      <section id="hero-section" className="relative pt-10 lg:pt-16 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Editorial Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00FF9D]/30 bg-[#00FF9D]/10 text-[#00FF9D] text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00FF9D]" />
              <span>PRIVATE BY DESIGN — 100% LOCAL ARCHITECTURE</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-none">
              LOCAL-FIRST <br />
              <span className="text-[#00FF9D]">SCREEN RECORDER</span> <br />
              & EXTENSION.
            </h1>

            <p className="text-sm sm:text-base text-white/70 max-w-xl leading-relaxed font-normal">
              Capture display tabs, desktop screens, webcams, and system audio directly into browser IndexedDB storage. Zero server proxy. Zero telemetry.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-start-recording-btn"
                onClick={onStartRecording}
                className="px-6 py-3.5 bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-widest rounded-full hover:bg-[#00FF9D]/90 transition-all shadow-xl shadow-[#00FF9D]/20 flex items-center gap-2 active:scale-95"
              >
                <Video className="w-4 h-4 fill-black" />
                <span>Launch Studio Recorder</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-download-extension-btn"
                onClick={() => downloadExtensionZip()}
                className="px-6 py-3.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-full hover:bg-[#00FF9D] transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Get Chrome Extension</span>
              </button>
            </div>

            {/* High-Density Spec Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              <div className="p-3 bg-[#0F0F12] border border-white/10 rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D] mb-1">Storage Engine</div>
                <div className="text-xs font-bold text-white">IndexedDB Direct</div>
              </div>

              <div className="p-3 bg-[#0F0F12] border border-white/10 rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#00A3FF] mb-1">Resolution</div>
                <div className="text-xs font-bold text-white">4K 60FPS Hardware</div>
              </div>

              <div className="p-3 bg-[#0F0F12] border border-white/10 rounded-xl col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D] mb-1">Offscreen Engine</div>
                <div className="text-xs font-bold text-white">Manifest V3 Spec</div>
              </div>
            </div>
          </div>

          {/* Right Column: High Density Interactive Extension Mockup */}
          <div className="lg:col-span-5">
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-5 shadow-2xl relative space-y-4">
              {/* Mock Window Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono text-white/50 ml-2">LocalLoom MV3 Offscreen</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30">
                  ENCRYPTED
                </span>
              </div>

              {/* Source Mode Switcher */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Select Capture Source</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPreviewMode('screen')}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      previewMode === 'screen'
                        ? 'bg-[#00FF9D]/10 border-[#00FF9D] text-[#00FF9D]'
                        : 'bg-[#16161A] border-white/10 text-white/50'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Display</span>
                  </button>

                  <button
                    onClick={() => setPreviewMode('camera')}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      previewMode === 'camera'
                        ? 'bg-[#00FF9D]/10 border-[#00FF9D] text-[#00FF9D]'
                        : 'bg-[#16161A] border-white/10 text-white/50'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Cam</span>
                  </button>

                  <button
                    onClick={() => setPreviewMode('both')}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      previewMode === 'both'
                        ? 'bg-[#00FF9D]/10 border-[#00FF9D] text-[#00FF9D]'
                        : 'bg-[#16161A] border-white/10 text-white/50'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Both</span>
                  </button>
                </div>
              </div>

              {/* Virtual Stream Monitor Box */}
              <div className="relative aspect-video rounded-xl bg-[#0A0A0C] border border-white/10 overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#16161A] border border-white/10 text-[#00FF9D] flex items-center justify-center mb-3">
                  <Video className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-white">Hardware Encoding Standby</div>
                <div className="text-[10px] text-white/50 mt-1">1080p Full HD • 60 FPS • System Sound Mixed</div>

                {/* Simulated Audio Meter */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-[#00FF9D]" />
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden flex gap-0.5">
                    <div className="w-1/3 h-full bg-[#00FF9D]" />
                    <div className="w-1/4 h-full bg-[#00FF9D]" />
                    <div className="w-1/6 h-full bg-amber-400" />
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={onStartRecording}
                className="w-full py-3.5 rounded-full bg-[#00FF9D] text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-[#00FF9D]/90 transition-colors shadow-lg shadow-[#00FF9D]/20 flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Start Recording Now</span>
              </button>

              {/* Local Storage Indicator Badge */}
              <div className="p-3 rounded-xl bg-[#16161A] border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#00FF9D]" />
                  <span className="font-semibold text-white/80">Local IndexedDB Storage</span>
                </div>
                <span className="font-mono text-[10px] text-[#00FF9D] font-bold">100% PRIVATE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features-grid-section" className="max-w-7xl mx-auto px-4 lg:px-8 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D]">TECHNICAL SPECIFICATIONS</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">Built For Performance & Confidentiality</h2>
          </div>
          <button
            onClick={onOpenExtensionTab}
            className="text-xs font-bold text-[#00FF9D] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Extension Manifest Source</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 hover:border-[#00FF9D]/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF9D]/10 border border-[#00FF9D]/30 text-[#00FF9D] flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Multi-Source Screen & Cam</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Capture full screen, specific application window, or browser tab with floating customizable webcam PIP frames.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 hover:border-[#00FF9D]/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00A3FF]/10 border border-[#00A3FF]/30 text-[#00A3FF] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">4K 60FPS WebM VP9</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Hardware-accelerated encoding ensures ultra-smooth recording without frame drops or high CPU overhead.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 hover:border-[#00FF9D]/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF9D]/10 border border-[#00FF9D]/30 text-[#00FF9D] flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">IndexedDB Vault</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Videos are stored in high-capacity browser IndexedDB storage. Rename, trim, comment, or export anytime.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 hover:border-[#00FF9D]/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Timeline Notes & Annotations</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Add timestamped comments and emoji reactions to video playback. Jump to key moments with a single click.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 hover:border-[#00FF9D]/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-400/10 border border-rose-400/30 text-rose-400 flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Emoji Reaction Overlays</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Pin animated emoji reactions directly onto video timelines. Watch reactions float in real time during playback.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 hover:border-[#00FF9D]/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF9D]/10 border border-[#00FF9D]/30 text-[#00FF9D] flex items-center justify-center">
              <FileVideo className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Direct WebM & MP4 Download</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Download recordings straight to your file system or export full JSON metadata backups for local archival.
            </p>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE COMPARISON TABLE */}
      <section id="comparison-section" className="max-w-7xl mx-auto px-4 lg:px-8 w-full space-y-6">
        <div className="border-b border-white/10 pb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D]">ARCHITECTURAL DIFFERENCE</span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1">Traditional Cloud Recorders vs. LocalLoom</h2>
        </div>

        <div className="bg-[#0F0F12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#16161A] text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  <th className="py-4 px-6">Architectural Aspect</th>
                  <th className="py-4 px-6 text-white/40">Cloud SaaS Recorders</th>
                  <th className="py-4 px-6 bg-[#00FF9D]/10 text-[#00FF9D] font-black border-l border-r border-[#00FF9D]/30">
                    LocalLoom (Local-First)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Media Storage Pipeline</td>
                  <td className="py-4 px-6 text-white/50">External cloud servers</td>
                  <td className="py-4 px-6 bg-[#00FF9D]/5 text-[#00FF9D] font-bold border-l border-r border-[#00FF9D]/20">
                    Your Disk (Browser IndexedDB)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">User Registration & Tracking</td>
                  <td className="py-4 px-6 text-white/50">Mandatory email signup</td>
                  <td className="py-4 px-6 bg-[#00FF9D]/5 text-[#00FF9D] font-bold border-l border-r border-[#00FF9D]/20">
                    Zero Account / Anonymous
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Recording Time & Limits</td>
                  <td className="py-4 px-6 text-white/50">5 min cap on free tiers</td>
                  <td className="py-4 px-6 bg-[#00FF9D]/5 text-white font-bold border-l border-r border-[#00FF9D]/20">
                    Unlimited (Storage Quota Based)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">4K 60FPS Support</td>
                  <td className="py-4 px-6 text-white/50">Enterprise plan required</td>
                  <td className="py-4 px-6 bg-[#00FF9D]/5 text-[#00FF9D] font-bold border-l border-r border-[#00FF9D]/20">
                    Included Free Native Hardware
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq-section" className="max-w-4xl mx-auto px-4 lg:px-8 w-full space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D]">TRANSPARENCY</span>
          <h2 className="text-2xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Is any video chunk ever transmitted over the network?',
              a: 'No. LocalLoom operates purely client-side inside your browser engine. Zero media bytes are sent to any external API or proxy server.'
            },
            {
              q: 'How do I install the downloaded Chrome Extension?',
              a: 'Click "Add to Chrome" above to download the extension ZIP file, extract it, go to chrome://extensions/ in Google Chrome, enable "Developer mode", and click "Load unpacked".'
            },
            {
              q: 'Where are my recorded videos stored?',
              a: 'Videos are written directly into your browser\'s persistent IndexedDB storage engine. You can review, play back, or download them at any time.'
            }
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-[#0F0F12] overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left font-bold text-white text-xs flex items-center justify-between gap-4 hover:bg-white/5"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#00FF9D] transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {activeFaq === idx && (
                <div className="p-4 pt-0 text-xs text-white/60 border-t border-white/5 leading-relaxed bg-[#0A0A0C]">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* HIGH DENSITY MICRO-FOOTER STATS BAR */}
      <footer id="landing-footer" className="max-w-7xl mx-auto px-4 lg:px-8 w-full pt-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#00FF9D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D]" />
              Zero Data Sent To Servers
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              IndexedDB Direct Storage
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onOpenPrivacyModal} className="hover:text-white transition-colors">
              Privacy Architecture
            </button>
            <button onClick={onOpenExtensionTab} className="hover:text-white transition-colors">
              Extension Source
            </button>
            <button onClick={onOpenLibraryTab} className="hover:text-white transition-colors">
              Local Vault
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
