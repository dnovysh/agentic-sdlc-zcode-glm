import type { MarkdownRenderer } from 'vitepress'
import type { Book } from '../lib/content'
import { bookState, escapeHtml } from './util'

export const COPY_TITLE = 'Копировать код'
const PROMPT_COPY_TITLE = 'Скопировать промпт'

/** Блоки «```prompt Название» — карточки с номером по книге и кнопкой копирования. */
export function prompts(md: MarkdownRenderer, book: Book): void {
  // Обёртка VitePress: подсветка и кнопка копирования у каждого блока кода.
  const fence = md.renderer.rules.fence!

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info.trim()
    if (!/^prompt(\s|$)/.test(info)) return fence(tokens, idx, options, env, self)

    const state = bookState(env, book)
    const page = state.page
    const n = ++state.prompt
    const id = `prompt-${(page?.chapter || 'x').toLowerCase()}-${n}`
    const number = page?.chapter ? `${page.chapter}.${n}` : String(n)
    const title = escapeHtml(info.replace(/^prompt\s*/, ''))

    // Языка «prompt» в подсветке нет: отдаём блок как обычный текст.
    const saved = token.info
    token.info = 'txt'
    const block = fence(tokens, idx, options, env, self)
    token.info = saved

    return (
      `<figure class="prompt-card" id="${id}">\n` +
      '<figcaption class="prompt-card-head">' +
      '<span class="prompt-card-badge">Промпт</span>' +
      `<span class="prompt-card-num">${number}</span>` +
      `<span class="prompt-card-title">${title}</span>` +
      `<a class="prompt-card-anchor" href="#${id}" aria-label="Ссылка на промпт ${number}">#</a>` +
      '</figcaption>\n' +
      decorate(block) +
      '</figure>\n'
    )
  }
}

/** Метит блок как промпт и подсвечивает места в двойных фигурных скобках. */
function decorate(block: string): string {
  const pre = block.indexOf('<pre')
  const head = block
    .slice(0, pre)
    .replace('class="language-txt', 'class="language-prompt')
    .replace(`title="${COPY_TITLE}"`, `title="${PROMPT_COPY_TITLE}"`)
  const body = block
    .slice(pre)
    .replace(/\{\{([^{}\n]+)\}\}/g, '<span class="prompt-ph">{{$1}}</span>')
  return head + body
}
