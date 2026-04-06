export const meaning_of_word_prompt_v5 = (word: string) => {
  const prompt = `参考这种简短的形式，给出单词 '${word}' 的中文意思。
    参考：
      
    abandon
    vt. 放弃;沉溺@n. 放任

    返回JSON
    {
      meaning: string 
    }
  
  `
  return prompt
}
