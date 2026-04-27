// Cloudflare Worker implementation for Stone Badge
import { getStoneDNA } from './lib/colorizer.js';
import { CF_TEMPLATE } from './lib/cf-template-generator.js';
import { colorizeSVG } from './lib/colorizer.js';  // Import the optimized colorizeSVG function

// Use the pre-generated template for Cloudflare Workers
const EMBEDDED_TEMPLATE = CF_TEMPLATE;

// Function to get repo SHA from GitHub API (consistent with server.js)
async function getRepoShortSHA(owner, repo, env = null) {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=1`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'StoneBadge/1.0'
  };
  
  // Check for GitHub token in environment (passed via env parameter in CF Workers)
  if (env && env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
  }
  
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

// Main fetch handler for Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve static assets from public directory (these would be hosted separately in production)
    if (path.startsWith('/public/') || path === '/' || path === '/index.html') {
      // Return a basic HTML page for the home page
      const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stone Badge Generator</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .input-group {
            margin-bottom: 20px;
        }
        input[type="text"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e8ed;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="text"]:focus {
            outline: none;
            border-color: #3498db;
        }
        button {
            width: 100%;
            padding: 12px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        }
        button:hover {
            background: #2980b9;
        }
        .badge-preview {
            text-align: center;
            margin-top: 20px;
            padding: 20px;
            border: 1px dashed #ddd;
            border-radius: 8px;
            background-color: #fafafa;
        }
        .badge-image {
            max-width: 100%;
            height: auto;
        }
        .badge-url {
            margin-top: 15px;
            word-break: break-all;
            font-family: monospace;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🪨 Stone Badge Generator</h1>
        <div class="input-group">
            <input type="text" id="repoUrl" placeholder="输入 GitHub 仓库地址 (例如: https://github.com/username/repo)">
        </div>
        <button onclick="generateBadge()">生成徽章</button>
        
        <div id="result" class="badge-preview" style="display:none;">
            <h3>Your Stone Badge:</h3>
            <img id="badgeImage" class="badge-image" alt="Stone Badge">
            <div class="badge-url">
                URL: <span id="badgeUrl"></span>
            </div>
            <div class="badge-url">
                Markdown: <code id="markdownCode"></code>
            </div>
        </div>
    </div>

    <script>
        async function generateBadge() {
            const repoUrl = document.getElementById('repoUrl').value.trim();
            if (!repoUrl) {
                alert('请输入仓库地址');
                return;
            }

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ repoUrl })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to generate badge');
                }

                const data = await response.json();
                
                // Update the badge image
                const badgeImage = document.getElementById('badgeImage');
                badgeImage.src = data.badgeUrl;
                badgeImage.onload = function() {
                    document.getElementById('result').style.display = 'block';
                };
                
                // Show the badge URL
                document.getElementById('badgeUrl').textContent = window.location.origin + data.badgeUrl;
                
                // Show the markdown code
                const markdownCode = document.getElementById('markdownCode');
                markdownCode.textContent = '[![Stone Badge](' + window.location.origin + data.badgeUrl + ')](' + repoUrl + ')';
                
            } catch (error) {
                alert('错误: ' + error.message);
                console.error('错误:', error);
            }
        }
    </script>
</body>
</html>`;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // API route to get stone badge SVG
    const stoneMatch = path.match(/^\/api\/stone\/([^\/]+)\/([^\/]+)$/);
    if (stoneMatch) {
      try {
        const owner = stoneMatch[1];
        const repo = stoneMatch[2];
        
        // In server.js logic, we check if template exists before processing
        // Since we use embedded template in worker, we assume it's always available
        // Get the short SHA for the repo, passing environment for potential GitHub token
        const sha = await getRepoShortSHA(owner, repo, env);
        
        // Colorize the template SVG with the SHA using the imported function
        const svg = colorizeSVG(EMBEDDED_TEMPLATE, sha);
        
        return new Response(svg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // API route to parse repository URL and return badge info
    if (path === '/api/generate' && request.method === 'POST') {
      try {
        const { repoUrl } = await request.json();
        if (!repoUrl || typeof repoUrl !== 'string') {
          return new Response(JSON.stringify({ error: '请提供仓库链接' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const match = repoUrl.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
        if (!match) {
          return new Response(JSON.stringify({ error: '无效的 GitHub 仓库链接' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const owner = match[1];
        const repo = match[2].replace(/\.git$/, '');
        const sha = await getRepoShortSHA(owner, repo, env);
        const badgeUrl = `/api/stone/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

        return new Response(JSON.stringify({ owner, repo, sha, badgeUrl }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // API route to serve the 3D model file
    if (path === '/seatstone.glb') {
      // In a real implementation, this would return the actual GLB file
      // For now, we return a 404 since the model isn't needed in the worker version
      return new Response('Model not available in worker environment', { status: 404 });
    }

    // 404 for other routes
    return new Response('Not Found', { status: 404 });
  }
};