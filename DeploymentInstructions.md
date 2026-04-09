# Stone Badge Deployment Instructions

Stone Badge is a Node.js service that generates a stone badge SVG from the latest commit SHA of a GitHub repository. The project has no frontend build step; once started, it serves a static page and API endpoints directly:

- Home page: choose generation options (optional), enter a GitHub repository URL, and generate a badge
- API: return a colored SVG badge by repository owner / repo, with optional query parameters controlling template generation (frame count, min triangle area, mesh decimation, animation duration)
- On first use of a given parameter set, the server generates and caches an uncolored template under `templates/cache/`

## Directory Layout

```text
project/
├── server.js              # Service entry point
├── lib/                   # Business logic (template generator, colorizer, GitHub API)
├── public/                # Static frontend page
├── templates/
│   └── cache/             # Generated uncolored SVG templates (one file per option hash; created at runtime)
├── seatstone.glb          # 3D model file, must be kept
├── package.json
└── README.md
```

## Requirements

- Node.js 18 or later
- npm
- Server access to GitHub API: `https://api.github.com`
- `seatstone.glb` must remain on the server

Node.js 18+ is recommended because the code uses native `fetch` and the project is configured as an ESM package in `package.json`.

## Environment Variables

The project uses only two environment variables:

- `PORT`: service port, default `3000`
- `GITHUB_TOKEN`: optional. Recommended to raise GitHub API rate limits and avoid throttling under higher traffic

Example:

```bash
export PORT=3000
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

## Local Startup

If you just want to run the service directly on the server, follow these steps:

```bash
cd /path/to/project
npm install
npm start
```

After startup, the default address is:

- Home page: `http://server-ip:3000/`

On startup the service **pre-warms** the default-parameter template in `templates/cache/` (if generation succeeds). Additional templates are created on demand when a client uses other options. If generation fails, check the service logs and confirm that `seatstone.glb` exists and that `templates/` (including `templates/cache/`) is writable.

## Server Deployment Steps

The following example uses a Linux server. The recommended setup is `systemd + Nginx`, which keeps the service running at boot and exposes it through ports 80 / 443 via reverse proxy.

### 1. Prepare the Directory

It is recommended to place the project in a fixed directory, for example:

```bash
sudo mkdir -p /opt/stone-badge
```

Upload or clone the project into that directory, and make sure the final directory contains at least:

```text
server.js
package.json
lib/
public/
seatstone.glb
```

If `seatstone.glb` is missing, the automatic template generation and SVG coloring pipeline will not work.

If template generation fails, the usual causes are a missing `seatstone.glb`, an unsupported Node version, or insufficient write permissions for `templates/`.

### 2. Install Dependencies

```bash
cd /opt/stone-badge
npm install
```

After installation, `node_modules` will be created in the project directory. There is no additional build step.

### 3. Configure Service Account and Write Permissions

To make sure template generation can write successfully, ensure that `templates/` and `templates/cache/` exist and are writable:

```bash
sudo mkdir -p /opt/stone-badge/templates/cache
sudo chown -R www-data:www-data /opt/stone-badge/templates
```

If you plan to run the systemd service with a different user, replace `www-data` with that username, but keep `templates/` writable.

### 4. Configure Environment Variables

It is recommended to store environment variables in a separate file for easier systemd management:

```bash
sudo tee /etc/stone-badge.env >/dev/null <<'EOF'
PORT=3000
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
EOF
```

If you do not want to configure a GitHub token yet, you can keep only `PORT`, but API rate limiting is more likely under higher traffic.

### 5. Manually Verify the Startup Once

```bash
cd /opt/stone-badge
PORT=3000 npm start
```

On the first startup, the service will try to pre-generate the **default** cached template under `templates/cache/`. If that fails, check the logs, confirm that `seatstone.glb` exists, and verify that `templates/` is writable. For local development you can also run `node lib/template-generator.js` from the project root; it writes `templates/stone-template.svg` for offline inspection (the HTTP API uses `templates/cache/` keyed by generation options).

### 6. Configure systemd Autostart

Create the service file:

```bash
sudo tee /etc/systemd/system/stone-badge.service >/dev/null <<'EOF'
[Unit]
Description=Stone Badge Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/stone-badge
EnvironmentFile=/etc/stone-badge.env
ExecStart=/usr/bin/node /opt/stone-badge/server.js
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF
```

If your Node.js binary is not located at `/usr/bin/node`, run:

```bash
which node
```

Then update `ExecStart` to use the actual path.

