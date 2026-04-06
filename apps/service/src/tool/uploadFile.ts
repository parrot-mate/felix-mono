import fs from "fs"
import "../env"
import { POSS } from "../util/alioss"

const file = process.argv[2]
const key = process.argv[3]

async function run() {
  const buffer = fs.readFileSync(file)
  await POSS.publicOSS.uploadFileToOSS(key, buffer)
}

run()
