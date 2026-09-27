#!/usr/bin/env node
/**
 * TEA UI — static file server.
 *
 * A dependency-free server that behaves like a static host, for verifying a
 * build before it is deployed. It is not a dev server: it does not transform,
 * resolve or watch anything. That is the point — the artefact being checked is
 * the artefact that would ship.
 *
 *   node scripts/serve.mjs                          # serves dist-site at /
 *   BASE_PATH=/TEAui/ node scripts/serve.mjs        # serves it at /TEAui/
 *   PORT=4175 node scripts/serve.mjs
 *
 * Directory requests fall back to `index.html`, which is what every static host
 * does, and `.nojekyll` is honoured by not filtering anything — a host that
 * silently drops `_`-prefixed files is exactly the failure this server would
 * otherwise hide.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = resolve(repoRoot, process.env.SITE_DIR ?? "dist-site");
const mount = (process.env.BASE_PATH ?? "/").replace(/\/$/, "");
const port = Number(process.env.PORT ?? 4175);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);

  if (mount && pathname === mount) {
    response.writeHead(302, { Location: `${mount}/` });
    response.end();
    return;
  }
  if (mount && !pathname.startsWith(`${mount}/`)) {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end(`Not found. This server is mounted at ${mount}/`);
    return;
  }
  if (mount) pathname = pathname.slice(mount.length);

  // Resolve inside the site directory and refuse anything that escapes it.
  const candidate = join(siteDir, normalize(pathname));
  if (!candidate.startsWith(siteDir + sep) && candidate !== siteDir) {
    response.writeHead(403, { "Content-Type": "text/plain" });
    response.end("Forbidden");
    return;
  }

  let file = candidate;
  const info = await stat(file).catch(() => null);
  if (info?.isDirectory()) file = join(file, "index.html");

  const fileInfo = await stat(file).catch(() => null);
  if (!fileInfo?.isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
    "Content-Length": fileInfo.size,
    "Cache-Control": file.includes(`${sep}assets${sep}`)
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  });
  createReadStream(file).pipe(response);
});

server.listen(port, () => {
  console.log(`[tea-ui] serving ${siteDir} at http://localhost:${port}${mount || "/"}`);
});
