// modules/aiMode.js
export class AIMode {
  constructor() {
    this.inAIMode = false;
    this.apiKey = 'AIzaSyDgfiTMtc968x5N2t5ukc5femkxAq2LtfY';
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    this.currentResponse = null;
    this.isLoading = false;
  }

  isInAIMode() {
    return this.inAIMode;
  }

  enterAIMode() {
    console.log("Entering AI mode");
    this.inAIMode = true;
    return this.showAIModeInterface();
  }

  exitAIMode() {
    console.log("Exiting AI mode");
    this.inAIMode = false;
    this.currentResponse = null;
    this.isLoading = false;
  }

  showAIModeInterface() {
    return [
      {
        type: "ai-header",
        id: "ai-mode-header",
        title: "🤖 AI Assistant Mode",
        subtitle: "Ask me anything! Type your question and press Enter",
        data: { mode: "ai" },
        score: -100,
      }
    ];
  }

  async searchAI(query) {
    if (!query.trim()) {
      return this.showAIModeInterface();
    }

    if (this.isLoading) {
      return [
        {
          type: "ai-loading",
          id: "ai-loading",
          title: "🤖 AI is thinking...",
          subtitle: "Please wait while I process your request",
          data: { query },
          score: -100,
        }
      ];
    }

    // If we have a cached response for this query, show it
    if (this.currentResponse && this.currentResponse.query === query) {
      return this.formatAIResponse(this.currentResponse.response, query);
    }

    // Start loading
    this.isLoading = true;
    
    try {
      const response = await this.callGeminiAPI(query);
      this.currentResponse = { query, response };
      this.isLoading = false;
      return this.formatAIResponse(response, query);
    } catch (error) {
      console.error('AI API Error:', error);
      this.isLoading = false;
      return [
        {
          type: "ai-error",
          id: "ai-error",
          title: "❌ AI Error",
          subtitle: `Sorry, I encountered an error: ${error.message}`,
          data: { error: error.message, query },
          score: -100,
        }
      ];
    }
  }

  async callGeminiAPI(query) {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: query
            }
          ]
        }
      ]
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': this.apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from AI API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  formatAIResponse(response, query) {
    // Split response into chunks for better display
    const chunks = this.splitResponseIntoChunks(response, 150);
    
    const results = [
      {
        type: "ai-query",
        id: "ai-query",
        title: `❓ Your Question: ${query}`,
        subtitle: "Click to copy your question",
        data: { text: query, action: 'copy' },
        score: -100,
      }
    ];

    chunks.forEach((chunk, index) => {
      results.push({
        type: "ai-response",
        id: `ai-response-${index}`,
        title: index === 0 ? "🤖 AI Response:" : "↳ Continued:",
        subtitle: chunk,
        data: { text: chunk, fullResponse: response, action: 'copy' },
        score: -99 + index,
      });
    });

    // Add action buttons
    results.push({
      type: "ai-action",
      id: "ai-copy-full",
      title: "📋 Copy Full Response",
      subtitle: "Copy the complete AI response to clipboard",
      data: { text: response, action: 'copy-full' },
      score: 10,
    });

    results.push({
      type: "ai-action",  
      id: "ai-new-question",
      title: "❓ Ask Another Question",
      subtitle: "Clear and ask a new question",
      data: { action: 'new-question' },
      score: 11,
    });

    return results;
  }

  splitResponseIntoChunks(text, maxLength) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (let sentence of sentences) {
      sentence = sentence.trim();
      if (!sentence) continue;
      
      if (currentChunk.length + sentence.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
          currentChunk = sentence;
        } else {
          // Handle very long sentences by splitting at words
          const words = sentence.split(' ');
          let wordChunk = '';
          
          for (let word of words) {
            if (wordChunk.length + word.length + 1 <= maxLength) {
              wordChunk += (wordChunk ? ' ' : '') + word;
            } else {
              if (wordChunk) chunks.push(wordChunk);
              wordChunk = word;
            }
          }
          
          if (wordChunk) currentChunk = wordChunk;
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk + (currentChunk.endsWith('.') ? '' : '.'));
    }
    
    return chunks.length > 0 ? chunks : [text];
  }

  async selectAIItem(item) {
    const { action, text, fullResponse } = item.data;
    
    switch (action) {
      case 'copy':
        await navigator.clipboard.writeText(text);
        return { success: true, message: 'Text copied to clipboard!' };
        
      case 'copy-full':
        await navigator.clipboard.writeText(fullResponse || text);
        return { success: true, message: 'Full response copied to clipboard!' };
        
      case 'new-question':
        this.currentResponse = null;
        return { success: true, message: 'Ready for new question!', clearInput: true };
        
      default:
        await navigator.clipboard.writeText(text);
        return { success: true, message: 'Text copied to clipboard!' };
    }
  }
}

// Update the main CtrlSearch class to integrate AI mode
// Add this to the imports at the top of your main file:
// import { AIMode } from "./modules/aiMode.js";

// Add these modifications to your main CtrlSearch class:

/*
// In constructor, add:
this.aiMode = new AIMode();

// In handleSearch method, add after emoji mode check:
// Check if user wants to enter AI mode
if (query === "]" && !this.aiMode.isInAIMode()) {
  console.log("Entering AI mode");
  this.enterAIMode();
  return;
}

// If query starts with "]" and we're not in AI mode, enter AI mode with search
if (query.startsWith("]") && !this.aiMode.isInAIMode()) {
  console.log("Entering AI mode with search");
  this.enterAIMode();
  const aiQuery = query.substring(1);
  if (aiQuery.trim()) {
    const results = await this.aiMode.searchAI(aiQuery);
    this.displayResults(results);
  }
  return;
}

// In searchItems method, add after emoji mode check:
// If in AI mode, search AI
if (this.aiMode.isInAIMode()) {
  return await this.aiMode.searchAI(query);
}

// Add these new methods to CtrlSearch:
enterAIMode() {
  this.searchInput.placeholder = "Ask AI anything... (ESC to go back)";
  this.searchInput.value = "";
  const results = this.aiMode.enterAIMode();
  this.displayResults(results);
  this.focusSearch();
}

exitAIMode() {
  this.aiMode.exitAIMode();
  this.searchInput.placeholder = "Fuzzy search snippets, documents, bookmarks, and tools...";
  this.searchInput.value = "";
  this.showEmptyState();
  this.focusSearch();
}

// In selectResult method, add after emoji handling:
if (result.type.startsWith('ai-')) {
  const copyResult = await this.aiMode.selectAIItem(result);
  if (copyResult.success) {
    console.log(copyResult.message);
    if (copyResult.clearInput) {
      this.searchInput.value = "";
      const results = this.aiMode.showAIModeInterface();
      this.displayResults(results);
      this.focusSearch();
      return;
    }
  }
  return;
}

// In the Escape key handler, add after emoji mode check:
} else if (this.aiMode.isInAIMode()) {
  e.preventDefault();
  this.exitAIMode();

// Update showEmptyState to include AI mode hint:
// Add this line to the hints section:
<p>🤖 <strong>]</strong> = AI Assistant • Ask questions and get AI responses</p>
*/