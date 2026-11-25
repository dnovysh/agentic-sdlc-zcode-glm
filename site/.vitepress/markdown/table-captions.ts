import type { MarkdownRenderer } from 'vitepress'
import { matchingClose, stripLead } from './util'

/** Подпись «Таблица: …», которая в книге идёт строкой после таблицы, становится настоящей подписью. */
export function tableCaptions(md: MarkdownRenderer): void {
  const openTable = md.renderer.rules.table_open!
  const closeTable = md.renderer.rules.table_close

  // В конец цепочки: абзац можно вырезать из потока только после того,
  // как markdown-it разобрал его на токены, иначе подпись останется пустой.
  md.core.ruler.push('book-table-captions', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const open = tokens[i]
      if (open.type !== 'table_open') continue
      const end = matchingClose(tokens, i, 'table_close')
      const inline = tokens[end + 2]
      if (tokens[end + 1]?.type !== 'paragraph_open' || inline?.type !== 'inline' || !inline.children?.length) {
        continue
      }
      const lead = /^Таблица:\s*/.exec(inline.content)
      if (!lead) continue

      stripLead(inline.children, lead[0])
      open.meta = { ...open.meta, caption: inline.children }
      tokens.splice(end + 1, 3)
    }
  })

  md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    const body = openTable(tokens, idx, options, env, self)
    return tokens[idx].meta?.caption ? `<figure class="table-figure">\n${body}` : body
  }

  md.renderer.rules.table_close = (tokens, idx, options, env, self) => {
    const body = closeTable ? closeTable(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
    const open = tokens.findLast((token, i) => i < idx && token.type === 'table_open')
    if (!open?.meta?.caption) return body
    const caption = md.renderer.renderInline(open.meta.caption, options, env)
    return `${body}<figcaption class="table-caption">${caption}</figcaption>\n</figure>\n`
  }
}
