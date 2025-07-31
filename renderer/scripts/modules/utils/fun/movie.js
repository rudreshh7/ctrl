export async function showSearchDialog(container, query ) {
  // Show loading state
  container.innerHTML = `
    <div class="help-dialog">
      <h3>Searching Watchmode 🔍</h3>
      <p>Looking for <strong>${query}</strong>...</p>
    </div>
  `;

  const apiKey = 'kQALpd1DGd5tHn3WUzPgsRMJFToaysr72cflShV1';
  const searchField = 'name';
  const url = `https://api.watchmode.com/v1/search/?apiKey=${apiKey}&search_field=${searchField}&search_value=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }

    const data = await response.json();

    const titleResults = data.title_results || [];
    const peopleResults = data.people_results || [];

    const titleSection = titleResults.length > 0
      ? titleResults.map(title => `
          <div class="result-item">
            <h4>${title.name} (${title.year})</h4>
            <p><strong>Type:</strong> ${title.type}</p>
            <p><strong>IMDB ID:</strong> ${title.imdb_id}</p>
            <p><strong>TMDB ID:</strong> ${title.tmdb_id}</p>
          </div>
        `).join('')
      : `<p>No titles found.</p>`;

    const peopleSection = peopleResults.length > 0
      ? peopleResults.map(person => `
          <div class="result-item">
            <h4>${person.name}</h4>
            <p><strong>Profession:</strong> ${person.main_profession}</p>
            <p><strong>IMDB ID:</strong> ${person.imdb_id}</p>
            <p><strong>TMDB ID:</strong> ${person.tmdb_id}</p>
          </div>
        `).join('')
      : `<p>No people found.</p>`;

    container.innerHTML = `
      <div class="help-dialog">
        <h3>Results for: ${query}</h3>
        <div class="help-section">
          <h4>Titles:</h4>
          ${titleSection}
        </div>
        <div class="help-section">
          <h4>People:</h4>
          ${peopleSection}
        </div>
        <div class="help-section">
          <h4>Controls:</h4>
          <p><strong>Esc</strong> - Close dialog</p>
          <p><strong>r</strong> - Retry search</p>
        </div>
      </div>
    `;
  } catch (error) {
    // Fallback message on error
    container.innerHTML = `
      <div class="help-dialog">
        <h3>Search Failed ❌</h3>
        <p>We couldn’t find anything due to an error.</p>
        <div class="help-section">
          <h4>Try Again:</h4>
          <p><strong>r</strong> - Retry search</p>
          <p><strong>Esc</strong> - Close dialog</p>
        </div>
      </div>
    `;
  }
}
