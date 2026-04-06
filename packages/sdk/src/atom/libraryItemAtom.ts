import { atom } from "jotai"
import { Maybe } from "@pmate/utils"
import type { LibraryItem } from "@pmate/meta"
import { Api } from "@sdk/api/Api"

export const libraryItemAtom = atom(async () => {
  const json = await Api.getFile<LibraryItem[]>(
    `https://book.skedo.cn/settings/library.json?${Date.now()}`
  )

  return Maybe.Just((json ?? fallback) as LibraryItem[])
})

const fallback: LibraryItem[] = [
  {
    id: "oz",
    title: {
      en: "The Wonderful Wizard of OZ ",
      cn: "绿野仙踪",
    },
    link: "https://book.skedo.cn/books-v1/oz.json",
    type: "remote-json",
    author: "L. Frank Baum",
    intro:
      "The Wonderful Wizard of Oz is an American children's novel written by author L. Frank Baum and illustrated by W. W. Denslow, originally published by the George M. Hill Company in Chicago on May 17, 1900. It has since been reprinted on numerous occasions, most often under the title The Wizard of Oz, which is the title of the popular 1902 Broadway musical adaptation as well as the iconic 1939 musical film adaptation.",
  },
  {
    id: "robinson-crusoe",
    title: {
      en: "Robinson Crusoe",
      cn: "鲁滨逊漂流记",
    },
    link: "https://book.skedo.cn/books-v1/robinson-crusoe.json",
    type: "remote-json",
    author: "Daniel Defoe",
    intro:
      "Robinson Crusoe is a novel by Daniel Defoe, first published on 25 April 1719. The first edition credited the work's protagonist Robinson Crusoe as its author, leading many readers to believe he was a real person and the book a travelogue of true incidents.",
  },
  {
    id: "ring01",
    title: {
      en: "Lord Of The Rings: The Fellowship of the Ring",
      cn: "指环王01",
    },
    link: "https://book.skedo.cn/books-v1/ring01.fix02.json",
    type: "remote-json",
    author: "J.R.R. Tolkien",
    intro:
      "The Fellowship of the Ring is the first of three volumes of the epic novel The Lord of the Rings by the English author J. R. R. Tolkien. It is followed by The Two Towers and The Return of the King.",
  },
  {
    id: "ring02",
    title: {
      en: "The Two Towers",
      cn: "指环王02",
    },
    link: "https://book.skedo.cn/books-v1/ring02-v1.0.2.json",
    type: "remote-json",
    author: "J.R.R. Tolkien",
    intro:
      "The Two Towers is the second volume of J.R.R. Tolkien's high fantasy novel The Lord of the Rings. It is preceded by The Fellowship of the Ring and followed by The Return of the King.",
  },
  {
    id: "game-of-throne",
    title: {
      en: "Game of Throne",
      cn: "权力的游戏",
    },
    link: "https://book.skedo.cn/books-v1/game-of-thrones.json",
    type: "remote-json",
    author: "George R. R. Martin",
    intro:
      "Game of Thrones is the first novel in A Song of Ice and Fire, a series of fantasy novels by the American author George R. R. Martin. It was first published on August 6, 1996. The novel won the 1997 Locus Award and was nominated for both the 1997 Nebula Award and the 1997 World Fantasy Award.",
  },
  {
    id: "short-stories-simple",
    link: "https://book.skedo.cn/books-v1/short-stories.simple-v0.0.6.json",
    type: "remote-json",
    author: "AI",
    intro:
      "A collection of short stories of various authors ( simplied version ).",
    title: {
      en: "Short Stoires Collect(Grade)",
      cn: "短片小说合集(简易版)",
    },
  },
  {
    id: "short-stories",
    link: "https://book.skedo.cn/books-v1/short-stoires.raw-v0.0.6.json",
    type: "remote-json",
    author: "Various",
    intro: "A collection of short stories of various authors",
    title: {
      en: "Short Stories Collection",
      cn: "短片小说合集",
    },
  },
  {
    id: "lyrics-collection01",
    title: {
      en: "Lyrics Collection 01",
      cn: "歌词集01",
    },
    link: "https://book.skedo.cn/books-v1/lyrics-v0.0.8.json",
    type: "remote-json",
    author: "Various",
    intro:
      "Lyrics Collection 01 is a collection of lyrics from various songs. It includes lyrics from songs of different genres and different eras. The collection is intended to help readers appreciate the beauty of the lyrics and the music they are associated with.",
  },
  {
    id: "new-concept-2",
    title: {
      en: "New Concept English(II)",
      cn: "新概念英语II",
    },
    link: "https://book.skedo.cn/books-v1/new-concept02-v0.0.13.json",
    type: "remote-json",
    author: "unknown",
    intro: "...",
  },
  {
    id: "motivational-quotes",
    title: {
      en: "Motivational Quotes",
      cn: "励志名言",
    },
    link: "https://book.skedo.cn/books-v1/motivational-quotes-v0.0.1.json",
    type: "remote-json",
    author: "Various",
    intro:
      "Motivational Quotes is a collection of quotes from various authors, speakers, and leaders. The quotes are intended to inspire and motivate readers to achieve their goals and dreams. The collection includes quotes on topics such as success, perseverance, positivity, and self-improvement.",
  },
  {
    id: "flipped",
    title: {
      en: "Flipped",
      cn: "怦然心动",
    },
    link: "https://book.skedo.cn/books-v1/flipped-v0.0.1.json",
    type: "remote-json",
    author: "Wendelin Van Draanen",
    intro:
      "Flipped is a young adult novel by Wendelin Van Draanen published in 2001. It is a stand-alone teen romance in a he-said she-said style with the two protagonists alternately presenting their perspective on a shared set of events.",
  },
  {
    id: "flipped-simple",
    title: {
      en: "Flipped(Grade)",
      cn: "怦然心动",
    },
    link: "https://book.skedo.cn/books-v1/flipped.grade-v0.0.1.json",
    type: "remote-json",
    author: "Wendelin Van Draanen",
    intro:
      "Flipped is a young adult novel by Wendelin Van Draanen published in 2001. It is a stand-alone teen romance in a he-said she-said style with the two protagonists alternately presenting their perspective on a shared set of events.",
  },
  {
    id: "the-little-prince",
    title: {
      en: "The Little Prince",
      cn: "小王子",
    },
    link: "https://book.skedo.cn/books-v1/the-little-prince-v0.0.2.json",
    type: "remote-json",
    author: "Antoine de Saint-Exupéry",
    intro:
      "The Little Prince is a novella by French writer Antoine de Saint-Exupéry, first published in 1943. The story follows a young prince who visits various planets in space, including Earth, and addresses themes of loneliness, friendship, love, and loss.",
  },
  {
    id: "stray-bird",
    title: {
      en: "Stray Bird",
      cn: "飞鸟集",
    },
    link: "https://book.skedo.cn/books-v1/stray-bird-v0.0.1.json",
    type: "remote-json",
    author: "Rabindranath Tagore",
    intro:
      "Stray Birds is a collection of poems by the Indian poet Rabindranath Tagore. The poems in the collection are short, lyrical, and meditative, reflecting on themes such as nature, love, spirituality, and the human experience.",
  },
  {
    id: "phaedo",
    author: "Plato",
    link: "https://book.skedo.cn/books-v1/phaedo-v0.0.4.json",
    intro: "",
    type: "remote-json",
    title: {
      en: "Phaedo",
      cn: "费多",
    },
  },
  {
    id: "harry-01",
    author: "J.K. Rowling",
    link: "https://book.skedo.cn/books-v1/harry-01-v0.0.1.json",
    intro:
      "Harry Potter and the Philosopher's Stone is a fantasy novel written by British author J. K. Rowling. The first novel in the Harry Potter series and Rowling's debut novel, it follows Harry Potter, a young wizard who discovers his magical heritage on his eleventh birthday when he receives a letter of acceptance to Hogwarts School of Witchcraft and Wizardry.",
    type: "remote-json",
    title: {
      cn: "哈利波特与魔法石",
      en: "Harry Potter and the Sorcerer’s Stone",
    },
  },
  {
    id: "harry-02",
    author: "J.K. Rowling",
    link: "https://book.skedo.cn/books-v1/harry-02-v0.0.2.json",
    intro:
      "Harry Potter and the Chamber of Secrets is a fantasy novel written by British author J. K. Rowling. The second novel in the Harry Potter series, it follows Harry Potter, a young wizard who enrolls in his second year at Hogwarts School of Witchcraft and Wizardry.",
    type: "remote-json",
    title: {
      cn: "哈利波特与密室",
      en: "Harry Potter and the Chamber of Secrets",
    },
  },
]