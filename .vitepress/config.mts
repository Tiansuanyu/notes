import { defineConfig } from 'vitepress'
import { createContentNavigation } from './sidebar.ts'

const { nav, sidebar } = createContentNavigation()

export default defineConfig({
  lang: 'zh-CN',
  title: "Tiansuanyu's Notes",
  description: 'Robotics、SLAM、AI Infra 与 Systems 技术笔记',
  base: '/notes/',
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['README.md'],

  markdown: {
    math: true,
    lineNumbers: true
  },

  themeConfig: {
    nav,
    sidebar,
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Tiansuanyu/notes' }
    ]
  }
})
