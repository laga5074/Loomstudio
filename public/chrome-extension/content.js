// Chrome Extension Content Script for Web Screenshot & Mouse Selection Crop

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_VIEWPORT') {
    captureViewport();
    sendResponse({ status: 'ok' });
  } else if (request.action === 'START_AREA_SELECT') {
    enableMouseAreaSelector();
    sendResponse({ status: 'ok' });
  } else if (request.action === 'CAPTURE_FULL_PAGE') {
    captureTallFullPage();
    sendResponse({ status: 'ok' });
  }
  return true;
});

// Mode 1: Capture Viewport
async function captureViewport() {
  chrome.runtime.sendMessage({ action: 'TAKE_VISIBLE_TAB' }, (dataUrl) => {
    if (dataUrl) {
      downloadDataUrl(dataUrl, `screenshot-viewport-${Date.now()}.png`);
    }
  });
}

// Mode 2: Interactive Mouse Selection Crop Overlay
function enableMouseAreaSelector() {
  if (document.getElementById('scr-crop-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'scr-crop-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483647;
    background: rgba(0, 0, 0, 0.3);
    cursor: crosshair;
    user-select: none;
  `;

  const selectionBox = document.createElement('div');
  selectionBox.style.cssText = `
    position: absolute;
    border: 2px dashed #00FF9D;
    background: rgba(0, 255, 157, 0.15);
    display: none;
    pointer-events: none;
  `;
  overlay.appendChild(selectionBox);

  const banner = document.createElement('div');
  banner.style.cssText = `
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #0A0A0C;
    border: 1px solid #00FF9D;
    color: #FFF;
    padding: 8px 16px;
    border-radius: 20px;
    font-family: sans-serif;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    pointer-events: none;
  `;
  banner.innerText = '✂️ Drag mouse to select area for screenshot (ESC to cancel)';
  overlay.appendChild(banner);

  document.body.appendChild(overlay);

  let startX = 0, startY = 0, isDragging = false;

  const onMouseDown = (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
  };

  const onMouseUp = async (e) => {
    if (!isDragging) return;
    isDragging = false;

    const rect = selectionBox.getBoundingClientRect();
    document.body.removeChild(overlay);

    if (rect.width < 10 || rect.height < 10) return;

    // Capture tab viewport and crop canvas to selected rect
    chrome.runtime.sendMessage({ action: 'TAKE_VISIBLE_TAB' }, (dataUrl) => {
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = rect.width * dpr;
        cropCanvas.height = rect.height * dpr;

        const ctx = cropCanvas.getContext('2d');
        ctx.drawImage(
          img,
          rect.left * dpr,
          rect.top * dpr,
          rect.width * dpr,
          rect.height * dpr,
          0,
          0,
          rect.width * dpr,
          rect.height * dpr
        );

        downloadDataUrl(cropCanvas.toDataURL('image/png'), `screenshot-crop-${Date.now()}.png`);
      };
      img.src = dataUrl;
    });
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      window.removeEventListener('keydown', onKeyDown);
    }
  };

  overlay.addEventListener('mousedown', onMouseDown);
  overlay.addEventListener('mousemove', onMouseMove);
  overlay.addEventListener('mouseup', onMouseUp);
  window.addEventListener('keydown', onKeyDown);
}

// Mode 3: Capture Tall Full Page Screenshot by scrolling & stitching
async function captureTallFullPage() {
  const originalScrollTop = window.scrollY;
  const viewportHeight = window.innerHeight;
  const totalHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight
  );
  const totalWidth = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth * dpr;
  canvas.height = totalHeight * dpr;
  const ctx = canvas.getContext('2d');

  let currentY = 0;

  while (currentY < totalHeight) {
    window.scrollTo(0, currentY);
    await new Promise((r) => setTimeout(r, 200)); // wait for renders/scroll

    const dataUrl = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'TAKE_VISIBLE_TAB' }, resolve);
    });

    if (dataUrl) {
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, img.width, img.height, 0, currentY * dpr, img.width, img.height);
          resolve(true);
        };
        img.src = dataUrl;
      });
    }

    currentY += viewportHeight;
  }

  // Restore scroll
  window.scrollTo(0, originalScrollTop);

  downloadDataUrl(canvas.toDataURL('image/png'), `screenshot-fullpage-${Date.now()}.png`);
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
