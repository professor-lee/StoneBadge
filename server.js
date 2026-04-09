import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  generateTemplate,
  clampGenerateOptions,
  DEFAULT_GENERATE_OPTIONS
} from './lib/template-generator.js';
import { colorizeSVG } from './lib/colorizer.js';
import { getRepoShortSHA } from './lib/github.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TEMPLATE_DIR = path.join(__dirname, 'templates');
const TEMPLATE_CACHE_DIR = path.join(TEMPLATE_DIR, 'cache');

function hashGenerateOptions(opts) {
  const payload = JSON.stringify({
    frameCount: opts.frameCount,
    minFaceArea: opts.minFaceArea,
    simplifyCollapses: opts.simplifyCollapses,
    animDuration: opts.animDuration
  });
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 24);
}

function templatePathForOptions(opts) {
  return path.join(TEMPLATE_CACHE_DIR, `stone-${hashGenerateOptions(opts)}.svg`);
}

/** 确保指定参数对应的模板 SVG 已生成，返回文件路径 */
async function ensureTemplateForOptions(opts) {
  const merged = clampGenerateOptions(opts);
  if (!fs.existsSync(TEMPLATE_CACHE_DIR)) {
    fs.mkdirSync(TEMPLATE_CACHE_DIR, { recursive: true });
  }
  const outPath = templatePathForOptions(merged);
  if (!fs.existsSync(outPath)) {
    await generateTemplate(outPath, merged);
  }
  return outPath;
}

function buildStoneQuery(opts) {
  const o = clampGenerateOptions(opts);
  const q = new URLSearchParams();
  q.set('f', String(o.frameCount));
  q.set('a', String(o.minFaceArea));
  q.set('s', String(o.simplifyCollapses));
  q.set('d', String(o.animDuration));
  return q.toString();
}

function parseStoneQuery(query) {
  return clampGenerateOptions({
    frameCount: query.f ?? query.frames,
    minFaceArea: query.a ?? query.minArea,
    simplifyCollapses: query.s ?? query.simplify,
    animDuration: query.d ?? query.animDuration
  });
}

// 提供模型文件给前端模板生成流程使用
app.get('/seatstone.glb', (req, res) => {
  res.type('model/gltf-binary');
  res.sendFile(path.join(__dirname, 'seatstone.glb'));
});

// 预热默认参数的缓存模板
async function ensureTemplate() {
  if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  }
  try {
    await ensureTemplateForOptions(DEFAULT_GENERATE_OPTIONS);
    console.log('默认参数模板缓存已就绪。');
  } catch (err) {
    console.error('预生成默认模板失败:', err.message);
  }
}

// API: 获取着色后的石墩子 SVG（查询参数：f/a/s/d 与 POST /api/generate 一致）
app.get('/api/stone/:owner/:repo', async (req, res) => {
  try {
    const opts = parseStoneQuery(req.query);
    const templatePath = await ensureTemplateForOptions(opts);
    const { owner, repo } = req.params;
    const sha = await getRepoShortSHA(owner, repo);
    const svg = colorizeSVG(templatePath, sha);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API: 解析仓库链接，返回徽章信息（body 可含 frameCount、minFaceArea、simplifyCollapses、animDuration）
app.post('/api/generate', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: '请提供仓库链接' });
    }
    const match = repoUrl.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
    if (!match) {
      return res.status(400).json({ error: '无效的 GitHub 仓库链接' });
    }
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');
    const opts = clampGenerateOptions(req.body);
    await ensureTemplateForOptions(opts);
    const sha = await getRepoShortSHA(owner, repo);
    const qs = buildStoneQuery(opts);
    const badgeUrl =
      `/api/stone/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}?${qs}`;
    res.json({ owner, repo, sha, badgeUrl, generateOptions: opts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

ensureTemplate().then(() => {
  app.listen(PORT, () => {
    console.log(`Stone Badge 服务运行于 http://localhost:${PORT}`);
  });
});
