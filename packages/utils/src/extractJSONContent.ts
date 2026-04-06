export function extractContent(input: string): any {
  const firstBrace = input.indexOf("{");
  const lastBrace = input.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return null; // Returns null if braces are not found or are in the wrong order
  }

  const str = input.substring(firstBrace, lastBrace + 1);
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (ex) {
    return null;
  }
}
