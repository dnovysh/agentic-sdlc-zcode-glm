import type { MarkdownRenderer } from 'vitepress'

/**
 * Ссылки-якоря у заголовков VitePress подписывает по-английски
 * («Permalink to …»). Подписываем по-русски ещё при сборке, чтобы правильно
 * было и в статическом HTML, а не только после запуска скриптов.
 */
export function headingAnchors(md: MarkdownRenderer): void {
  md.core.ruler.push('book-heading-anchors', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'heading_open') continue
      const children = tokens[i + 1]?.children
      if (!children) continue

      // Заголовок выглядит как «Текст … <a class="header-anchor">».
      const title: string[] = []
      let anchor
      for (const child of children) {
        const isAnchor =
          child.type === 'link_open' &&
          (child.attrGet('class') ?? '').split(' ').includes('header-anchor')
        if (isAnchor) {
          anchor = child
          break
        }
        if (child.type === 'text' || child.type === 'code_inline') title.push(child.content)
      }
      anchor?.attrSet('aria-label', `Ссылка на раздел «${title.join('').trim()}»`)
    }
  })
}
