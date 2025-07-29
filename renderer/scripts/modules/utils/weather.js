export async function showWeatherDialog(container) {
  // Show loading state
  container.innerHTML = `
    <div class="help-dialog">
      <h3>Weather Forecast</h3>
      <p>Loading weather data...</p>
    </div>
  `;

  try {
    // Get user's location (you can replace with fixed coordinates if needed)
    const position = await getCurrentLocation();
    const { latitude, longitude } = position.coords;
    
    // Fetch weather data
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`
    );
    
    if (!response.ok) {
      throw new Error('Weather data unavailable');
    }
    
    const data = await response.json();
    
    // Format weather display
    const weatherText = `
      <div class="help-dialog">
        <h3>Weather Forecast</h3>
        <div class="help-section">
          <h4>Current Weather:</h4>
          <p><strong>Temperature:</strong> ${Math.round(data.current.temperature_2m)}°C</p>
          <p><strong>Wind Speed:</strong> ${data.current.wind_speed_10m} km/h</p>
        </div>
        <div class="help-section">
          <h4>7-Day Forecast:</h4>
          ${data.daily.time.slice(0, 7).map((date, i) => `
            <p><strong>${new Date(date).toLocaleDateString()}:</strong> 
            ${Math.round(data.daily.temperature_2m_min[i])}°C - ${Math.round(data.daily.temperature_2m_max[i])}°C
            ${data.daily.precipitation_sum[i] > 0 ? ` | Rain: ${data.daily.precipitation_sum[i]}mm` : ''}</p>
          `).join('')}
        </div>
        <div class="help-section">
          <h4>Controls:</h4>
          <p><strong>Esc</strong> - Close weather dialog</p>
          <p><strong>r</strong> - Refresh weather data</p>
        </div>
      </div>
    `;
    
    container.innerHTML = weatherText;
    
  } catch (error) {
    // Fallback to original help content on error
    const fallbackText = `
      <div class="help-dialog">
        <h3>Weather Unavailable</h3>
        <p>Unable to fetch weather data. Showing help instead.</p>
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

// Helper function to get user location
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Fallback to a default location (New York City)
      resolve({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      () => {
        // Fallback to default location on error
        resolve({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        });
      },
      { timeout: 5000 }
    );
  });
}