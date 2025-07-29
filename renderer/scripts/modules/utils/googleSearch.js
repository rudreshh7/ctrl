export async function handleGoogleSearch(searchQuery) {
  if (!searchQuery) {
    console.error("No search query provided for Google search");
    return;
  }

  console.log("Opening Google search for:", searchQuery);

  // Encode the search query for URL
  const encodedQuery = encodeURIComponent(searchQuery);
  const googleUrl = `https://www.google.com/search?q=${encodedQuery}`;

  try {
    // Use Electron's shell to open the URL in the default browser
    await window.electronAPI.openExternal(googleUrl);

    // Hide the Ctrl window after opening the search
    window.electronAPI.hideWindow();
  } catch (error) {
    console.error("Failed to open Google search:", error);
  }
}
