import type { MarkdownRenderer } from 'vitepress'
import { matchingClose } from './util'

const ICON =
  '<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'

/** Какая врезка книги какой смысл несёт. */
const KINDS: Record<string, string> = {
  'Важно': 'important',
  'Совет': 'tip',
  'Осторожно': 'danger',
  'На заметку': 'note'
}

const ICONS: Record<string, string> = {
  important: `${ICON}<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
  tip: `${ICON}<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  danger: `${ICON}<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  note: `${ICON}<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
}

/** Врезки книги — цитаты вида «> Важно. …» — превращает в оформленные блоки. */
export function callouts(md: MarkdownRenderer): void {
  md.core.ruler.after('block', 'book-callouts', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const open = tokens[i]
      if (open.type !== 'blockquote_open') continue
      const inline = tokens[i + 1]?.type === 'paragraph_open' ? tokens[i + 2] : tokens[i + 1]
      if (inline?.type !== 'inline') continue
      const lead = /^(Важно|Совет|Осторожно|На заметку)\.\s/.exec(inline.content)
      if (!lead) continue

      const meta = { kind: KINDS[lead[1]], label: lead[1] }
      open.meta = { ...open.meta, ...meta }
      const close = matchingClose(tokens, i, 'blockquote_close')
      tokens[close].meta = { ...tokens[close].meta, ...meta }
      inline.content = inline.content.slice(lead[0].length)
    }
  })

  md.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
    const { kind, label } = tokens[idx].meta ?? {}
    if (!kind) return self.renderToken(tokens, idx, options)
    return (
      `<div class="callout callout-${kind}" role="note">\n` +
      `<p class="callout-title">${ICONS[kind]}<span>${label}</span></p>\n` +
      '<div class="callout-body">\n'
    )
  }

  md.renderer.rules.blockquote_close = (tokens, idx, options, env, self) =>
    tokens[idx].meta?.kind ? '</div>\n</div>\n' : self.renderToken(tokens, idx, options)
}
