import type { MarkdownRenderer } from 'vitepress'
import { PROMPT_INDEX_MARKER, type Book } from '../lib/content'
import { escapeHtml } from './util'

/** Заменяет заглушку в приложении В указателем всех промптов книги. */
export function promptIndex(md: MarkdownRenderer, options: { book: Book; base: string }): void {
  md.core.ruler.after('block', 'book-prompt-index', (state) => {
    for (const token of state.tokens) {
      if (token.type === 'html_block' && token.content.trim() === PROMPT_INDEX_MARKER) {
        token.type = 'book_prompt_index'
      }
    }
  })

  md.renderer.rules.book_prompt_index = () => renderIndex(options)
}

function renderIndex({ book, base }: { book: Book; base: string }): string {
  // Ссылки в готовом HTML VitePress не переписывает — base добавляем сами.
  const link = (route: string) => base.replace(/\/$/, '') + route

  const rows = book.prompts.map((prompt) => {
    const page = book.byFile.get(prompt.file)!
    const haystack = escapeHtml(`${prompt.number} ${prompt.title} ${page.title}`.toLowerCase())
    return (
      `<tr data-search="${haystack}">` +
      `<td class="prompt-index-num">${prompt.number}</td>` +
      `<td><a class="prompt-index-link" href="${link(page.route)}#${prompt.anchor}">${escapeHtml(prompt.title)}</a></td>` +
      `<td><a class="prompt-index-page" href="${link(page.route)}">${escapeHtml(page.short)}</a></td>` +
      `<td><button type="button" class="prompt-copy" data-copy="${escapeHtml(prompt.body)}">Копировать</button></td>` +
      '</tr>\n'
    )
  })

  return (
    '<div class="prompt-index">\n' +
    '<input class="prompt-index-filter" type="search" placeholder="Найти промпт" ' +
    'aria-label="Поиск по промптам" autocomplete="off" spellcheck="false">\n' +
    '<p class="prompt-index-empty" hidden>По запросу ничего не найдено.</p>\n' +
    '<table class="prompt-index-table">\n' +
    '<thead><tr><th>№</th><th>Промпт</th><th>Где</th><th aria-label="Копировать"></th></tr></thead>\n' +
    `<tbody>\n${rows.join('')}</tbody>\n` +
    '</table>\n</div>\n'
  )
}
