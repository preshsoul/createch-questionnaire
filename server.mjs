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
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
      adminExportToken: env.ADMIN_EXPORT_TOKEN || '',
      appMode: (env.CREATECH_APP_MODE || 'production').trim().toLowerCase(),
    };
  } catch {
    return { supabaseUrl: '', supabaseAnonKey: '', supabaseServiceRoleKey: '', adminExportToken: '', appMode: 'production' };
  }
}

const runtimeConfig = await loadRuntimeConfig();

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body, null, 2));
}

function escapeCsvValue(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(rows) {
  const columns = [
    'id',
    'submitted_at',
    'pseudonym',
    'country',
    'operating_duration',
    'sector',
    'platforms',
    'a_self_intro',
    'b1_intent',
    'b2_deliberateness',
    'b3_turning_point',
    'b4_boundary',
    'b5_model',
    'c1_awareness_link',
    'c2_trust_transfer',
    'c3_reputation_risk',
    'c4_loyalty_origin',
    'd1_structural_friction',
    'd2_identity_as_asset',
    'd3_ecosystem_learning',
    'e1_strategic_opportunity',
    'e2_untold_narrative',
    'referral',
    'followup_email',
  ];
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map(column => {
      const value = row?.[column];
      if (Array.isArray(value)) return escapeCsvValue(value.join('; '));
      return escapeCsvValue(value);
    }).join(','));
  }
  return lines.join('\n');
}

function isLikelyTestRow(row) {
  const pseudonym = String(row?.pseudonym || '').trim().toUpperCase();
  return pseudonym.startsWith('T') || pseudonym.startsWith('PTEST');
}

function isAuthorizedAdmin(requestUrl, headers) {
  const provided = String(requestUrl.searchParams.get('token') || headers['x-admin-token'] || '').trim();
  return Boolean(runtimeConfig.adminExportToken && provided && provided === runtimeConfig.adminExportToken);
}

async function fetchResponsesFromSupabase() {
  if (!runtimeConfig.supabaseUrl || !runtimeConfig.supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or Supabase URL in .env.');
  }
  const endpoint = `${runtimeConfig.supabaseUrl}/rest/v1/responses?select=*&order=submitted_at.desc`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: runtimeConfig.supabaseServiceRoleKey,
      Authorization: `Bearer ${runtimeConfig.supabaseServiceRoleKey}`,
    },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase export failed: ${res.status} - ${body}`);
  }
  return JSON.parse(body);
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

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/health') {
    return sendJson(res, 200, {
      ok: true,
      supabaseConfigured: Boolean(runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey),
      exportReady: Boolean(runtimeConfig.supabaseUrl && runtimeConfig.supabaseServiceRoleKey && runtimeConfig.adminExportToken),
      appMode: runtimeConfig.appMode,
    });
  }

  if (pathname === '/js/config.js') {
    const body = `window.CREATECH_CONFIG = ${JSON.stringify({
      supabaseUrl: runtimeConfig.supabaseUrl,
      supabaseAnonKey: runtimeConfig.supabaseAnonKey,
      appMode: runtimeConfig.appMode,
    }, null, 2)};\n`;
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    return res.end(body);
  }

  if (pathname === '/admin/export') {
    if (!isAuthorizedAdmin(requestUrl, req.headers)) {
      return sendJson(res, 401, { error: 'Unauthorized export request.' });
    }
    try {
      const rows = await fetchResponsesFromSupabase();
      const scope = String(requestUrl.searchParams.get('scope') || 'all').toLowerCase();
      const filteredRows = scope === 'test'
        ? rows.filter(isLikelyTestRow)
        : scope === 'real'
          ? rows.filter(row => !isLikelyTestRow(row))
          : rows;
      const format = String(requestUrl.searchParams.get('format') || 'json').toLowerCase();
      if (format === 'csv') {
        const csv = rowsToCsv(filteredRows);
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Disposition': 'attachment; filename="responses.csv"',
        });
        return res.end(csv);
      }
      return sendJson(res, 200, { count: filteredRows.length, rows: filteredRows });
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
});

server.listen(port, () => {
  console.log(`Createch Questionnaire running at http://localhost:${port}`);
});
