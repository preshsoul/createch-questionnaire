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

function isAuthorizedAdmin(req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const provided = String(url.searchParams.get('token') || req.headers['x-admin-token'] || '').trim();
  return Boolean(process.env.ADMIN_EXPORT_TOKEN && provided && provided === process.env.ADMIN_EXPORT_TOKEN);
}

async function fetchJson(url, serviceRoleKey) {
  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Supabase export failed: ${res.status} - ${text}`);
    err.statusCode = res.status;
    throw err;
  }
  return JSON.parse(text);
}

module.exports = async (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'Unauthorized export request.' }, null, 2));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceRoleKey) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or Supabase URL in environment.' }, null, 2));
  }

  try {
    const responseRows = await fetchJson(`${supabaseUrl}/rest/v1/responses?select=*&order=submitted_at.desc`, serviceRoleKey);
    let followupRows = [];
    try {
      followupRows = await fetchJson(`${supabaseUrl}/rest/v1/followup_contacts?select=response_id,pseudonym,email,submitted_at`, serviceRoleKey);
    } catch (err) {
      if (String(err.message || '').includes('42P01') || err.statusCode === 404) {
        followupRows = [];
      } else {
        throw err;
      }
    }

    const contactMap = new Map();
    for (const row of followupRows) {
      const key = String(row?.response_id || '').trim();
      if (key && !contactMap.has(key)) contactMap.set(key, row);
    }

    const mergedRows = responseRows.map(row => {
      const contact = contactMap.get(String(row?.id || '').trim());
      return {
        ...row,
        followup_email: row?.followup_email || contact?.email || '',
      };
    });

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const scope = String(url.searchParams.get('scope') || 'all').toLowerCase();
    const filteredRows = scope === 'test'
      ? mergedRows.filter(isLikelyTestRow)
      : scope === 'real'
        ? mergedRows.filter(row => !isLikelyTestRow(row))
        : mergedRows;
    const format = String(url.searchParams.get('format') || 'json').toLowerCase();

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.statusCode = 200;
      return res.end(rowsToCsv(filteredRows));
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 200;
    return res.end(JSON.stringify({ count: filteredRows.length, rows: filteredRows }, null, 2));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: String(error?.message || error) }, null, 2));
  }
};
