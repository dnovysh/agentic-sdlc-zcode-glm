import type { MarkdownRenderer } from 'vitepress'
import type { Book } from '../lib/content'
import { bookState, escapeHtml, hashKey } from './util'

/**
 * Пункты вида «- [ ] …» — чек-листы глав. Ключ каждого пункта не зависит от
 * его позиции в тексте, поэтому отметки переживают правки в книге.
 */
export function taskLists(md: MarkdownRenderer, book: Book): void {
  md.core.ruler.after('inline', 'book-task-lists', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const item = tokens[i]
      if (item.type !== 'list_item_open') continue
      const inline = tokens[i + 1]?.type === 'paragraph_open' ? tokens[i + 2] : tokens[i + 1]
      if (inline?.type !== 'inline' || !inline.children) continue
      const lead = /^\[([ xX])\]\s+/.exec(inline.content)
      if (!lead) continue

      inline.content = inline.content.slice(lead[0].length)
      const first = inline.children[0]
      if (first.type === 'text') first.content = first.content.slice(lead[0].length)

      const page = bookState(state.env, book).page
      const box = new state.Token('html_inline', '', 0)
      box.content =
        '<input class="task-checkbox" type="checkbox" ' +
        `data-key="${escapeHtml(page?.route ?? '')}#${hashKey(inline.content.trim())}"` +
        `${lead[1] === ' ' ? '' : ' checked'}>`
      inline.children.unshift(box)

      item.attrJoin('class', 'task-list-item')
      const list = tokens.findLast(
        (token, j) =>
          j < i &&
          (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') &&
          token.level === item.level - 1
      )
      list?.attrJoin('class', 'contains-task-list')
    }
  })
}
