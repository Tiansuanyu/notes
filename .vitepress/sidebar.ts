import { readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DefaultTheme } from 'vitepress'

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const ignoredDirectories = new Set([
  '.git',
  '.github',
  '.vitepress',
  'node_modules',
  'public'
])

const acronyms = new Map([
  ['ai', 'AI'],
  ['api', 'API'],
  ['ba', 'BA'],
  ['cpu', 'CPU'],
  ['cuda', 'CUDA'],
  ['ddp', 'DDP'],
  ['gpu', 'GPU'],
  ['hloc', 'HLoc'],
  ['pnp', 'PnP'],
  ['slam', 'SLAM'],
  ['sql', 'SQL'],
  ['ui', 'UI']
])

interface PageInfo {
  fileName: string
  isIndex: boolean
  link: string
  order?: number
  text: string
}

export interface ContentNavigation {
  nav: DefaultTheme.NavItem[]
  sidebar: DefaultTheme.SidebarMulti
}

function humanize(value: string): string {
  return value
    .replace(/\.md$/i, '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => acronyms.get(word.toLowerCase()) ??
      `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

function unquote(value: string): string {
  const trimmed = value.trim()
  const quote = trimmed.at(0)

  if ((quote === '"' || quote === "'") && trimmed.at(-1) === quote) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed
}

function getPageInfo(filePath: string, link: string): PageInfo {
  const source = readFileSync(filePath, 'utf8')
  const frontmatterMatch = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  const frontmatter = frontmatterMatch?.[1] ?? ''
  const frontmatterTitle = frontmatter.match(/^title:\s*(.+?)\s*$/m)?.[1]
  const orderValue = frontmatter.match(/^order:\s*(-?\d+(?:\.\d+)?)\s*$/m)?.[1]
  const markdownBody = frontmatterMatch ? source.slice(frontmatterMatch[0].length) : source
  const h1 = markdownBody.match(/^#\s+(.+?)\s*$/m)?.[1]
  const fileName = relative(siteRoot, filePath).replaceAll('\\', '/')
  const isIndex = basename(filePath).toLowerCase() === 'index.md'

  return {
    fileName,
    isIndex,
    link,
    order: orderValue === undefined ? undefined : Number(orderValue),
    text: frontmatterTitle
      ? unquote(frontmatterTitle)
      : h1?.trim() || humanize(basename(filePath))
  }
}

function comparePages(a: PageInfo, b: PageInfo): number {
  if (a.isIndex !== b.isIndex) return a.isIndex ? -1 : 1

  const aOrder = a.order ?? Number.POSITIVE_INFINITY
  const bOrder = b.order ?? Number.POSITIVE_INFINITY

  if (aOrder !== bOrder) return aOrder - bOrder
  return a.fileName.localeCompare(b.fileName, 'en')
}

function isContentDirectory(name: string): boolean {
  return !name.startsWith('.') && !ignoredDirectories.has(name)
}

function containsMarkdown(directory: string): boolean {
  return readdirSync(directory, { withFileTypes: true }).some((entry) => {
    const entryPath = resolve(directory, entry.name)
    return entry.isDirectory() && isContentDirectory(entry.name)
      ? containsMarkdown(entryPath)
      : entry.isFile() && extname(entry.name).toLowerCase() === '.md'
  })
}

function buildItems(
  directory: string,
  routePrefix: string,
  includeIndex = true
): DefaultTheme.SidebarItem[] {
  const entries = readdirSync(directory, { withFileTypes: true })
  const pages = entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === '.md')
    .filter((entry) => includeIndex || entry.name.toLowerCase() !== 'index.md')
    .map((entry) => {
      const stem = entry.name.replace(/\.md$/i, '')
      const link = stem.toLowerCase() === 'index' ? `${routePrefix}/` : `${routePrefix}/${stem}`
      return getPageInfo(resolve(directory, entry.name), link)
    })
    .sort(comparePages)
    .map(({ text, link }) => ({ text, link }))

  const groups = entries
    .filter((entry) => entry.isDirectory() && isContentDirectory(entry.name))
    .filter((entry) => containsMarkdown(resolve(directory, entry.name)))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .map((entry) => {
      const childDirectory = resolve(directory, entry.name)
      const childRoute = `${routePrefix}/${entry.name}`
      const hasIndex = readdirSync(childDirectory, { withFileTypes: true }).some(
        (child) => child.isFile() && child.name.toLowerCase() === 'index.md'
      )

      return {
        text: humanize(entry.name),
        ...(hasIndex ? { link: `${childRoute}/` } : {}),
        collapsed: false,
        // The group's title links to index.md, so do not duplicate that route
        // as a child item. All deeper directories are handled recursively.
        items: buildItems(childDirectory, childRoute, false)
      }
    })

  return [...pages, ...groups]
}

export function createContentNavigation(): ContentNavigation {
  const categories = readdirSync(siteRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => isContentDirectory(entry.name))
    .filter((entry) => containsMarkdown(resolve(siteRoot, entry.name)))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))

  const nav: DefaultTheme.NavItem[] = categories.map((category) => ({
    text: humanize(category.name),
    link: `/${category.name}/`
  }))

  const sidebar: DefaultTheme.SidebarMulti = Object.fromEntries(
    categories.map((category) => [
      `/${category.name}/`,
      [
        {
          text: humanize(category.name),
          items: buildItems(resolve(siteRoot, category.name), `/${category.name}`)
        }
      ]
    ])
  )

  return { nav, sidebar }
}
