// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup opened');
  const state = await chrome.storage.local.get(['apiKey', 'useMarkdownFormat']);
  
  if (state.apiKey) {
    document.getElementById('apiKey').value = state.apiKey;
    console.log('API key loaded from storage');
  }
  
  if (state.useMarkdownFormat !== undefined) {
    document.getElementById('linkFormatToggle').checked = state.useMarkdownFormat;
  }

  displayLoadingState();
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.runtime.sendMessage({action: "getSummary", tabId: tab.id}, (response) => {
    if (response && response.summary) {
      displaySummary(response.summary);
    } else {
      document.getElementById('summaryResult').textContent = 'Generating summary...';
    }
  });

  // Listen for summary ready message
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summaryReady" && request.tabId === tab.id) {
      displaySummary(request.summary);
    }
  });

  // Settings toggle
  const settingsButton = document.getElementById('settingsButton');
  const settingsSection = document.getElementById('settingsSection');
  settingsButton.addEventListener('click', () => {
    settingsSection.style.display = settingsSection.style.display === 'none' ? 'block' : 'none';
  });

  // API Key setting
  const apiKeyInput = document.getElementById('apiKey');
  apiKeyInput.addEventListener('change', async () => {
    const apiKey = apiKeyInput.value;
    await chrome.storage.local.set({ 'apiKey': apiKey });
    console.log('API Key set in storage');
    displayMessage('API Key set successfully!');
  });

  // Link format toggle
  const linkFormatToggle = document.getElementById('linkFormatToggle');
  linkFormatToggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ 'useMarkdownFormat': linkFormatToggle.checked });
    console.log('Link format preference saved');
  });

  // Retry button
  document.getElementById('retryButton').addEventListener('click', async () => {
    displayLoadingState();
    chrome.runtime.sendMessage({action: "generateNewSummary", tabId: tab.id});
  });

  // Copy button
  document.getElementById('copyButton').addEventListener('click', async () => {
    const summaryElement = document.getElementById('summaryResult');
    const readMoreLink = document.getElementById('readMoreLink');
    const useMarkdownFormat = await chrome.storage.local.get('useMarkdownFormat');
    
    let fullText = summaryElement.textContent.trim();
    if (useMarkdownFormat.useMarkdownFormat) {
      fullText += ` [Read more](${readMoreLink.href})`;
    } else {
      fullText += ` ${readMoreLink.href}`;
    }
    
    navigator.clipboard.writeText(fullText)
      .then(() => {
        console.log('Summary copied to clipboard');
        displayMessage('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        displayMessage('Failed to copy. Please try selecting and copying the text manually.');
      });
  });
});

function displayLoadingState() {
  const summaryElement = document.getElementById('summaryResult');
  const copyButton = document.getElementById('copyButton');
  const readMoreLink = document.getElementById('readMoreLink');
  
  summaryElement.textContent = 'Generating summary...';
  copyButton.style.display = 'none';
  readMoreLink.style.display = 'none';
}

function displaySummary(summary) {
  console.log('Displaying summary:', summary);
  const summaryElement = document.getElementById('summaryResult');
  const copyButton = document.getElementById('copyButton');
  const readMoreLink = document.getElementById('readMoreLink');
  
  // Split the summary and the URL
  const [summaryText, url] = summary.split('[Read more]');
  
  summaryElement.textContent = summaryText.trim();
  copyButton.style.display = 'block';
  
  if (url) {
    const cleanUrl = url.trim().replace('(', '').replace(')', '');
    readMoreLink.href = cleanUrl;
    readMoreLink.style.display = 'none'; // Hide the "Read more" link
    readMoreLink.textContent = ''; // Remove the "Read more" text
  } else {
    readMoreLink.style.display = 'none';
  }
}

function displayMessage(message) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = message;
  messageElement.style.display = 'block';
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}