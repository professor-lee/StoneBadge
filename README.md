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
- **Configurable generation** on the web UI: animation frame count, projection fineness (minimum triangle area), mesh decimation (Three.js `SimplifyModifier`), and one-loop animation duration
- Server-side **template cache** under `templates/cache/` (one SVG file per parameter set; first request or `POST /api/generate` may trigger generation)
- Support `POST /api/generate` to parse repository URLs, optional generation options, and return badge metadata plus a URL that encodes those options
- Support `GET /api/stone/:owner/:repo` with query parameters for the same generation options
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
2. (Optional) Adjust **generation parameters**: rotation frame count, projection fineness, mesh decimation level, and animation duration
3. Enter a GitHub repository URL, such as <https://github.com/professor-lee/StoneBadge>
4. Click **Generate Badge**
5. Copy the Markdown, HTML, or direct link into a README, document, or website

The copied badge URL includes query parameters (`f`, `a`, `s`, `d`) so the same visual settings apply when the image is loaded. Omitting them falls back to the server defaults (see API section below).

Example Markdown (default parameters):

```md
![Stone Badge](https://stone.professorlee.work/api/stone/professor-lee/StoneBadge)
```

Example with explicit parameters:

```md
![Stone Badge](https://stone.professorlee.work/api/stone/professor-lee/StoneBadge?f=16&a=1.2&s=0&d=10)
```

## API (summary)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/generate` | JSON body: `repoUrl` (required), plus optional `frameCount`, `minFaceArea`, `simplifyCollapses`, `animDuration`. Returns `badgeUrl` with query string. |
| `GET` | `/api/stone/:owner/:repo` | Returns colored SVG. Query: `f` (frames), `a` (min face area), `s` (decimation iterations), `d` (seconds per loop). Aliases: `frames`, `minArea`, `simplify`, `animDuration`. |

## Deployment

See [DeploymentInstructions.md](DeploymentInstructions.md) for environment variables, disk layout, and the full API reference.

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