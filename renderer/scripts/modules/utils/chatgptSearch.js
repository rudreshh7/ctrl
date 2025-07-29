export async function handleChatGPTSearch(searchQuery) {
  if (!searchQuery) {
    console.error("No search query provided for ChatGPT search");
    return;
  }

  console.log("Opening ChatGPT with query:", searchQuery);

  // Encode the search query for URL
  const encodedQuery = encodeURIComponent(searchQuery);
  const chatgptUrl = `https://chat.openai.com/?q=${encodedQuery}`;

  try {
    // Use Electron's shell to open the URL in the default browser
    await window.electronAPI.openExternal(chatgptUrl);

    // Hide the Ctrl window after opening ChatGPT
    window.electronAPI.hideWindow();
  } catch (error) {
    console.error("Failed to open ChatGPT:", error);
  }
}
