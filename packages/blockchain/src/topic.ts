export const assertTopicFormat = (topic: string) => {
  const isTwoPart = /^@pmate\/[^/]+$/.test(topic)
  if (isTwoPart) return
  throw new Error(
    `Invalid topic "${topic}". Topic must be "@pmate/<name>" (exactly 2 parts, e.g. "@pmate/account").`
  )
}
