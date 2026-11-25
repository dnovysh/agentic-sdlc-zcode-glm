import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type DefaultTheme } from 'vitepress'
import { favicon } from './lib/favicon'
import { HOME_FILE, loadBook, slugify } from './lib/content'
import { normalizeTerm, tokenize } from './lib/search'
import { siteBookData } from './lib/site-data'
import { shellScript } from './lib/storage'
import { bookMarkdown } from './markdown'
import { COPY_TITLE } from './markdown/prompts'

// Название книги — как в README и prompts.md; в content/ оно отдельной строкой не встречается.
const BOOK_TITLE = 'Agentic SDLC в ZCode и GLM 5.x'
const base = '/agentic-sdlc-zcode-glm/'
const origin = 'https://dnovysh.github.io'
const repo = 'https://github.com/dnovysh/agentic-sdlc-zcode-glm'
const pdf = `${repo}/blob/main/agentic-sdlc-zcode-glm.pdf`

/** content/ лежит в корне репозитория, а конфиг — в site/.vitepress/. */
function locateRepoRoot(): string {
  const fromConfig = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
  return fs.existsSync(path.join(fromConfig, 'content')) ? fromConfig : process.cwd()
}

const repoRoot = locateRepoRoot()
const book = loadBook(path.join(repoRoot, 'content'))

const home = book.byFile.get(HOME_FILE)
if (!home) throw new Error(`В content/ нет файла ${HOME_FILE} — главной страницы книги.`)

const start = book.pages[book.pages.indexOf(home) + 1]

const nav: DefaultTheme.NavItem[] = [{ text: 'Читать', link: start?.route ?? '/' }]
if (book.promptIndex) nav.push({ text: 'Промпты', link: book.promptIndex.route })

const sidebar: DefaultTheme.SidebarItem[] = [
  {
    // Все главы в одной группе: иначе VitePress выносит пункты без подразделов в отдельную.
    items: book.pages.map((page) => {
      const sections = page.sections
        .filter((section) => section.level === 2)
        .map((section) => ({ text: section.text, link: `${page.route}#${section.slug}` }))
      return sections.length
        ? { text: page.title, link: page.route, collapsed: true, items: sections }
        : { text: page.title, link: page.route }
    })
  }
]

export default defineConfig({
  lang: 'ru',
  title: BOOK_TITLE,
  description: home.description,
  base,
  // Главы не копируются: content/ подключён напрямую и остаётся единственным источником текста.
  srcDir: '../content',
  cleanUrls: true,
  rewrites: { [HOME_FILE]: 'index.md' },
  lastUpdated: true,
  sitemap: { hostname: origin },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: favicon }],
    ['script', { id: 'book-shell' }, shellScript]
  ],

  markdown: {
    codeCopyButtonTitle: COPY_TITLE,
    // Якоря — те же, что считает меню: с сохранённой «й».
    anchor: { slugify },
    headers: { slugify },
    config: (md) => bookMarkdown(md, { book, base })
  },

  transformPageData: (pageData) => {
    const page = book.byFile.get(path.basename(pageData.filePath))
    if (!page) throw new Error(`Страница ${pageData.relativePath} лежит вне content/.`)

    if (!pageData.description) pageData.description = page.description

    // Меню ссылается на якоря, посчитанные сканером. Если они ушли от настоящих,
    // сборка падает здесь, а не битыми ссылками на сайте.
    const rendered = (pageData.headers ?? [])
      .filter((header) => header.level === 2)
      .map((header) => header.slug)
    const planned = page.sections
      .filter((section) => section.level === 2)
      .map((section) => section.slug)
    if (rendered.join('\n') !== planned.join('\n')) {
      throw new Error(
        `Якоря разделов разошлись с меню в ${page.file}:\n  в тексте: ${rendered.join(', ')}\n  в меню:   ${planned.join(', ')}`
      )
    }
  },

  themeConfig: {
    siteTitle: 'Agentic SDLC',
    notFound: {
      title: 'Страницы нет',
      quote: 'Такой страницы в книге нет. Возможно, её переименовали — начните с оглавления.',
      linkLabel: 'На главную',
      linkText: 'Вернуться к книге'
    },
    nav,
    sidebar,

    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: { buttonText: 'Поиск', buttonAriaLabel: 'Поиск по книге' },
          modal: {
            displayDetails: 'Подробнее',
            resetButtonTitle: 'Очистить запрос',
            backButtonTitle: 'Назад',
            noResultsText: 'Ничего не найдено',
            footer: {
              selectText: 'выбрать',
              selectKeyAriaLabel: 'enter',
              navigateText: 'переключить',
              navigateUpKeyAriaLabel: 'стрелка вверх',
              navigateDownKeyAriaLabel: 'стрелка вниз',
              closeText: 'закрыть',
              closeKeyAriaLabel: 'escape'
            }
          }
        },
        miniSearch: { options: { tokenize, processTerm: normalizeTerm } }
      }
    },

    outline: { level: [2, 3], label: 'В этой главе' },
    docFooter: { prev: 'Назад', next: 'Дальше' },
    sidebarMenuLabel: 'Оглавление',
    returnToTopLabel: 'Наверх',
    darkModeSwitchLabel: 'Тема',
    lightModeSwitchTitle: 'Светлая тема',
    darkModeSwitchTitle: 'Тёмная тема',
    // Дата обновления — по-русски и без времени; иначе она форматируется по локали браузера.
    lastUpdated: { text: 'Обновлено', formatOptions: { dateStyle: 'long', forceLocale: true } },
    socialLinks: [{ icon: 'github', link: repo }],

    book: siteBookData(book, { title: BOOK_TITLE, pdf, repo })
  }
})
