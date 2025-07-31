export function showWaifuDialog(container) {
  // HTML for the dialog with minimal, clean styling
  const waifuText = `
    <div id="waifu-dialog" style="padding: 20px; background: #f9fafb; max-width: 420px; margin: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h2 style="font-size: 1.45rem; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Waifu Image Gallery</h2>
      <div id="waifu-loading" style="color: #6b7280;">Loading...</div>
      <div id="waifu-data" style="margin-bottom: 16px;"></div>
      <button onclick="document.getElementById('waifu-dialog').style.display='none'" 
        style="background: #3b82f6; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 0.875rem;">
        Close
      </button>
    </div>
  `;
  container.innerHTML = waifuText;

  // Prepare request URL
  const apiUrl = 'https://api.waifu.im/search';
  const params = {
    included_tags: ['raiden-shogun', 'maid'],
    height: '>=2000'
  };
  const queryParams = new URLSearchParams();
  for (const key in params) {
    if (Array.isArray(params[key])) {
      params[key].forEach(value => queryParams.append(key, value));
    } else {
      queryParams.set(key, params[key]);
    }
  }
  const requestUrl = `${apiUrl}?${queryParams.toString()}`;

  // Fetch and display waifu image
  fetch(requestUrl)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      const waifuDataDiv = document.getElementById('waifu-data');
      const loadingDiv = document.getElementById('waifu-loading');
      loadingDiv.style.display = 'none';

      if (data?.images?.length) {
        waifuDataDiv.innerHTML = data.images
          .map(img =>
            `<a href="${img.url}" target="_blank" rel="noopener">
               <img src="${img.url}" alt="waifu" 
                style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-bottom: 12px; display: block;" />
             </a>`
          ).join('');
      } else {
        waifuDataDiv.innerHTML = `
          <p style="color: #ef4444;">No waifu images found for the given tags and filters.</p>
        `;
      }
    })
    .catch(error => {
      const waifuDataDiv = document.getElementById('waifu-data');
      const loadingDiv = document.getElementById('waifu-loading');
      loadingDiv.style.display = 'none';
      waifuDataDiv.innerHTML = `<p style="color: #ef4444;">Error fetching waifus: ${error.message}</p>`;
    });
}
