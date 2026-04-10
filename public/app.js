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
      body: JSON.stringify({ repoUrl })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const baseUrl = window.location.origin;
    const fullBadgeUrl = baseUrl + data.badgeUrl;

    // 预览
    document.getElementById('svgPreview').innerHTML =
      `<img src="${data.badgeUrl}" alt="Stone Badge" />`;
    document.getElementById('shaDisplay').textContent = data.sha;

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
