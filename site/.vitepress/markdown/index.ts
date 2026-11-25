import type { MarkdownRenderer } from 'vitepress'
import type { Book } from '../lib/content'
import { headingAnchors } from './anchors'
import { callouts } from './callouts'
import { promptIndex } from './prompt-index'
import { prompts } from './prompts'
import { shellTabs } from './shell-tabs'
import { tableCaptions } from './table-captions'
import { taskLists } from './task-lists'

export interface BookMarkdownOptions {
  book: Book
  /** Base сайта: ссылки в готовом HTML VitePress не переписывает. */
  base: string
}

/** Все особенности разметки книги: врезки, промпты, вкладки, чек-листы, подписи, указатель. */
export function bookMarkdown(md: MarkdownRenderer, options: BookMarkdownOptions): void {
  callouts(md)
  prompts(md, options.book)
  shellTabs(md)
  taskLists(md, options.book)
  tableCaptions(md)
  promptIndex(md, options)
  headingAnchors(md)
}
