function getSupabaseConfig() {
  const config = window.CREATECH_CONFIG || {};
  return {
    url: String(config.supabaseUrl || '').trim(),
    key: String(config.supabaseAnonKey || '').trim(),
  };
}

function isConfigured() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('https://') && !url.includes('YOUR_') && !key.includes('YOUR_'));
}

async function saveToSupabase(payload) {
  const { url, key } = getSupabaseConfig();

  if (!isConfigured()) {
    throw new Error(
      'Supabase is not configured. Put the values in .env and run the app through npm start so js/config.js can be generated from the environment.'
    );
  }

  const res = await fetch(`${url}/rest/v1/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Supabase blocked the insert. Run sql/responses_schema.sql in the Supabase SQL editor and make sure the public insert policy exists.'
      );
    }
    throw new Error(`Supabase error: ${res.status} - ${err}`);
  }

  return true;
}
