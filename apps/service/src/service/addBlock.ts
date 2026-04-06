import { Block, BlockDesc, Log } from "@pmate/meta"
import { POSS } from "../util/alioss"
import { OSSKeys } from "@pmate/meta"

export const addBlock = async (user: string, logs: Log[]) => {
  const descKey = OSSKeys.blockMeta(user)
  const defDesc: BlockDesc = {
    current: -1,
  }

  const desc: BlockDesc = (await POSS.publicOSS.getResourceOSS<BlockDesc>(descKey)) || defDesc

  const block: Block = {
    version: 1,
    logs,
  }

  desc.current++
  const blockKey = OSSKeys.block(user, desc.current)
  await POSS.publicOSS.uploadJsonToOSS(blockKey, block)
  await POSS.publicOSS.uploadJsonToOSS(descKey, desc)
}
