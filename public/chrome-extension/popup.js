document.getElementById('btnViewport').addEventListener('click', () => {
  showStatus('Capturing visible area...');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'CAPTURE_VIEWPORT' }, (res) => {
      window.close();
    });
  });
});

document.getElementById('btnAreaSelect').addEventListener('click', () => {
  showStatus('Drag mouse on page to select crop...');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'START_AREA_SELECT' }, (res) => {
      window.close();
    });
  });
});

document.getElementById('btnFullPage').addEventListener('click', () => {
  showStatus('Scrolling & stitching full tall page...');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'CAPTURE_FULL_PAGE' }, (res) => {
      // Keep popup open briefly then close
      setTimeout(() => window.close(), 1500);
    });
  });
});

function showStatus(msg) {
  const el = document.getElementById('statusMsg');
  if (el) {
    el.innerText = msg;
    el.style.display = 'block';
  }
}
