import type MarkdownIt from 'markdown-it'

/** Convert Mermaid fences into a client-side component while leaving every
 * other fenced code block to VitePress/Shiki. */
export function mermaidMarkdownPlugin(md: MarkdownIt): void {
  const defaultFence = md.renderer.rules.fence

  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index]
    const language = token.info.trim().split(/\s+/, 1)[0].toLowerCase()

    if (language === 'mermaid') {
      const code = md.utils.escapeHtml(token.content.trim())
      return `<mermaid-diagram code="${code}"></mermaid-diagram>\n`
    }

    return defaultFence
      ? defaultFence(tokens, index, options, env, self)
      : self.renderToken(tokens, index, options)
  }
}
