export async function showDogDialog(container) {
  // Show loading state
  container.innerHTML = `
    <div class="help-dialog">
      <h3>Random Dog 🐕</h3>
      <p>Fetching a good dog...</p>
    </div>
  `;

  try {
    // Fetch random dog image
    const response = await fetch('https://dog.ceo/api/breeds/image/random');
    
    if (!response.ok) {
      throw new Error('Dog data unavailable');
    }
    
    const data = await response.json();
    
    // Format dog display
    const weatherText = `
      <div class="help-dialog">
        <h3>Random Dog 🐕</h3>
        <div class="help-section">
          <h4>Good Dog Alert:</h4>
          <img src="${data.message}" alt="Random dog" style="max-width: 100%; max-height: 300px; border-radius: 8px; margin: 10px 0;">
          <p><strong>Status:</strong> Very good dog! 🐾</p>
        </div>
        <div class="help-section">
          <h4>Dog Facts:</h4>
          <p><strong>Breed:</strong> ${extractBreedFromUrl(data.message)}</p>
          <p><strong>Goodness Level:</strong> Maximum ⭐⭐⭐⭐⭐</p>
          <p><strong>Belly Rubs Needed:</strong> Yes, always</p>
        </div>
        <div class="help-section">
          <h4>Controls:</h4>
          <p><strong>Esc</strong> - Close dog dialog</p>
          <p><strong>r</strong> - Get another dog!</p>
        </div>
      </div>
    `;
    
    container.innerHTML = weatherText;
    
  } catch (error) {
    // Fallback to original help content on error
    const fallbackText = `
      <div class="help-dialog">
        <h3>No Dogs Available 😢</h3>
        <p>Unable to fetch dog data. Showing help instead.</p>
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
      </div>
    `;
    container.innerHTML = fallbackText;
  }
}

// Helper function to extract breed from dog image URL
function extractBreedFromUrl(url) {
  try {
    const parts = url.split('/');
    const breedsPart = parts.find((part, index) => parts[index - 1] === 'breeds');
    if (breedsPart) {
      return breedsPart.charAt(0).toUpperCase() + breedsPart.slice(1);
    }
    return 'Mixed breed';
  } catch {
    return 'Good dog';
  }
}