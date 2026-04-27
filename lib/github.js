export async function getRepoShortSHA(owner, repo) {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=1`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'StoneBadge/1.0'
  };
  
  // In Cloudflare Workers, environment variables are accessed differently
  // We'll pass the token through the env parameter in the worker
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API 错误: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.length) {
    throw new Error('仓库中未找到任何提交记录');
  }
  return data[0].sha.substring(0, 7);
}