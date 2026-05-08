module.exports = (req, res) => {
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    appMode: (process.env.CREATECH_APP_MODE || 'production').trim().toLowerCase(),
  };

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  res.end(`window.CREATECH_CONFIG = ${JSON.stringify(config, null, 2)};\n`);
};
