import React, { useState, useRef, useEffect } from 'react';
import { Camera, Crop, FileText, Download, X, Check, Monitor, Layers, ExternalLink } from 'lucide-react';

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVideoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  isOpen,
  onClose,
  activeVideoRef,
  canvasRef,
}) => {
  const [activeTab, setActiveTab] = useState<'app' | 'crop' | 'extension'>('app');
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  // Mode 1: Quick Capture current app canvas or preview video
  const handleQuickCapture = () => {
    let dataUrl = '';
    if (canvasRef.current && canvasRef.current.width > 0) {
      dataUrl = canvasRef.current.toDataURL('image/png');
    } else if (activeVideoRef.current && activeVideoRef.current.readyState >= 2) {
      const vid = activeVideoRef.current;
      const c = document.createElement('canvas');
      c.width = vid.videoWidth || 1280;
      c.height = vid.videoHeight || 720;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(vid, 0, 0, c.width, c.height);
        dataUrl = c.toDataURL('image/png');
      }
    }

    if (dataUrl) {
      setCapturedImage(dataUrl);
    } else {
      alert('No active video or canvas frame to capture.');
    }
  };

  // Mode 2: Mouse Selection Crop
  const handleStartCropSelection = () => {
    setIsCropping(true);
    setCropRect(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const bounds = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    startPosRef.current = { x, y };
    isDraggingRef.current = true;
    setCropRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !startPosRef.current || !overlayRef.current) return;
    const bounds = overlayRef.current.getBoundingClientRect();
    const currentX = e.clientX - bounds.left;
    const currentY = e.clientY - bounds.top;

    const x = Math.min(startPosRef.current.x, currentX);
    const y = Math.min(startPosRef.current.y, currentY);
    const w = Math.abs(currentX - startPosRef.current.x);
    const h = Math.abs(currentY - startPosRef.current.y);

    setCropRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleApplyCrop = () => {
    if (!cropRect || cropRect.w < 10 || cropRect.h < 10 || !overlayRef.current) return;

    let baseCanvas: HTMLCanvasElement | null = canvasRef.current;
    if (!baseCanvas || baseCanvas.width === 0) {
      if (activeVideoRef.current && activeVideoRef.current.readyState >= 2) {
        const vid = activeVideoRef.current;
        baseCanvas = document.createElement('canvas');
        baseCanvas.width = vid.videoWidth || 1280;
        baseCanvas.height = vid.videoHeight || 720;
        const ctx = baseCanvas.getContext('2d');
        if (ctx) ctx.drawImage(vid, 0, 0, baseCanvas.width, baseCanvas.height);
      }
    }

    if (!baseCanvas) return;

    const bounds = overlayRef.current.getBoundingClientRect();
    const scaleX = baseCanvas.width / bounds.width;
    const scaleY = baseCanvas.height / bounds.height;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropRect.w * scaleX;
    cropCanvas.height = cropRect.h * scaleY;
    const cropCtx = cropCanvas.getContext('2d');

    if (cropCtx) {
      cropCtx.drawImage(
        baseCanvas,
        cropRect.x * scaleX,
        cropRect.y * scaleY,
        cropRect.w * scaleX,
        cropRect.h * scaleY,
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      );
      setCapturedImage(cropCanvas.toDataURL('image/png'));
    }

    setIsCropping(false);
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `screenshot-${Date.now()}.png`;
    a.click();
  };

  const handleCopy = async () => {
    if (!capturedImage) return;
    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  };

  // Extension Files Exporter
  const handleDownloadExtensionFiles = () => {
    const files = [
      { name: 'manifest.json', path: '/chrome-extension/manifest.json' },
      { name: 'popup.html', path: '/chrome-extension/popup.html' },
      { name: 'popup.js', path: '/chrome-extension/popup.js' },
      { name: 'content.js', path: '/chrome-extension/content.js' },
      { name: 'background.js', path: '/chrome-extension/background.js' },
      { name: 'README.md', path: '/chrome-extension/README.md' }
    ];

    files.forEach((f) => {
      const a = document.createElement('a');
      a.href = f.path;
      a.download = f.name;
      a.target = '_blank';
      a.click();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-[#0E0E12] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121218]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00FF9D]/10 border border-[#00FF9D]/30 flex items-center justify-center text-[#00FF9D]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Screenshot & Browser Extension Tool</h2>
              <p className="text-xs text-white/50">Capture full screen, mouse-cropped selections, or tall webpages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 bg-[#0A0A0C] px-6 pt-3 gap-2">
          <button
            onClick={() => { setActiveTab('app'); setIsCropping(false); }}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-t-xl border-t border-x transition-colors ${
              activeTab === 'app'
                ? 'bg-[#121218] border-white/20 text-[#00FF9D]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            📸 Quick App Screenshot
          </button>
          <button
            onClick={() => { setActiveTab('crop'); handleStartCropSelection(); }}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-t-xl border-t border-x transition-colors ${
              activeTab === 'crop'
                ? 'bg-[#121218] border-white/20 text-[#00FF9D]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            ✂️ Mouse Selection Crop
          </button>
          <button
            onClick={() => { setActiveTab('extension'); setIsCropping(false); }}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-t-xl border-t border-x transition-colors ${
              activeTab === 'extension'
                ? 'bg-[#121218] border-white/20 text-[#00FF9D]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            🧩 Chrome Extension (Browser Tabs)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'app' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/70">
                  Instantly capture the current frame of your video recording / reaction preview.
                </p>
                <button
                  onClick={handleQuickCapture}
                  className="px-4 py-2 bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-[#00FF9D]/90 transition-colors flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Screenshot</span>
                </button>
              </div>

              {capturedImage && (
                <div className="space-y-3 pt-2">
                  <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black/50 flex justify-center max-h-[300px]">
                    <img src={capturedImage} alt="Captured Screenshot" className="max-h-[300px] object-contain" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCopy}
                      className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-[#00FF9D]" /> : <Layers className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-[#00FF9D]/90 flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PNG</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'crop' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/70">
                  Drag your mouse over the preview area to select a custom cropped region.
                </p>
                <button
                  onClick={handleStartCropSelection}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold rounded-lg"
                >
                  Reset Selection
                </button>
              </div>

              {/* Crop Selection Overlay Canvas */}
              <div
                ref={overlayRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="relative w-full h-[280px] bg-black/60 rounded-xl border border-white/20 overflow-hidden cursor-crosshair flex items-center justify-center select-none"
              >
                {/* Background image preview if available */}
                {canvasRef.current && (
                  <img
                    src={canvasRef.current.toDataURL('image/png')}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50"
                  />
                )}

                {!cropRect && (
                  <div className="text-center text-xs text-white/60 pointer-events-none">
                    <Crop className="w-8 h-8 text-[#00FF9D] mx-auto mb-2 opacity-80" />
                    <span>Click and drag mouse here to select crop box</span>
                  </div>
                )}

                {cropRect && (
                  <div
                    className="absolute border-2 border-[#00FF9D] bg-[#00FF9D]/20 pointer-events-none"
                    style={{
                      left: `${cropRect.x}px`,
                      top: `${cropRect.y}px`,
                      width: `${cropRect.w}px`,
                      height: `${cropRect.h}px`,
                    }}
                  >
                    <span className="absolute -top-5 left-0 text-[10px] bg-[#00FF9D] text-black font-bold px-1.5 rounded">
                      {Math.round(cropRect.w)} × {Math.round(cropRect.h)}
                    </span>
                  </div>
                )}
              </div>

              {cropRect && cropRect.w > 10 && (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleApplyCrop}
                    className="px-4 py-2 bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-[#00FF9D]/90 flex items-center gap-1.5"
                  >
                    <Crop className="w-4 h-4" />
                    <span>Crop & Save Image</span>
                  </button>
                </div>
              )}

              {capturedImage && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-xs font-bold text-[#00FF9D]">Cropped Result:</span>
                  <div className="rounded-xl overflow-hidden border border-white/15 bg-black/50 flex justify-center max-h-[180px]">
                    <img src={capturedImage} alt="Cropped" className="max-h-[180px] object-contain" />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-[#00FF9D]/90 flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Cropped Image</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'extension' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#16161C] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-[#00FF9D]">
                  <ExternalLink className="w-4 h-4" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">Browser Extension for Any Tab</h3>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Use our Manifest V3 Chrome Extension to capture screenshots while browsing <strong>any website tab</strong>!
                  Supports full viewport, mouse drag cropping, and tall full-page auto-scrolling screenshots!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-center">
                    <span className="text-lg">🖥️</span>
                    <h4 className="text-[11px] font-bold text-white mt-1">Viewport</h4>
                    <p className="text-[10px] text-white/50">1-click tab screen snap</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-center">
                    <span className="text-lg">✂️</span>
                    <h4 className="text-[11px] font-bold text-white mt-1">Mouse Crop</h4>
                    <p className="text-[10px] text-white/50">Drag rectangle on webpage</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-center">
                    <span className="text-lg">📜</span>
                    <h4 className="text-[11px] font-bold text-white mt-1">Tall Full Page</h4>
                    <p className="text-[10px] text-white/50">Auto scrolls full page</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-2 text-xs text-white/80">
                  <span className="font-extrabold text-[#00FF9D] uppercase text-[10px]">How to install extension in Chrome:</span>
                  <ol className="list-decimal list-inside space-y-1 text-white/60 text-[11px]">
                    <li>Click <strong>Download Chrome Extension Package</strong> below.</li>
                    <li>Open Chrome and navigate to <code className="text-[#00FF9D]">chrome://extensions</code></li>
                    <li>Enable <strong>Developer mode</strong> (top right toggle).</li>
                    <li>Click <strong>Load unpacked</strong> and select the downloaded <code className="text-[#00FF9D]">chrome-extension</code> folder!</li>
                  </ol>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleDownloadExtensionFiles}
                    className="px-4 py-2.5 bg-[#00FF9D] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-[#00FF9D]/90 flex items-center gap-2 shadow-lg shadow-[#00FF9D]/10"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Chrome Extension Files</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