Next, reload and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable stone-badge
sudo systemctl start stone-badge
sudo systemctl status stone-badge
```

View logs:

```bash
sudo journalctl -u stone-badge -f
```

## Nginx Reverse Proxy

It is recommended not to expose port 3000 directly to the public. Instead, let Nginx listen on 80 / 443 and forward requests to the local Node service.

Basic example:

```nginx
server {
    listen 80;
    server_name badge.example.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Notes:

- `client_max_body_size` can stay moderate; `POST /api/generate` sends a small JSON body. Raise the limit only if you add endpoints that accept large uploads.
- If you later add HTTPS, you only need to add certificate configuration to this `server` block

After enabling the config, run:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### If a Firewall Is Enabled

If the server uses `ufw`, it is recommended to open only 80 and 443:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

If you do not use Nginx and expose the Node port directly, you must at least open the `PORT` value, but this is not recommended for production.

## First Launch Checklist

- The home page opens successfully
- `seatstone.glb` can be requested directly from the browser
- After the first request or startup pre-warm, `templates/cache/` contains at least one `stone-*.svg` file (or check logs for generation errors)
- Entering a GitHub repository URL returns a badge
- Static assets and APIs work correctly behind the reverse proxy

## API Reference

### 1. Get SVG Badge

```text
GET /api/stone/:owner/:repo
```

Optional **query parameters** (short names; omitted values use server defaults):

| Parameter | Alias | Meaning |
|-----------|-------|---------|
| `f` | `frames` | Rotation animation frame count (clamped 8–32) |
| `a` | `minArea` | Minimum projected triangle area; smaller = finer, larger SVG |
| `s` | `simplify` | Mesh decimation strength: SimplifyModifier edge-collapse iterations (0–3000) |
| `d` | `animDuration` | Seconds for one full rotation loop (clamped 4–60) |

Example (defaults implied):

```text
GET /api/stone/vercel/next.js
```

Example with explicit options:

```text
GET /api/stone/vercel/next.js?f=16&a=1.2&s=0&d=10
```

The response body is an SVG image (`image/svg+xml`).

### 2. Parse Repository URL

```text
POST /api/generate
```

Request body:

```json
{
  "repoUrl": "https://github.com/owner/repo",
  "frameCount": 16,
  "minFaceArea": 1.2,
  "simplifyCollapses": 0,
  "animDuration": 10
}
```

Only `repoUrl` is required. Other fields follow the same semantics and clamping as the GET query parameters. The server ensures the matching template exists in `templates/cache/` before responding.

Response JSON includes at least: `owner`, `repo`, `short` SHA (`sha`), `badgeUrl` (path plus query string), and `generateOptions` (normalized values used).

## Common Issues

### 1. Badge request fails or logs show template generation errors

Usually `seatstone.glb` is missing, Node.js is too old, or `templates/` / `templates/cache/` is not writable. Fix it by:

1. Confirming that `seatstone.glb` exists next to `server.js`
2. Checking the service logs for template generation errors
3. Making `templates/` writable (`mkdir -p templates/cache` if needed) and restarting the service

### 2. GitHub API fails or rate limits

This is usually caused by a missing `GITHUB_TOKEN` or network access problems from the server. Recommended actions:

1. Confirm that the server can reach `api.github.com`
2. Configure `GITHUB_TOKEN`
3. Check proxy, firewall, and DNS settings

### 3. First request is slow

The first request for a **new** combination of `f`/`a`/`s`/`d` must run the 3D-to-SVG pipeline once; later requests with the same parameters reuse the cached file under `templates/cache/`.

### 4. The service exits immediately after startup

Check the following:

1. Whether Node.js is version 18 or later
2. Whether the Node path in `ExecStart` is correct
3. Whether `WorkingDirectory` points to the project root
4. The error output from `journalctl -u stone-badge -f`

## Update and Release Flow

When updating the code later, it is recommended to follow this flow:

```bash
cd /opt/stone-badge
git pull
npm install
sudo systemctl restart stone-badge
```

If the update does not change dependencies, `npm install` can be skipped, but keeping it in the process is safer.

## Notes

- The project has no frontend bundling step; files under `public/` are served directly as static assets
- Uncolored templates are generated on the server and stored under `templates/cache/`; the colored SVG returned by the API is produced in memory from that file and the repo SHA
- The recommended production setup is: `systemd` keepalive + `Nginx` reverse proxy + `GITHUB_TOKEN` to reduce rate-limit risk