export async function getWikipediaEntryUrl(title: string): Promise<string> {
  const apiUrl = `https://en.wikipedia.org/w/api.php`;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    titles: title,
    redirects: "1", // Automatically resolve redirects
  });

  try {
    const response = await fetch(`${apiUrl}?${params.toString()}`);
    const data = await response.json();

    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];

    // Check if the page exists
    if (pageId === "-1") {
      return "";
    }

    const page = pages[pageId];
    // Check if the page is a disambiguation page
    if (page.pageprops && page.pageprops.disambiguation) {
      return `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    }

    // Return the jump URL (direct link to the page)
    return `https://en.wikipedia.org/?curid=${pageId}`;
  } catch (error) {
    console.error("Error fetching Wikipedia entry:", error);
    return "";
  }
}
