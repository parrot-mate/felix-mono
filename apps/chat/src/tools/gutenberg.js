function getGutenbergContent() {
  let list = [...document.querySelectorAll("h2, body>p")].filter(
    (x) =>
      x.tagName === "P" ||
      (x.tagName === "H2" && x.textContent.match(/Chapter/i))
  )
  const start = list.findIndex((x) => x.tagName === "H2")
  list = list.slice(start)
  const header = document.querySelector("#pg-machine-header").textContent
  document.querySelectorAll(".pagenum").forEach((x) => x.remove())
  console.log(header)

  const chapters = []

  for (let el of list) {
    if (el.tagName === "H2") {
      chapters.push({
        title: el.textContent,
        paragraphs: [],
      })
    } else {
      chapters[chapters.length - 1].paragraphs.push({
        content: el.textContent,
      })
    }
  }

  const book = {
    name: header.match(/Title:\s*(.*)\n/)[1],
    desc: "",
    author: header.match(/Author:\s*(.*)\n/)[1],
    chapters,
  }

  saveToJson(book)
}

function saveToJson(book) {
  const a = document.createElement("a")
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(book, null, 2)], { type: "application/json" })
  )
  a.download = `robinson-crusoe.json`
  a.click()
}

getGutenbergContent()
