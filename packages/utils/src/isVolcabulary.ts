const WRD_REG =
  /^[a-zA-ZÁáÉéÍíÓóÚúÝýÂâÊêÎîÔôÛû][a-zA-Z-ÁáÉéÍíÓóÚúÝýÂâÊêÎîÔôÛû]*[a-zA-ZÁáÉéÍíÓóÚúÝýÂâÊêÎîÔôÛû]$/
const PRT_WRD_REG =
  /^-?[a-zA-ZÁáÉéÍíÓóÚúÝýÂâÊêÎîÔôÛû][a-zA-Z-ÁáÉéÍíÓóÚúÝýÂâÊêÎîÔôÛû]*[a-zA-ZÁáÉéÍíÓóÚúÝýÂâÊêÎîÔôÛû]-?$/

export const isWordV4 = (word: string) => {
  return WRD_REG.test(word)
}

export const isWordV4OrPart = (word: string) => {
  return PRT_WRD_REG.test(word)
}
