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
- 支持 `POST /api/generate` 解析仓库链接并返回徽章信息
- 支持 `GET /api/stone/:owner/:repo` 直接输出 SVG 徽章
- 支持模板自动生成与手动上传 `POST /api/template`
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
2. 在输入框中填写 GitHub 仓库地址，例如 <https://github.com/professor-lee/StoneBadge>
3. 点击“生成徽章”
4. 复制 Markdown、HTML 或直接链接，粘贴到 README、文档或网站中

示例 Markdown：

```md
![Stone Badge](https://stone.professorlee.work/api/stone/professor-lee/StoneBadge)
```

## 部署说明

完整部署步骤请参考 [DeploymentInstructions_zh.md](DeploymentInstructions_zh.md)。

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