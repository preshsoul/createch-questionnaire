import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const rootDir = process.cwd();
const port = Number.parseInt(process.env.PORT || '3000', 10);

function parseEnv(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function loadRuntimeConfig() {
  try {
    const envText = await readFile(join(rootDir, '.env'), 'utf8');
    const env = parseEnv(envText);
    return {
      n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || env.N8N_WEBHOOK_URL || '',
      n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || env.N8N_WEBHOOK_SECRET || '',
    };
  } catch {
    return {
      n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || '',
      n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || '',
    };
  }
}

const runtimeConfig = await loadRuntimeConfig();

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body, null, 2));
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret');
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Submission body must be valid JSON.');
  }
}

async function forwardSubmission(payload) {
  if (!runtimeConfig.n8nWebhookUrl) {
    throw new Error('Missing N8N_WEBHOOK_URL in .env.');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (runtimeConfig.n8nWebhookSecret) {
    headers['X-Webhook-Secret'] = runtimeConfig.n8nWebhookSecret;
  }

  const response = await fetch(runtimeConfig.n8nWebhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type') || 'application/json; charset=utf-8';
  const text = await response.text();
  return {
    status: response.status,
    contentType,
    body: text || JSON.stringify({ ok: true }),
  };
}

function contentTypeFor(filePath) {
  switch (extname(filePath).toLowerCase()) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.ico':
      return 'image/x-icon';
    case '.txt':
      return 'text/plain; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

const requestHandler = async (req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/submit' || pathname === '/api/submit') {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      return sendJson(res, 405, { error: 'Method not allowed.' });
    }

    try {
      const payload = await readJsonBody(req);
      const forwarded = await forwardSubmission(payload);
      res.writeHead(forwarded.status, {
        'Content-Type': forwarded.contentType,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret',
      });
      return res.end(forwarded.body);
    } catch (error) {
      return sendJson(res, 503, { error: String(error?.message || error) });
    }
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = join(rootDir, relativePath);

  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentTypeFor(filePath),
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
};

function listenOn(candidatePort) {
  return new Promise((resolve, reject) => {
    const server = createServer(requestHandler);
    server.once('error', err => {
      server.close(() => reject(err));
    });
    server.listen(candidatePort, () => resolve(server));
  });
}

let activeServer = null;
let activePort = port;

for (let attempt = 0; attempt < 10; attempt += 1) {
  try {
    activeServer = await listenOn(activePort);
    break;
  } catch (err) {
    if (err?.code === 'EADDRINUSE') {
      activePort += 1;
      continue;
    }
    throw err;
  }
}

if (!activeServer) {
  throw new Error(`Could not find a free port starting at ${port}. Stop the existing server or set PORT manually.`);
}

console.log(`Createch Questionnaire running at http://localhost:${activePort}`);
