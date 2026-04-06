import { createContext } from "react"
import { VocabularyMap } from "@pmate/utils"
import { Marker } from "./Marker"

interface VolContextData {
  trie: VocabularyMap<string>
  marker: Marker
}
export const VolContext = createContext<VolContextData | null>(null)
