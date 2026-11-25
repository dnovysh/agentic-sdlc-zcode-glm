import path from 'node:path'
import type { MarkdownEnv } from 'vitepress'
import type Token from 'markdown-it/lib/token.mjs'
import type { Book, Page } from '../lib/content'

interface BookState {
  page: Page | undefined
  /** Счётчики на текущей странице: номера промптов и вкладок. */
  prompt: number
  tab: number
}

type BookEnv = MarkdownEnv & { book?: BookState }

/** Состояние рендера одной страницы: к какой главе она относится и что уже выведено. */
export function bookState(env: MarkdownEnv, book: Book): BookState {
  const own = env as BookEnv
  own.book ??= {
    page: book.byFile.get(path.basename(env.path ?? '')),
    prompt: 0,
    tab: 0
  }
  return own.book
}

/** Убирает начало строки из первых текстовых узлов и обрезает пустый остаток. */
/** Парный закрывающий тег на том же уровне вложенности. */
export function matchingClose(tokens: Token[], open: number, type: string): number {
  const level = tokens[open].level
  return tokens.findIndex((token, i) => i > open && token.type === type && token.level === level)
}

export function stripLead(children: Token[], lead: string): void {
  let rest = lead
  for (const child of children) {
    if (child.type !== 'text') break
    if (child.content.length < rest.length) {
      rest = rest.slice(child.content.length)
      child.content = ''
      continue
    }
    child.content = child.content.slice(rest.length)
    break
  }

  while (children.length) {
    const first = children[0]
    if (first.type === 'softbreak' || (first.type === 'text' && !first.content.trim())) {
      children.shift()
    } else {
      break
    }
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Короткий стабильный ключ для хранения состояния пункта чек-листа. */
export function hashKey(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}
