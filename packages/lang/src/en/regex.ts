// export const REG_WORD_SPLITER_EN = /([^a-zA-Z-ÁáÉéÍíÓóÚúÝýÂâÊêÎîÔôÛû])/
export const REG_WORD_SPLITER_EN =
  /(\s+|(?<!\w)'(?!\w)|(?<!\d),(?!\d)|[.!?;:"“”‘’])/
export const REG_WORD_READABLE =
  /^[a-zA-Z-ÁáÉéÍíÓóÚúÝýÂâÊêÎîÔôÛû0-9!@#$%^&* ]+$/

export const SUPPORTED_CHARS = /([a-zA-Z-ÁáÉéÍíÓóÚúÝýÂâÊêÎîÔôÛû0-9]+)/
