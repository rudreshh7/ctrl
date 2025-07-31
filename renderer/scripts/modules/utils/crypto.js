export function showCoinGeckoApiDialog(container) {
  // HTML for the dialog with improved, clean styling
  const apiText = `
    <div id="crypto-dialog" class="crypto-dialog">
      <h2 class="crypto-title">Cryptocurrency Prices</h2>
      <div id="crypto-loading" class="crypto-loading">Loading...</div>
      <div id="crypto-data" class="crypto-data"></div>
      <button onclick="document.getElementById('crypto-dialog').style.display='none'" class="crypto-close-btn">Close</button>
    </div>
  `;
  container.innerHTML = apiText;

  // Fetch data from CoinGecko API for USD and INR
  fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,inr')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      const cryptoDataDiv = document.getElementById('crypto-data');
      const loadingDiv = document.getElementById('crypto-loading');
      
      loadingDiv.style.display = 'none';
      
      cryptoDataDiv.innerHTML = `
        <div class="crypto-item">
          <p class="crypto-label">Bitcoin (BTC)</p>
          <p class="crypto-price">USD: $${data.bitcoin.usd.toFixed(2)}</p>
          <p class="crypto-price">INR: ₹${data.bitcoin.inr.toFixed(2)}</p>
        </div>
        <div class="crypto-item">
          <p class="crypto-label">Ethereum (ETH)</p>
          <p class="crypto-price">USD: $${data.ethereum.usd.toFixed(2)}</p>
          <p class="crypto-price">INR: ₹${data.ethereum.inr.toFixed(2)}</p>
        </div>
      `;
    })
    .catch(error => {
      const cryptoDataDiv = document.getElementById('crypto-data');
      const loadingDiv = document.getElementById('crypto-loading');
      loadingDiv.style.display = 'none';
      cryptoDataDiv.innerHTML = `<p class="crypto-error">Error fetching data: ${error.message}</p>`;
    });
}