function generateSummary() {
    // This function should be defined globally
    return window.generateSummary();
  }

  window.generateSummary = async function() {
    console.log('generateSummary function called');
    
    try {
      const apiKey = await chrome.storage.local.get('apiKey');
      if (!apiKey.apiKey) {
        console.error('API key not found');
        return 'Please set your OpenAI API Key by clicking the settings cog.';
      }
  
      const pageUrl = removeAllParams(window.location.href);
      const pageMetadata = extractMetadata();
      const pageContent = document.body.innerText.substring(0, 1500); // Reduced to accommodate metadata
      console.log('Page URL:', pageUrl);
      console.log('Page metadata:', pageMetadata);
      console.log('Page content length:', pageContent.length);
  
      const contentToSummarize = `
        Metadata:
        ${pageMetadata}
  
        Page Content:
        ${pageContent}
      `;
  
      console.log('Calling getSummary function');
      const summary = await getSummary(contentToSummarize, apiKey.apiKey);
      console.log('Summary received:', summary);
      return `${summary} [Read more](${pageUrl})`;
    } catch (error) {
      console.error('Error in generateSummary:', error);
      return 'Failed to generate summary: ' + error.message;
    }
  }
  
  function extractMetadata() {
    const metadata = {
      title: document.title || '',
      description: '',
      keywords: '',
      ogTitle: '',
      ogDescription: ''
    };
  
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) metadata.description = descriptionTag.content;
  
    const keywordsTag = document.querySelector('meta[name="keywords"]');
    if (keywordsTag) metadata.keywords = keywordsTag.content;
  
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) metadata.ogTitle = ogTitleTag.content;
  
    const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionTag) metadata.ogDescription = ogDescriptionTag.content;
  
    return Object.entries(metadata)
      .filter(([key, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }
  
  function removeAllParams(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.origin + parsedUrl.pathname;
    } catch (error) {
      console.error('Error processing URL:', error);
      return url;
    }
  }
  
  async function getSummary(text, apiKey) {
    console.log('Sending request to OpenAI API');
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo-0125",
          messages: [
            {
              role: "system",
              content: "You are a concise summarizer. Provide extremely brief, informative summaries without redundant phrases. Maximum one sentence. Focus on the core information, incorporating relevant metadata when available."
            },
            {
              role: "user",
              content: `Summarize this content in one very short sentence, focusing on the most important information. Use the metadata to enhance the summary if relevant: ${text}`
            }
          ]
        })
      });
  
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('OpenAI API Response:', data);
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error in getSummary:', error);
      throw error;
    }
  }
  
  console.log('Summarizer script loaded and ready');