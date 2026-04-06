import { useCallback, useEffect } from "react"

const isAddBlock = (el: HTMLElement) => {
  const gpt = document.querySelector("#gptdic-root")!
  if (el === gpt || gpt.contains(el)) {
    return false
  }
  const style = window.getComputedStyle(el)
  return (
    (style.position === "fixed" ||
      style.position === "absolute" ||
      style.position === "sticky") &&
    parseInt(style.zIndex, 10) > 0
  )
}

const removeAdBlock = (adBlock: HTMLElement) => {
  // Scale down the ad block to make it virtually invisible
  adBlock.style.transform = "scale(0.01)"

  // Prevent any mouse interaction with the ad block
  adBlock.style.pointerEvents = "none"
}

export const removeAdds = () => {
  const findAllFloatingWindows = useCallback(() => {
    const allElements = document.querySelectorAll("div")
    const floatingElements = Array.from(allElements).filter((el) => {
      return isAddBlock(el)
    })
    return floatingElements
  }, [])

  const remove = useCallback(() => {
    const addsBlock = findAllFloatingWindows()
    addsBlock.forEach((adBlock) => {
      removeAdBlock(adBlock)
    })
  }, [])

  useEffect(() => {
    remove()
    function handleMutations(mutations: MutationRecord[]) {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (["DIV"].includes(node.nodeName)) {
              if (isAddBlock(node as HTMLElement)) {
                removeAdBlock(node as HTMLElement)
              }
            }
          })
        }
      })
    }

    const observer = new MutationObserver(handleMutations)
    const config = { childList: true, subtree: true }
    observer.observe(document.body, config)

    return () => {
      observer.disconnect()
    }
  }, [])
}
