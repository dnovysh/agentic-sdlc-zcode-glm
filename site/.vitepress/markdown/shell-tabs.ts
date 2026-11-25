import type { MarkdownRenderer } from 'vitepress'
import type Token from 'markdown-it/lib/token.mjs'
import { bookState } from './util'

type Shell = 'bash' | 'powershell'

const SHELLS: Record<string, Shell> = {
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  powershell: 'powershell',
  pwsh: 'powershell',
  ps1: 'powershell'
}

const LABEL: Record<Shell, string> = {
  bash: 'Bash',
  powershell: 'PowerShell'
}

function shellOf(token: Token): Shell | undefined {
  return SHELLS[token.info.trim().split(/\s+/)[0]]
}

/**
 * Пара соседних блоков «Bash, затем PowerShell» превращается во вкладки:
 * книга даёт команды для двух систем, а показывать читателю нужна одну.
 */
export function shellTabs(md: MarkdownRenderer): void {
  const fence = md.renderer.rules.fence!

  md.core.ruler.after('block', 'book-shell-tabs', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token.type !== 'fence' || shellOf(token) !== 'bash') continue
      const next = tokens[i + 1]
      if (next?.type !== 'fence' || shellOf(next) !== 'powershell') continue
      token.meta = { ...token.meta, pair: next }
      tokens.splice(i + 1, 1)
    }
  })

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const pair = token.meta?.pair as Token | undefined
    if (!pair) return fence(tokens, idx, options, env, self)

    const id = `shell-${++bookState(env).tab}`
    const tab = (shell: Shell, active: boolean) =>
      `<button type="button" class="shell-tab" role="tab" id="${id}-${shell}" ` +
      `aria-controls="${id}-${shell}-panel" aria-selected="${active}" tabindex="${active ? 0 : -1}" ` +
      `data-shell-tab="${shell}">${LABEL[shell]}</button>`
    const panel = (shell: Shell, tok: Token) =>
      `<div class="shell-panel" role="tabpanel" id="${id}-${shell}-panel" ` +
      `aria-labelledby="${id}-${shell}" data-shell-panel="${shell}">${fence([tok], 0, options, env, self)}</div>`

    return (
      '<div class="shell-tabs">\n' +
      `<div class="shell-tabs-bar" role="tablist" aria-label="Оболочка для команды">${tab('bash', true)}${tab('powershell', false)}</div>\n` +
      `${panel('bash', token)}\n${panel('powershell', pair)}\n` +
      '</div>\n'
    )
  }
}
