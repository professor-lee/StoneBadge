/** 帧数选项（与后端 clamp 8–32 一致） */
const FRAME_OPTIONS = [8, 12, 16, 20, 24, 28, 32];

/** 投影最小面积：越小三角形越多，SVG 越大 */
const QUALITY_PRESETS = [
  { id: 'fine', minFaceArea: 0.55, label: '高（细节多，体积大）' },
  { id: 'balanced', minFaceArea: 1.2, label: '中（推荐）' },
  { id: 'compact', minFaceArea: 2.5, label: '低（体积小）' }
];

/** 网格减面：SimplifyModifier 折叠迭代次数，越大越简 */
const DECIMATE_PRESETS = [
  { simplifyCollapses: 0, label: '无' },
  { simplifyCollapses: 280, label: '低' },
  { simplifyCollapses: 700, label: '中' },
  { simplifyCollapses: 1600, label: '高' }
];

const ANIM_DURATION_OPTIONS = [8, 10, 12, 15];

function fillSelect(select, options, getValue, getLabel, selectedValue) {
  select.innerHTML = '';
  for (const opt of options) {
    const v = getValue(opt);
    const el = document.createElement('option');
    el.value = String(v);
    el.textContent = getLabel(opt);
    select.appendChild(el);
  }
  select.value = String(selectedValue);
}

function initOptionControls() {
  const fc = document.getElementById('frameCount');
  fillSelect(
    fc,
    FRAME_OPTIONS,
    (n) => n,
    (n) => `${n} 帧`,
    16
  );

  const qp = document.getElementById('qualityPreset');
  fillSelect(
    qp,
    QUALITY_PRESETS,
    (p) => p.id,
    (p) => p.label,
    'balanced'
  );

  const dp = document.getElementById('decimatePreset');
  fillSelect(
    dp,
    DECIMATE_PRESETS,
    (p) => p.simplifyCollapses,
    (p) => p.label,
    0
  );

  const ad = document.getElementById('animDuration');
  fillSelect(
    ad,
    ANIM_DURATION_OPTIONS,
    (n) => n,
    (n) => `${n} 秒`,
    10
  );
}

function collectGenerateBody(repoUrl) {
  const quality = QUALITY_PRESETS.find(
    (p) => p.id === document.getElementById('qualityPreset').value
  ) || QUALITY_PRESETS[1];
  const simplifyCollapses = Number(
    document.getElementById('decimatePreset').value
  );
  return {
    repoUrl,
    frameCount: Number(document.getElementById('frameCount').value),
    minFaceArea: quality.minFaceArea,
    simplifyCollapses,
    animDuration: Number(document.getElementById('animDuration').value)
  };
}

function formatByteSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function fetchSvgByteSize(badgePath) {
  const r = await fetch(badgePath, { cache: 'no-store' });
  if (!r.ok) throw new Error(String(r.status));
  const buf = await r.arrayBuffer();
  return buf.byteLength;
}

initOptionControls();

document.getElementById('generateBtn').addEventListener('click', generate);
document.getElementById('repoUrl').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') generate();
});

const githubStarCountEl = document.getElementById('githubStarCount');
if (githubStarCountEl) {
  loadGitHubStars();
}

async function generate() {
  const repoUrl = document.getElementById('repoUrl').value.trim();
  if (!repoUrl) return;

  const resultDiv = document.getElementById('result');
  const errorDiv = document.getElementById('error');
  const loadingDiv = document.getElementById('loading');

  resultDiv.classList.add('hidden');
  errorDiv.classList.add('hidden');
  loadingDiv.classList.remove('hidden');

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectGenerateBody(repoUrl))
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const baseUrl = window.location.origin;
    const fullBadgeUrl = baseUrl + data.badgeUrl;

    // 预览
    document.getElementById('svgPreview').innerHTML =
      `<img src="${data.badgeUrl}" alt="Stone Badge" />`;
    document.getElementById('shaDisplay').textContent = data.sha;

    const sizeEl = document.getElementById('svgSizeDisplay');
    sizeEl.textContent = '…';
    fetchSvgByteSize(data.badgeUrl)
      .then((bytes) => {
        sizeEl.textContent = formatByteSize(bytes);
      })
      .catch(() => {
        sizeEl.textContent = '未知';
      });

    // 可复制链接
    document.getElementById('markdownLink').value =
      `![Stone Badge](${fullBadgeUrl})`;
    document.getElementById('htmlLink').value =
      `<img src="${fullBadgeUrl}" alt="Stone Badge" width="200" />`;
    document.getElementById('directLink').value = fullBadgeUrl;

    resultDiv.classList.remove('hidden');
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.classList.remove('hidden');
  } finally {
    loadingDiv.classList.add('hidden');
  }
}

async function loadGitHubStars() {
  try {
    const response = await fetch('https://api.github.com/repos/professor-lee/StoneBadge', {
      headers: {
        Accept: 'application/vnd.github+json'
      }
    });

    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

    const data = await response.json();
    const stars = Number.isFinite(data.stargazers_count) ? data.stargazers_count : null;
    githubStarCountEl.textContent = stars === null ? '--' : stars.toLocaleString('zh-CN');
  } catch (error) {
    githubStarCountEl.textContent = '--';
  }
}

// 复制按钮
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    navigator.clipboard.writeText(target.value).then(() => {
      const original = btn.textContent;
      btn.textContent = '已复制!';
      setTimeout(() => btn.textContent = original, 2000);
    });
  });
});
