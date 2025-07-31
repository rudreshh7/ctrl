export async function showMemeDialog(container) {
  // Show loading state
  container.innerHTML = `
    <div class="help-dialog" style="background: #1e1e1e; color: #d1d5db; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 10px; border-radius: 6px; max-width: 720px; height: 480px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); display: flex;">
      <div style="flex: 1; padding: 5px;">
        <img id="previewImage" style="max-width: 100%; height: 100%; border: 1px solid #4b5563; border-radius: 4px;">
      </div>
      <div style="flex: 1; padding: 5px; height: 460px; display: flex; flex-direction: column;">
        <h3 style="font-size: 1em; margin-bottom: 5px; color: #f3f4f6;">Meme Generator</h3>
        <div style="margin-bottom: 5px; flex: 0 0 auto;">
          <h4 style="font-size: 0.9em; margin-bottom: 3px; color: #9ca3af;">Credentials:</h4>
          <input type="text" id="usernameInput" placeholder="Username..." style="width: 100%; padding: 4px; margin-bottom: 3px; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.8em; outline: none;">
          <input type="password" id="passwordInput" placeholder="Password..." style="width: 100%; padding: 4px; margin-bottom: 5px; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.8em; outline: none;">
        </div>
        <div style="margin-bottom: 5px; flex: 0 0 auto;">
          <h4 style="font-size: 0.9em; margin-bottom: 3px; color: #9ca3af;">Search:</h4>
          <input type="text" id="memeSearch" placeholder="Search..." style="width: 100%; padding: 4px; margin-bottom: 5px; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.8em; outline: none;">
        </div>
        <div id="memeList" style="flex: 1; overflow-y: auto; margin-bottom: 5px;">
          <h4 style="font-size: 0.9em; margin-bottom: 3px; color: #9ca3af;">Templates:</h4>
        </div>
        <div id="editSection" style="display: none; flex: 1; overflow-y: auto;">
          <button id="backButton" style="padding: 4px 8px; background: #4b5563; border: none; border-radius: 3px; color: #fff; margin-bottom: 5px; font-size: 0.8em; cursor: pointer;">Back</button>
          <div id="editControls"></div>
          <button id="generateButton" style="padding: 4px 8px; background: #3b82f6; border: none; border-radius: 3px; color: #fff; font-size: 0.8em; cursor: pointer; width: 100%; margin-top: 5px;">Generate</button>
        </div>
        <div style="margin-top: auto; flex: 0 0 auto;">
          <h4 style="font-size: 0.9em; margin-bottom: 3px; color: #9ca3af;">Controls:</h4>
          <p style="margin: 2px 0; font-size: 0.8em; color: #d1d5db;"><strong>Esc</strong> - Close</p>
          <p style="margin: 2px 0; font-size: 0.8em; color: #d1d5db;"><strong>r</strong> - Refresh</p>
        </div>
      </div>
    </div>
  `;

  let username = '';
  let password = '';
  let selectedMeme = null;

  try {
    // Fetch meme templates from Imgflip API
    const response = await fetch('https://api.imgflip.com/get_memes');
    if (!response.ok) throw new Error('Meme templates unavailable');
    const data = await response.json();
    const memes = data.data.memes;

    // Initialize meme list
    const memeList = container.querySelector('#memeList');
    memeList.innerHTML = `<h4 style="font-size: 0.9em; margin-bottom: 3px; color: #9ca3af;">Templates:</h4>${memes.slice(0, 7).map(meme => `
      <div id="meme-${meme.id}" style="margin-bottom: 5px; padding: 5px; background: #2d2d2d; border-radius: 3px; cursor: pointer; font-size: 0.8em;" onclick="selectMeme('${meme.id}')">
        <strong>${meme.name}</strong> <a href="#" class="download-link" data-url="${meme.url}" data-name="${meme.name}" style="color: #3b82f6; text-decoration: none;">Download</a>
      </div>
    `).join('')}`;

    // Store credentials
    const usernameInput = container.querySelector('#usernameInput');
    const passwordInput = container.querySelector('#passwordInput');
    usernameInput.addEventListener('change', () => { username = usernameInput.value.trim(); });
    passwordInput.addEventListener('change', () => { password = passwordInput.value.trim(); });

    // Search functionality
    const searchInput = container.querySelector('#memeSearch');
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      const filteredMemes = memes.filter(meme => meme.name.toLowerCase().includes(searchTerm)).slice(0, 7);
      memeList.innerHTML = `<h4 style="font-size: 0.9em; margin-bottom: 3px; color: #9ca3af;">Templates:</h4>${filteredMemes.map(meme => `
        <div id="meme-${meme.id}" style="margin-bottom: 5px; padding: 5px; background: #2d2d2d; border-radius: 3px; cursor: pointer; font-size: 0.8em;" onclick="selectMeme('${meme.id}')">
          <strong>${meme.name}</strong> <a href="#" class="download-link" data-url="${meme.url}" data-name="${meme.name}" style="color: #3b82f6; text-decoration: none;">Download</a>
        </div>
      `).join('') || '<p style="color: #9ca3af;">No matches</p>'}`;
      attachDownloadListeners();
    });

    // Download functionality
    function attachDownloadListeners() {
      const downloadLinks = container.querySelectorAll('.download-link');
      downloadLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
          e.preventDefault();
          const url = link.getAttribute('data-url');
          const name = link.getAttribute('data-name');
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${name}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
          } catch (error) {
            console.error('Download failed:', error);
          }
        });
      });
    }
    attachDownloadListeners();

    // Select meme and show edit controls
    window.selectMeme = function(memeId) {
      selectedMeme = memes.find(m => m.id === memeId);
      const memeList = container.querySelector('#memeList');
      const editSection = container.querySelector('#editSection');
      const previewImage = container.querySelector('#previewImage');
      memeList.style.display = 'none';
      editSection.style.display = 'block';
      previewImage.src = selectedMeme.url;

      const editControls = container.querySelector('#editControls');
      editControls.innerHTML = `
        <h4 style="font-size: 0.9em; margin-bottom: 3px; color: #9ca3af;">Edit Boxes</h4>
        <div style="margin-bottom: 5px;">
          <label style="display: block; margin-bottom: 2px; color: #f3f4f6;">Box 1:</label>
          <input type="text" id="box1-text" value="One does not simply" style="width: 100%; padding: 4px; margin-bottom: 2px; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.7em;">
          <input type="number" id="box1-x" value="10" style="width: 48%; padding: 4px; margin-right: 2%; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.7em;">
          <input type="number" id="box1-y" value="10" style="width: 48%; padding: 4px; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.7em;">
          <input type="number" id="box1-width" value="548" style="width: 48%; padding: 4px; margin-right: 2%; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.7em;">
          <input type="number" id="box1-height" value="100" style="width: 48%; padding: 4px; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.7em;">
          <input type="color" id="box1-color" value="#ffffff" style="width: 48%; padding: 4px; margin-right: 2%; border: 1px solid #4b5563; border-radius: 3px;">
          <input type="color" id="box1-outline" value="#000000" style="width: 48%; padding: 4px; border: 1px solid #4b5563; border-radius: 3px;">
        </div>
        <div style="margin-bottom: 5px;">
          <label style="display: block; margin-bottom: 2px; color: #f3f4f6;">Box 2:</label>
          <input type="text" id="box2-text" value="" style="width: 100%; padding: 4px; margin-bottom: 2px; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.7em;">
          <input type="number" id="box2-x" value="10" style="width: 48%; padding: 4px; margin-right: 2%; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.7em;">
          <input type="number" id="box2-y" value="225" style="width: 48%; padding: 4px; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.7em;">
          <input type="number" id="box2-width" value="548" style="width: 48%; padding: 4px; margin-right: 2%; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.7em;">
          <input type="number" id="box2-height" value="100" style="width: 48%; padding: 4px; border: 1px solid #4b5563; border-radius: 3px; background: #2d2d2d; color: #d1d5db; font-size: 0.7em;">
          <input type="color" id="box2-color" value="#ffffff" style="width: 48%; padding: 4px; margin-right: 2%; border: 1px solid #4b5563; border-radius: 3px;">
          <input type="color" id="box2-outline" value="#000000" style="width: 48%; padding: 4px; border: 1px solid #4b5563; border-radius: 3px;">
        </div>
      `;

      // Live preview and generate
      const inputs = container.querySelectorAll('#editControls input, #editControls textarea');
      inputs.forEach(input => input.addEventListener('input', updatePreview));

      const generateButton = container.querySelector('#generateButton');
      generateButton.addEventListener('click', generateMeme);

      const backButton = container.querySelector('#backButton');
      backButton.addEventListener('click', () => {
        const memeList = container.querySelector('#memeList');
        const editSection = container.querySelector('#editSection');
        memeList.style.display = 'block';
        editSection.style.display = 'none';
        selectedMeme = null;
      });

      function updatePreview() {
        if (!username || !password) return;
        const box1Text = container.querySelector('#box1-text').value.trim();
        const box2Text = container.querySelector('#box2-text').value.trim();
        const boxes = [];
        if (box1Text) boxes.push({
          text: box1Text, x: parseInt(container.querySelector('#box1-x').value),
          y: parseInt(container.querySelector('#box1-y').value),
          width: parseInt(container.querySelector('#box1-width').value),
          height: parseInt(container.querySelector('#box1-height').value),
          color: container.querySelector('#box1-color').value,
          outline_color: container.querySelector('#box1-outline').value
        });
        if (box2Text) boxes.push({
          text: box2Text, x: parseInt(container.querySelector('#box2-x').value),
          y: parseInt(container.querySelector('#box2-y').value),
          width: parseInt(container.querySelector('#box2-width').value),
          height: parseInt(container.querySelector('#box2-height').value),
          color: container.querySelector('#box2-color').value,
          outline_color: container.querySelector('#box2-outline').value
        });

        const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&template_id=${selectedMeme.id}` +
          `&boxes[0][text]=${encodeURIComponent(boxes[0]?.text || '')}&boxes[0][x]=${boxes[0]?.x || 10}&boxes[0][y]=${boxes[0]?.y || 10}&boxes[0][width]=${boxes[0]?.width || 548}&boxes[0][height]=${boxes[0]?.height || 100}&boxes[0][color]=${encodeURIComponent(boxes[0]?.color || '#ffffff')}&boxes[0][outline_color]=${encodeURIComponent(boxes[0]?.outline_color || '#000000')}` +
          `&boxes[1][text]=${encodeURIComponent(boxes[1]?.text || '')}&boxes[1][x]=${boxes[1]?.x || 10}&boxes[1][y]=${boxes[1]?.y || 225}&boxes[1][width]=${boxes[1]?.width || 548}&boxes[1][height]=${boxes[1]?.height || 100}&boxes[1][color]=${encodeURIComponent(boxes[1]?.color || '#ffffff')}&boxes[1][outline_color]=${encodeURIComponent(boxes[1]?.outline_color || '#000000')}`;

        fetch('https://api.imgflip.com/caption_image', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
          .then(response => response.json())
          .then(result => { if (result.success) container.querySelector('#previewImage').src = result.data.url; })
          .catch(error => console.error('Preview failed:', error));
      }

      function generateMeme() {
        if (!username || !password) {
          alert('Please enter a valid Imgflip username and password.');
          return;
        }
        const box1Text = container.querySelector('#box1-text').value.trim();
        const box2Text = container.querySelector('#box2-text').value.trim();
        if (!box1Text && !box2Text) {
          alert('Please enter at least one text box content.');
          return;
        }

        const boxes = [];
        if (box1Text) boxes.push({
          text: box1Text, x: parseInt(container.querySelector('#box1-x').value),
          y: parseInt(container.querySelector('#box1-y').value),
          width: parseInt(container.querySelector('#box1-width').value),
          height: parseInt(container.querySelector('#box1-height').value),
          color: container.querySelector('#box1-color').value,
          outline_color: container.querySelector('#box1-outline').value
        });
        if (box2Text) boxes.push({
          text: box2Text, x: parseInt(container.querySelector('#box2-x').value),
          y: parseInt(container.querySelector('#box2-y').value),
          width: parseInt(container.querySelector('#box2-width').value),
          height: parseInt(container.querySelector('#box2-height').value),
          color: container.querySelector('#box2-color').value,
          outline_color: container.querySelector('#box2-outline').value
        });

        const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&template_id=${selectedMeme.id}` +
          `&boxes[0][text]=${encodeURIComponent(boxes[0]?.text || '')}&boxes[0][x]=${boxes[0]?.x || 10}&boxes[0][y]=${boxes[0]?.y || 10}&boxes[0][width]=${boxes[0]?.width || 548}&boxes[0][height]=${boxes[0]?.height || 100}&boxes[0][color]=${encodeURIComponent(boxes[0]?.color || '#ffffff')}&boxes[0][outline_color]=${encodeURIComponent(boxes[0]?.outline_color || '#000000')}` +
          `&boxes[1][text]=${encodeURIComponent(boxes[1]?.text || '')}&boxes[1][x]=${boxes[1]?.x || 10}&boxes[1][y]=${boxes[1]?.y || 225}&boxes[1][width]=${boxes[1]?.width || 548}&boxes[1][height]=${boxes[1]?.height || 100}&boxes[1][color]=${encodeURIComponent(boxes[1]?.color || '#ffffff')}&boxes[1][outline_color]=${encodeURIComponent(boxes[1]?.outline_color || '#000000')}`;

        fetch('https://api.imgflip.com/caption_image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body
        })
          .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
          })
          .then(result => {
            if (result.success) {
              const previewImage = container.querySelector('#previewImage');
              previewImage.src = result.data.url;
              const downloadLink = container.querySelector(`#meme-${selectedMeme.id} .download-link`);
              if (downloadLink) downloadLink.setAttribute('data-url', result.data.url);
            } else {
              alert('Failed to generate meme: ' + (result.error_message || 'Unknown error'));
            }
          })
          .catch(error => {
            console.error('Error generating meme:', error);
            alert('An error occurred while generating the meme. Please check your credentials and try again.');
          });
      }
    }
  } catch (error) {
    container.innerHTML = `
      <div class="help-dialog" style="background: #1e1e1e; color: #d1d5db; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 10px; border-radius: 6px; max-width: 720px; height: 480px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); display: flex;">
        <div style="flex: 1; padding: 5px;"><p style="font-size: 0.8em; color: #9ca3af;">Unavail.</p></div>
        <div style="flex: 1; padding: 5px;"><p style="font-size: 0.8em; color: #9ca3af;">Error</p></div>
      </div>
    `;
  }
}