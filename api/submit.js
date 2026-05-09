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
  const webhookUrl = process.env.N8N_WEBHOOK_URL || '';
  if (!webhookUrl) {
    throw new Error('Missing N8N_WEBHOOK_URL in environment.');
  }

  const headers = { 'Content-Type': 'application/json' };
  const secret = process.env.N8N_WEBHOOK_SECRET || '';
  if (secret) {
    headers['X-Webhook-Secret'] = secret;
  }

  const response = await fetch(webhookUrl, {
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

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret');
}

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed.' }, null, 2));
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
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: String(error?.message || error) }, null, 2));
  }
};
