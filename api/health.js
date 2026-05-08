module.exports = (req, res) => {
  const submitConfigured = Boolean(process.env.N8N_WEBHOOK_URL);

  const exportReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.ADMIN_EXPORT_TOKEN
  );

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  res.end(JSON.stringify({
    ok: true,
    submitConfigured,
    exportReady,
    appMode: (process.env.CREATECH_APP_MODE || 'production').trim().toLowerCase(),
    deployedOn: 'vercel',
  }, null, 2));
};
