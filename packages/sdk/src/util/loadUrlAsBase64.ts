export async function loadUrlAsBase64(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors" })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }

  const blob = await res.blob()

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
    reader.onerror = () => reject(new Error("FileReader failed"))
    reader.readAsDataURL(blob)
  })
}

