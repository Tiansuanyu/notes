# Tiansuanyu's Notes

一个以仓库根目录为内容目录、使用 VitePress Default Theme 构建的个人技术笔记站点。

## 本地写笔记

需要 Node.js 22 或更高版本，推荐使用仓库 `.nvmrc` 指定的 Node.js 24。

```bash
npm install
npm run docs:dev
```

开发服务器默认运行在 <http://localhost:5173>。生产构建和本地预览分别使用：

```bash
npm run docs:build
npm run docs:preview
```

## 新建笔记

直接在分类目录中创建 Markdown，例如：

```text
slam/new-topic.md
```

写好 Markdown 后，下一次构建会自动生成页面和侧边栏，无需修改 `.vitepress/config.mts`。上面的文件对应站点中的 `/notes/slam/new-topic` 路由。开发服务器运行期间新建文件后，如果侧边栏没有立即刷新，重启一次 `npm run docs:dev` 即可。

侧边栏标题按以下顺序读取：

1. frontmatter 的 `title`
2. 页面中的第一个 `# H1`
3. 由文件名转换出的标题

页面顺序为 `index.md` 优先，其余页面先按可选的 `order`，再按文件名稳定排序：

```yaml
---
title: Bundle Adjustment
order: 30
---
```

## 新增分类

直接在仓库根目录创建目录并加入 Markdown，例如：

```text
computer-vision/
├── index.md
└── feature-matching.md
```

下一次构建会自动把它识别为顶部导航和独立侧边栏。`node_modules`、`.vitepress`、`.github`、`.git` 和 `public` 不会被识别为内容分类。

分类中还可以继续创建任意层级的子目录。子目录会递归生成侧边栏分组；如果子目录包含 `index.md`，分组标题会链接到该入口页。隐藏目录（例如 `.assets`）和不包含 Markdown 的资源目录不会出现在侧边栏中。

## 发布

```bash
git add .
git commit -m "add SLAM notes"
git push
```

推送到 `main` 后，GitHub Actions 会自动构建并部署到 <https://tiansuanyu.github.io/notes/>。

首次发布前需要在 GitHub 仓库网页中进行一次设置：

```text
Repository → Settings → Pages → Build and deployment → Source → GitHub Actions
```

## 数学公式

行内公式使用 `$...$`，块公式使用 `$$...$$`。站点通过 VitePress 官方支持的 MathJax 集成渲染公式。

## Mermaid（TODO）

当前没有加入 Mermaid，以避免为默认主题引入额外插件和较大的前端依赖。需要流程图时，可后续评估 `vitepress-plugin-mermaid` 与当前 VitePress 版本的兼容性，再安装并在 `.vitepress/config.mts` 中启用。
