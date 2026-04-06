export const utterance = (word: string) => {
  const utterance = new SpeechSynthesisUtterance(word)
  const synth = window.speechSynthesis

  stopUtterance()
  return new Promise((resolve) => {
    // const voiceURI = localStorage.getItem("voice-lang") || "Google US English"
    utterance.lang = "en-US" // Set the language to English (United States)
    // utterance.pitch = 1;
    utterance.rate = 0.9

    synth.speak(utterance)
    utterance.onend = () => {
      resolve(true)
    }
  })
}

export const stopUtterance = () => {
  const synth = window.speechSynthesis
  synth.cancel()
}
