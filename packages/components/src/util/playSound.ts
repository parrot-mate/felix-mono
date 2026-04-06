export const playSound = (url: string) => {
  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(url)

    // 播放完毕 → resolve
    audio.addEventListener("ended", () => resolve(), { once: true })
    // 播放错误 → reject
    audio.addEventListener("error", (e) => reject(e), { once: true })

    // Safari/移动端可能要求在用户交互里调用 play
    audio.play().catch(reject)
  })
}

