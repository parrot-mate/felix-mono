export async function fetchWikipediaSummary(title: string): Promise<string> {
  const endpoint = "https://en.wikipedia.org/w/api.php";
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "extracts",
    exintro: "",
    explaintext: "",
    titles: title,
    redirects: "1", // Automatically resolve redirects
  });

  const url = `${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "omit",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const page = data.query.pages[Object.keys(data.query.pages)[0]];
    return page.extract || "No summary found";
  } catch (error) {
    console.error("Error fetching Wikipedia summary:", error);
    return "";
  }
}

