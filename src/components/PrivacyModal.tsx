import React from 'react';
import { X, ShieldCheck, Lock, HardDrive, EyeOff, FileText } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="privacy-modal-backdrop" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div id="privacy-modal-card" className="bg-[#0F0F12] border border-white/10 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-[#E0E0E6]">
        <button
          id="close-privacy-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#00FF9D]/10 border border-[#00FF9D]/30 flex items-center justify-center text-[#00FF9D]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9D]">CONFIDENTIALITY SPECIFICATION</span>
            <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">Privacy & Security Architecture</h2>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed">
          <div className="p-4 rounded-xl bg-[#0A0A0C] border border-white/10 flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#00FF9D] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white mb-0.5 uppercase tracking-wider text-[11px]">Zero Data Collection Guarantee</h3>
              <p className="text-white/60">
                LocalLoom does not run any backend API, tracking pixel, or cloud telemetry. Neither your videos, audio streams, camera footage, nor metadata are sent to external servers.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0A0C] border border-white/10 flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-[#00A3FF] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white mb-0.5 uppercase tracking-wider text-[11px]">Browser-Native IndexedDB Storage</h3>
              <p className="text-white/60">
                All recordings are written straight to your web browser&apos;s isolated IndexedDB database using standard web media stream APIs and WebM/MP4 encoders.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0A0C] border border-white/10 flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white mb-0.5 uppercase tracking-wider text-[11px]">No Account or Password Required</h3>
              <p className="text-white/60">
                You never need to register, log in, or subscribe. Everything is ready immediately upon visiting the app or installing the Chrome Extension.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0A0C] border border-white/10 flex items-start gap-3">
            <FileText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white mb-0.5 uppercase tracking-wider text-[11px]">Manifest V3 Chrome Extension Security</h3>
              <p className="text-white/60">
                The Chrome extension strictly uses MV3 offscreen documents for local audio mixing and requires only essential recording permissions.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            id="acknowledge-privacy-btn"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-widest transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
