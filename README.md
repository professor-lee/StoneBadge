<h1 align="center"><img src="./logo.svg" alt="Stone Badge logo" /></h1>

<h1 align="center">Stone Badge - GitHub Stone Badge Generator</h1>

<p align="center">
	<a href="README_zh.md">简体中文</a>
	&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
	<span> >English< </span>
</p>

## Project Overview

Stone Badge is a Node.js service that generates a 3D stone badge SVG from the latest commit SHA of a GitHub repository. It reads the repository's newest commit, turns the short SHA into unique colors, gradients, and glow effects, and returns an SVG badge that can be embedded directly into a README.
## Usage Address

- Live demo: <https://stone.professorlee.work>
- Repository: <https://github.com/professor-lee/StoneBadge>

## Features

- Generate a stone badge from any GitHub repository URL
- Auto-color the SVG from the latest commit SHA, so every repository gets a distinct result
- Preview the badge in the browser and copy Markdown, HTML, or a direct link with one click
- Support `POST /api/generate` to parse repository URLs and return badge metadata
- Support `GET /api/stone/:owner/:repo` to return the SVG badge directly
- Support automatic template generation and manual template upload through `POST /api/template`
- Keep the frontend static, with low deployment and maintenance overhead

## Tech Stack

- Node.js 18+
- Express
- Three.js
- JSDOM
- Native fetch
- HTML, CSS, JavaScript

## Usage

1. Open <https://stone.professorlee.work>
2. Enter a GitHub repository URL, such as <https://github.com/professor-lee/StoneBadge>
3. Click Generate Badge
4. Copy the Markdown, HTML, or direct link into a README, document, or website

Example Markdown:

```md
![Stone Badge](https://stone.professorlee.work/api/stone/professor-lee/StoneBadge)
```

## Deployment Instructions

See [DeploymentInstructions.md](DeploymentInstructions.md) for the full deployment guide.

## Demo Examples

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