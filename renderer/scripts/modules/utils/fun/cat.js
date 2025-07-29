export async function showCatDialog(container) {
  // Show loading state
  container.innerHTML = `
    <div class="help-dialog">
      <h3>Random Cat 🐱</h3>
      <p>Summoning a majestic feline...</p>
    </div>
  `;

  try {
    // Fetch random cat image
    const response = await fetch('https://api.thecatapi.com/v1/images/search');
    
    if (!response.ok) {
      throw new Error('Cat data unavailable');
    }
    
    const data = await response.json();
    const catData = data[0]; // API returns an array
    
    // Format cat display
    const catText = `
      <div class="help-dialog">
        <h3>Random Cat 🐱</h3>
        <div class="help-section">
          <h4>Feline Overlord Alert:</h4>
          <img src="${catData.url}" alt="Random cat" style="max-width: 100%; max-height: 300px; border-radius: 8px; margin: 10px 0;">
          <p><strong>Status:</strong> Judging you silently 👑</p>
        </div>
        <div class="help-section">
          <h4>Cat Facts:</h4>
          <p><strong>Breed:</strong> ${catData.breeds && catData.breeds.length > 0 ? catData.breeds[0].name : 'House Cat'}</p>
          <p><strong>Attitude Level:</strong> Supreme ⭐⭐⭐⭐⭐</p>
          <p><strong>Treats Demanded:</strong> All of them</p>
          <p><strong>Lap Availability:</strong> ${Math.random() > 0.5 ? 'Maybe later' : 'Not interested'}</p>
        </div>
        <div class="help-section">
          <h4>Controls:</h4>
          <p><strong>Esc</strong> - Close cat dialog (if permitted)</p>
          <p><strong>r</strong> - Summon another cat overlord</p>
        </div>
      </div>
    `;
    
    container.innerHTML = catText;
    
  } catch (error) {
    // Fallback to original help content on error
    const fallbackText = `
      <div class="help-dialog">
        <h3>Cats Are Busy 😼</h3>
        <p>The cats are too important to appear right now. Showing help instead.</p>
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