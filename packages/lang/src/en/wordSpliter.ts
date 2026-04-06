const regex = new RegExp(
  [
    // Honorifics followed by a name (with optional space after period)
    /(?:Mr|Mrs|Dr|Ms|Prof|Jr|Sr|Rev|Capt|Col|Lt|Gen|Cmdr|Sgt|Maj|Baron|Baroness|Lord|Lady|Master|Dame|Sir|Mx|Monsieur|Madame|Mademoiselle|Hon|Elder)\.(?=\s?[A-Za-z])/,

    // URI pattern for domain-like words (URLs)
    /(?:https?:\/\/(?:www\.)?[A-Za-z0-9-]+\.[A-Za-z]{2,})(?:\/[A-Za-z0-9-._~:/?#[\]@!$&'()*+,;=%]*)?|[A-Za-z0-9-]+\.[A-Za-z]{2,}/,

    // Date pattern for dates like 12/10/2024 or 2024-10-12
    /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{2}[-/]\d{2}/,

    // Time pattern for time formats like 12:00 AM/PM, 2:45 PM, etc.
    /\b(?:[01]?[0-9]|2[0-3]|00):[0-5][0-9]\s?(?:AM|PM|am|pm|a\.m\.|p\.m\.)/i,

    // Ordinal number pattern (e.g., 1st, 2nd, 3rd, etc.)
    /\b\d{1,2}(?:st|nd|rd|th)\b/,

    // Currency pattern for values like $1,000 or 1000.50
    /(?:\$\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:,\d{3})*(?:\.\d+)?)/,

    // Mention pattern for social media mentions like @tommy
    /@[A-Za-z0-9_]+/,

    // Email pattern (matches email addresses)
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,

    // Number pattern for decimals, including cases like .9
    /\d+(?:[.,]\d+)?|(?:\.\d+)/,

    // Hashtag pattern to match hashtags like #example
    /#\w+/,

    // Roman Numerals pattern (e.g., I, II, III, IV, V), ensuring no partial matches in words
    /\b(?:[IVXLCDM]+)\b/,

    // Word matching (matches words and periods except honorifics)
    /(?:[A-Za-z0-9À-ÿ]+(?:[-'.]?[A-Za-z0-9À-ÿ]+)*)/,

    // Incase of any non-matching word-like strings
    /(?<=\s)\S+(?=\s)/,
  ]
    .map((x) => x.source)
    .join("|"),
  "g"
)

export function isReadable(word: string) {
  regex.lastIndex = 0
  return regex.test(word)
}

export function wordSpliter(input: string, punctuation = true): string[] {
  // Create a regex pattern that handles various cases, including the ones requested

  const result: string[] = []
  let lastIndex = 0 // Track the last matched position
  regex.lastIndex = 0
  while (lastIndex < input.length) {
    // Try matching the regex at the current position
    const match = regex.exec(input)

    if (match && match.index === lastIndex) {
      result.push(match[0])
      lastIndex = regex.lastIndex // Move index after the match
      // console.log("match", match[0], lastIndex)
    } else {
      // If no match, add the current character as punctuation or non-matching part
      if (punctuation) {
        // console.log("push punctuation", input[lastIndex])
        result.push(input[lastIndex])
      }
      lastIndex++
      regex.lastIndex = lastIndex
      // console.log(
      //   `not match: lastIndex=${lastIndex}, c=%${input[lastIndex - 1]}%`
      // )
    }
  }
  return result
}
