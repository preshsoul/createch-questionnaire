# Vercel Deployment Checklist

Use this when you want to confirm the live deployment is actually connected to Supabase.

## Required Vercel env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EXPORT_TOKEN`
- `CREATECH_APP_MODE` should usually be `production`

## Required Supabase objects

- `responses` table exists
- `followup_contacts` table exists
- `allow_public_insert` policy exists on `responses`
- `allow_public_followup_insert` policy exists on `followup_contacts`

## Live checks

1. Open the deployed site.
2. Confirm the connection pill says `Supabase connected`.
3. Submit a real test response.
4. Confirm the success reference appears.
5. Open `/health` on the deployed site.
6. Confirm `supabaseConfigured: true`.
7. Open `/admin/export?token=YOUR_TOKEN&format=json`.
8. Confirm the response count increments and the submitted row appears.

## Cleanup

- Run `sql/cleanup_test_rows.sql` in Supabase once you are ready to remove synthetic data.

