import fs from 'node:fs'
import path from 'node:path'

/** Файл, который становится главной страницей. */
export const HOME_FILE = '00-about.md'

/** Заглушка в тексте книги, на месте которой собирается указатель промптов. */
export const PROMPT_INDEX_MARKER = '<!-- prompt-index -->'

export type PageKind = 'chapter' | 'appendix' | 'other'

export interface Section {
  level: number
  /** Заголовок без разметки — так он подписан в меню. */
  text: string
  slug: string
}

export interface Prompt {
  /** Номер по книге: «1.1», «А.1». */
  number: string
  /** Якорь карточки на её странице. */
  anchor: string
  title: string
  /** Текст промпта без фенса — таким он уходит в буфер обмена. */
  body: string
  file: string
  route: string
}

export interface Page {
  file: string
  /** Путь на сайте без base: «/02-ch01», у главной — «/». */
  route: string
  title: string
  /** «Глава 1», «Приложение А» — для указателя промптов и обложки. */
  short: string
  kind: PageKind
  /** Номер главы или буква приложения; у остальных частей пуст. */
  chapter: string
  /** Первый абзац — идёт в meta description. */
  description: string
  sections: Section[]
  prompts: Prompt[]
  /** Сколько пунктов во всех чек-листах страницы. */
  tasks: number
  isPromptIndex: boolean
}

export interface Book {
  pages: Page[]
  prompts: Prompt[]
  byFile: Map<string, Page>
  chapters: number
  appendices: number
  /** Страница с указателем промптов — приложение В. */
  promptIndex?: Page
}

const rControl = /[\u0000-\u001f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
const rCombining = /[\u0300-\u036F]/g

/**
 * Якоря заголовков. Повторяет алгоритм VitePress, но сохраняет «й»: при
 * NFKD-нормализации она распадается на «и» и знак краткости, и якорь
 * «который» превращался бы в «которыи».
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/й/g, '\u0458')
    .normalize('NFKD')
    .replace(rCombining, '')
    .replace(/\u0458/g, 'й')
    .replace(rControl, '')
    .replace(rSpecial, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
}

/** Текст без строчной разметки: код, выделение, ссылки. */
export function plainInline(src: string): string {
  return src
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/(\*\*|__|\*|_)(.*?)\1/g, '$2')
    .replace(/\\([\\`*_{}[\]()#+\-.!|>~])/g, '$1')
    .trim()
}

/** Даёт повторяющимся якорям суффикс «-1», «-2», как это делает VitePress. */
function uniqueSlugs() {
  const seen = new Map<string, number>()
  return (slug: string) => {
    const count = seen.get(slug) ?? 0
    seen.set(slug, count + 1)
    return count === 0 ? slug : `${slug}-${count}`
  }
}

interface Parsed {
  title: string
  short: string
  kind: PageKind
  chapter: string
  description: string
  sections: Section[]
  prompts: Omit<Prompt, 'file' | 'route'>[]
  tasks: number
  isPromptIndex: boolean
}

function parse(src: string): Parsed {
  const unique = uniqueSlugs()
  const parsed: Parsed = {
    title: '',
    short: '',
    kind: 'other',
    chapter: '',
    description: '',
    sections: [],
    prompts: [],
    tasks: 0,
    isPromptIndex: false
  }

  const lines = src.replace(/\r\n/g, '\n').split('\n')
  let fence: { marker: string; length: number; prompt: string | undefined } | undefined
  let promptBody: string[] = []
  let lead = ''
  let leadDone = false

  const closeFence = (line: string) => {
    if (fence?.prompt) {
      const chapter = parsed.chapter.toLowerCase()
      const n = parsed.prompts.length + 1
      parsed.prompts.push({
        number: parsed.chapter ? `${parsed.chapter}.${n}` : String(n),
        anchor: `prompt-${chapter || 'x'}-${n}`,
        title: fence.prompt,
        body: promptBody.join('\n')
      })
    }
    fence = undefined
    promptBody = []
  }

  for (const line of lines) {
    const marker = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(line)

    if (fence) {
      if (marker && marker[1] === '' && marker[2][0] === fence.marker && marker[2].length >= fence.length && !marker[3].trim()) {
        closeFence()
      } else if (fence.prompt) {
        promptBody.push(line)
      }
      continue
    }

    if (marker) {
      const info = marker[3].trim()
      const promptLang = /^prompt(?:\s+(.*))?$/.exec(info)
      fence = { marker: marker[2][0], length: marker[2].length, prompt: undefined }
      if (promptLang) {
        fence.prompt = (promptLang[1] ?? '').trim() || 'Без названия'
      }
      continue
    }

    if (!parsed.title) {
      const h1 = /^# (.+)$/.exec(line)
      if (h1) {
        parsed.title = plainInline(h1[1])
        const chapter = /^Глава (\d+)\./.exec(parsed.title)
        const appendix = /^Приложение ([А-ЯA-Z])\./.exec(parsed.title)
        if (chapter) {
          parsed.kind = 'chapter'
          parsed.chapter = chapter[1]
          parsed.short = `Глава ${chapter[1]}`
        } else if (appendix) {
          parsed.kind = 'appendix'
          parsed.chapter = appendix[1]
          parsed.short = `Приложение ${appendix[1]}`
        } else {
          parsed.short = parsed.title
        }
      }
      continue
    }

    if (line.trim() === PROMPT_INDEX_MARKER) {
      parsed.isPromptIndex = true
      continue
    }

    if (line.trim() === '') {
      if (!leadDone && lead) {
        parsed.description = lead
        leadDone = true
      }
      continue
    }

    const heading = /^(#{2,3}) (.+)$/.exec(line)
    if (heading) {
      parsed.sections.push({
        level: heading[1].length,
        text: plainInline(heading[2]),
        slug: unique(slugify(plainInline(heading[2])))
      })
      continue
    }

    if (/^\s*[-*+] \[[ xX]\]\s/.test(line)) {
      parsed.tasks++
    }

    if (!leadDone && !line.startsWith('|') && !line.startsWith('>')) {
      lead = plainInline(line)
    }
  }

  if (!leadDone) parsed.description = lead
  return parsed
}

/** Обрезает абзац до нужной длины по границе слова. */
function shorten(text: string, limit: number): string {
  if (text.length <= limit) return text
  const cut = text.slice(0, limit)
  const space = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf('\u00a0'))
  return `${space > limit * 0.6 ? cut.slice(0, space) : cut}…`
}

/** Читает content/ и собирает из него оглавление книги. */
export function loadBook(contentDir: string): Book {
  const files = fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith('.md'))
    .sort()

  const pages: Page[] = files.map((file) => {
    const parsed = parse(fs.readFileSync(path.join(contentDir, file), 'utf8'))
    const route = file === HOME_FILE ? '/' : `/${file.replace(/\.md$/, '')}`
    return {
      file,
      route,
      ...parsed,
      description: shorten(parsed.description, 240),
      prompts: parsed.prompts.map((prompt) => ({ ...prompt, file, route }))
    }
  })

  return {
    pages,
    prompts: pages.flatMap((page) => page.prompts),
    byFile: new Map(pages.map((page) => [page.file, page])),
    chapters: pages.filter((page) => page.kind === 'chapter').length,
    appendices: pages.filter((page) => page.kind === 'appendix').length,
    promptIndex: pages.find((page) => page.isPromptIndex)
  }
}
