/**
 * Get color information from The Color API.
 * @param {Object} options - { hex, rgb, hsl, cmyk, format }
 * @returns {Promise<Object>} - Color info JSON from the API.
 */
export async function getColorInfo(options = {}) {
  const params = new URLSearchParams();
  if (options.hex) params.append("hex", options.hex.replace(/^#/, ""));
  if (options.rgb) params.append("rgb", options.rgb);
  if (options.hsl) params.append("hsl", options.hsl);
  if (options.cmyk) params.append("cmyk", options.cmyk);
  params.append("format", options.format || "json");

  const url = `https://www.thecolorapi.com/id?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch color info");
  return await res.json();
}
