<h1 align="center"><img src="./logo.svg" alt="Stone Badge logo" /></h1>

<h1 align="center">Stone Badge - 石墩子徽章</h1>

<p align="center">
	<a href="README.md">English</a>
	&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
	<span> >简体中文< </span>
</p>

## 项目概述

Stone Badge 是一个基于 GitHub 仓库最近一次提交 SHA 生成 3D 石墩子 SVG 徽章的 Node.js 服务。它会读取仓库最新提交记录，把短 SHA 转换为独一无二的颜色、渐变和发光效果，并输出可直接嵌入 README 的 SVG 徽章。
## 使用地址

- 演示站点：<https://stone.professorlee.work>
- 项目仓库：<https://github.com/professor-lee/StoneBadge>

## 功能

- 输入 GitHub 仓库地址即可生成对应的石墩子徽章
- 基于最新 commit SHA 自动着色，每个仓库都会得到不同的 SVG 结果
- 提供网页预览，并可一键复制 Markdown、HTML 和直接链接
- **网页可配置生成参数**：旋转动画帧数、投影精细度（最小三角形面积）、网格减面（Three.js `SimplifyModifier`）、单圈动画时长
- 服务端将无着色模板按参数缓存在 **`templates/cache/`**（每组参数对应一个 SVG；首次请求或调用 `POST /api/generate` 时会生成）
- 支持 `POST /api/generate`：解析仓库链接，可选传入生成参数，返回带查询串的 `badgeUrl`
- 支持 `GET /api/stone/:owner/:repo`：通过查询参数指定与上文一致的生成选项并返回着色后的 SVG
- 前端为纯静态页面，部署和维护成本较低

## 技术栈

- Node.js 18+
- Express
- Three.js
- JSDOM
- 原生 fetch
- HTML、CSS、JavaScript

## 使用说明

1. 打开 <https://stone.professorlee.work>
2. （可选）在「生成参数」中调整：动画帧数、投影精细度、网格减面、单圈动画时长
3. 在输入框中填写 GitHub 仓库地址，例如 <https://github.com/professor-lee/StoneBadge>
4. 点击「生成徽章」
5. 复制 Markdown、HTML 或直接链接，粘贴到 README、文档或网站中

复制出的徽章链接会带上查询参数（`f`、`a`、`s`、`d`），以便嵌入图片时仍使用同一套视觉效果。省略参数时使用服务端默认值（见下文 API 摘要）。

示例 Markdown（默认参数）：

```md
![Stone Badge](https://stone.professorlee.work/api/stone/professor-lee/StoneBadge)
```

显式带参数的示例：

```md
![Stone Badge](https://stone.professorlee.work/api/stone/professor-lee/StoneBadge?f=16&a=1.2&s=0&d=10)
```

## API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/generate` | JSON：`repoUrl`（必填），可选 `frameCount`、`minFaceArea`、`simplifyCollapses`、`animDuration`。返回 `badgeUrl`（含查询串）等。 |
| `GET` | `/api/stone/:owner/:repo` | 返回着色后的 SVG。查询参数：`f` 帧数、`a` 最小三角面积、`s` 减面折叠次数、`d` 单圈秒数。兼容别名 `frames`、`minArea`、`simplify`、`animDuration`。 |

## 部署说明

完整部署步骤、环境变量与磁盘目录说明见 [DeploymentInstructions_zh.md](DeploymentInstructions_zh.md)。

## 演示示例

### StoneBadge
> <https://github.com/professor-lee/StoneBadge>

![Stone Badge](https://stone.professorlee.work/api/stone/professor-lee/StoneBadge)

### CNMPlayer
> <https://github.com/professor-lee/CNMPlayer>

![Stone Badge](https://stone.professorlee.work/api/stone/professor-lee/CNMPlayer)

### TMPlayer
> <https://github.com/professor-lee/TMPlayer>

![Stone Badge](https://stone.professorlee.work/api/stone/professor-lee/TMPlayer)

### Next.js
> <https://github.com/vercel/next.js>

![Stone Badge](https://stone.professorlee.work/api/stone/vercel/next.js)

### Node.js
> <https://github.com/nodejs/node>

![Stone Badge](https://stone.professorlee.work/api/stone/nodejs/node)

### VS Code
> <https://github.com/microsoft/vscode>

![Stone Badge](https://stone.professorlee.work/api/stone/microsoft/vscode)

### Vue.js Core
> <https://github.com/vuejs/core>

![Stone Badge](https://stone.professorlee.work/api/stone/vuejs/core)

### TensorFlow
> <https://github.com/tensorflow/tensorflow>

![Stone Badge](https://stone.professorlee.work/api/stone/tensorflow/tensorflow)

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=professor-lee/StoneBadge&type=date&legend=top-left)](https://www.star-history.com/?repos=professor-lee%2FStoneBadge&type=date&legend=top-left)