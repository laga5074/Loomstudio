// Chrome Extension Background Service Worker

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'TAKE_VISIBLE_TAB') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse(dataUrl);
    });
    return true; // Keep sendResponse channel open async
  }
});
