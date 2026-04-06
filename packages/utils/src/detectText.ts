// This function converts an image file to a base64 encoded string

// This function sends the image to the Vision API for text detection
export async function detectText(imageBase64: string): Promise<string> {
  const apiKey = "AIzaSyB60IT_Mte2tZisNiBujfS_q9MPOnw6tgk" // Replace with your API key
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`
  const payload = {
    requests: [
      {
        image: {
          content: imageBase64.split(";base64,").pop(),
        },
        features: [
          {
            type: "TEXT_DETECTION",
          },
        ],
      },
    ],
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(
        `Server responded with ${response.status}: ${response.statusText}`
      )
    }

    const data = await response.json()
    return data.responses[0].fullTextAnnotation.text

    // Process the response data to extract and use the detected text
  } catch (error) {
    console.error("Error detecting text:", error)
    return ""
  }
}
