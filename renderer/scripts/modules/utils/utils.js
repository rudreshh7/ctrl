export function showHelpDialog(container) {
  const helpText = `
    <div class="help-dialog">
      <h3>Ctrl - Help Center r</h3>
      <div class="help-section">
        <h4>Smart Shortcuts:</h4>
        <p><strong>s</strong> - Settings</p>
        <p><strong>e</strong> - Emoji Picker</p>
        <p><strong>sum</strong> - Calculator</p>
        <p><strong>h</strong> - Help</p>
        <p><strong>r</strong> - Reload Data</p>
        <p><strong>q</strong> - Quit</p>
      </div>
      <div class="help-section">
        <h4>Add Content:</h4>
        <p><strong>add-snippet</strong> - New Code Snippet</p>
        <p><strong>add-document</strong> - New Document Link</p>
        <p><strong>add-bookmark</strong> - New Website Bookmark</p>
      </div>
      <div class="help-section">
        <h4>Keyboard Shortcuts:</h4>
        <p><strong>↑/↓</strong> - Navigate results</p>
        <p><strong>Enter</strong> - Select result</p>
        <p><strong>Esc</strong> - Close/Back</p>
        <p><strong>Cmd/Ctrl + ,</strong> - Settings</p>
        <p><strong>Ctrl + /</strong> - Focus search bar</p>
      </div>
      <div class="help-section">
        <h4>Emoji Mode:</h4>
        <p><strong>:</strong> - Enter emoji mode</p>
        <p><strong>:search</strong> - Search emojis</p>
      </div>
      <div class="help-section">
        <h4>External Search:</h4>
        <p>🔍 <strong>Google Search</strong> - Available for any query</p>
        <p>🤖 <strong>ChatGPT Search</strong> - Available for any query</p>
      </div>
    </div>
  `;
  container.innerHTML = helpText;
}
