export interface AchievementLog {
  t: number
  id: Achiements // achievements ID
  n: number // number
  nft: 0 | 1 // is NFT
  exts?: (string | number)[] // extra infos
}

export enum Achiements {
  coin = 1,
}
