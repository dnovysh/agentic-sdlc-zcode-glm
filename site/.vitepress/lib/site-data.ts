import { HOME_FILE, type Book, type PageKind } from './content'
import type { DefaultTheme } from 'vitepress'

/** Данные книги, которые уходят на клиент: обложка и ссылки «предложить правку». */
export interface BookSiteData {
  title: string
  pages: BookSitePage[]
  chapters: number
  appendices: number
  prompts: number
  /** Ссылка на PDF книги в репозитории. */
  pdf: string
  repo: string
  /** С какой страницы начинается чтение — следующая за главной. */
  start: string
  /** Страница с указателем промптов, если в книге есть такая. */
  promptsPage?: string
}

export interface BookSitePage {
  route: string
  /** Файл главы в content/. */
  file: string
  title: string
  /** «Глава 1», «Приложение А». */
  short: string
  kind: PageKind
  prompts: number
}

declare module 'vitepress' {
  namespace DefaultTheme {
    interface Config {
      book?: BookSiteData
    }
  }
}

export function siteBookData(book: Book, options: { title: string; pdf: string; repo: string }): BookSiteData {
  const home = book.byFile.get(HOME_FILE)
  if (!home) throw new Error(`В content/ нет файла ${HOME_FILE} — главной страницы книги.`)

  return {
    title: options.title,
    pages: book.pages.map((page) => ({
      route: page.route,
      file: page.file,
      title: page.title,
      short: page.short,
      kind: page.kind,
      prompts: page.prompts.length
    })),
    chapters: book.chapters,
    appendices: book.appendices,
    prompts: book.prompts.length,
    pdf: options.pdf,
    repo: options.repo,
    start: book.pages[book.pages.indexOf(home) + 1]?.route ?? '/',
    promptsPage: book.promptIndex?.route
  }
}
