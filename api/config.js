module.exports = (req, res) => {
  const config = {
    submitEndpoint: '/api/submit',
    submitConfigured: Boolean(process.env.N8N_WEBHOOK_URL),
    appMode: (process.env.CREATECH_APP_MODE || 'production').trim().toLowerCase(),
  };

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  res.end(`window.CREATECH_CONFIG = ${JSON.stringify(config, null, 2)};\n`);
};
