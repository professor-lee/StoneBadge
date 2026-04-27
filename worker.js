// Cloudflare Worker implementation for Stone Badge
import { getStoneDNA } from './lib/colorizer.js';
import { CF_TEMPLATE } from './lib/cf-template-generator.js';

// Use the pre-generated template for Cloudflare Workers
const EMBEDDED_TEMPLATE = CF_TEMPLATE;

// Function to get repo SHA from GitHub API
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

// Adapted colorizeSVG function for Cloudflare Workers
function colorizeSVG(svgTemplate, sha) {
  const dna = getStoneDNA(sha);

  // Replace all gray fills with SHA-based colors while preserving 3D effect
  let coloredSVG = svgTemplate.replace(
    /fill="rgb\((\d+),(\d+),(\d+)\)" stroke="rgb\(\d+,\d+,\d+\)"/g,
    (match, rStr, gStr, bStr) => {
      const r = parseInt(rStr);
      const g = parseInt(gStr);
      const b = parseInt(bStr);
      const luminance = (r + g + b) / (3 * 255); // 0-1

      let targetH, targetS;
      if (dna.mode === 'gradient') {
        // For simplicity in this version, we'll use a lerp function
        const diff = dna.secondary.h - dna.primary.h;
        const adjustedDiff = Math.abs(diff) > 180 ? (diff > 0 ? diff - 360 : diff + 360) : diff;
        targetH = ((dna.primary.h + adjustedDiff * luminance) % 360 + 360) % 360;
        targetS = dna.primary.s;
      } else {
        targetH = dna.primary.h;
        targetS = dna.primary.s;
      }

      // Map luminance to brightness range to preserve 3D shading
      const targetL = 15 + luminance * 60; // 15%-75%
      
      // Convert HSL to RGB
      const h = targetH / 360;
      const s = targetS / 100;
      const l = targetL / 100;
      
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h * 6) % 2 - 1));
      const m = l - c / 2;
      
      let r1, g1, b1;
      if (h < 1/6) { r1 = c; g1 = x; b1 = 0; }
      else if (h < 2/6) { r1 = x; g1 = c; b1 = 0; }
      else if (h < 3/6) { r1 = 0; g1 = c; b1 = x; }
      else if (h < 4/6) { r1 = 0; g1 = x; b1 = c; }
      else if (h < 5/6) { r1 = x; g1 = 0; b1 = c; }
      else { r1 = c; g1 = 0; b1 = x; }
      
      const finalR = Math.round((r1 + m) * 255);
      const finalG = Math.round((g1 + m) * 255);
      const finalB = Math.round((b1 + m) * 255);
      
      return `fill="rgb(${finalR},${finalG},${finalB})" stroke="rgb(${finalR},${finalG},${finalB})"`;
    }
  );

  // Add glow effect if applicable
  if (dna.glow) {
    coloredSVG = coloredSVG.replace(
      '</filter></defs>',
      '</filter>' +
      '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>' +
      '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter></defs>'
    );
    
    coloredSVG = coloredSVG.replace(
      '<g id="stone-group"',
      '<g filter="url(#glow)"><g id="stone-group"'
    );
    coloredSVG = coloredSVG.replace('</svg>', '</g></svg>');
  }

  return coloredSVG;
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
            <input type="text" id="repoUrl" placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)">
        </div>
        <button onclick="generateBadge()">Generate Badge</button>
        
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
                alert('Please enter a repository URL');
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
                    const error = await response.text();
                    throw new Error(error || 'Failed to generate badge');
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
                alert('Error: ' + error.message);
                console.error('Error:', error);
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
        
        // Get the short SHA for the repo, passing environment for potential GitHub token
        const sha = await getRepoShortSHA(owner, repo, env);
        
        // Colorize the template SVG with the SHA
        const svg = colorizeSVG(EMBEDDED_TEMPLATE, sha);
        
        return new Response(svg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (error) {
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
          return new Response(JSON.stringify({ error: 'Please provide repository URL' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const match = repoUrl.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
        if (!match) {
          return new Response(JSON.stringify({ error: 'Invalid GitHub repository URL' }), {
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