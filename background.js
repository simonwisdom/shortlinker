const summaries = {};

chrome.action.onClicked.addListener((tab) => {
  generateSummaryForTab(tab.id);
});

function generateSummaryForTab(tabId) {
  chrome.action.setBadgeText({text: "...", tabId: tabId});
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['summarizer.js']
  }, () => {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => window.generateSummary()
    }, (results) => {
      if (results && results[0] && results[0].result) {
        const summary = results[0].result;
        summaries[tabId] = { summary, timestamp: Date.now() };
        chrome.runtime.sendMessage({action: "summaryReady", tabId: tabId, summary: summary});
      }
      chrome.action.setBadgeText({text: "", tabId: tabId});
    });
  });
}

chrome.tabs.onRemoved.addListener((tabId) => {
  delete summaries[tabId];
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateNewSummary") {
    generateSummaryForTab(request.tabId);
  }
  if (request.action === "getSummary") {
    const tabSummary = summaries[request.tabId];
    if (tabSummary) {
      sendResponse(tabSummary);
    } else {
      generateSummaryForTab(request.tabId);
      sendResponse({summary: null, timestamp: null});
    }
  }
  return true;
});
