# Vercel Deployment Checklist

Use this when you want to confirm the live deployment is actually connected to the n8n submission workflow and still has the admin export path for Supabase.

## Required Vercel env vars

- `N8N_WEBHOOK_URL`
- `N8N_WEBHOOK_SECRET` if your workflow checks a shared secret
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
2. Confirm the connection pill says `Submission ready`.
3. Submit a real test response.
4. Confirm the success reference appears.
5. Open `/health` on the deployed site.
6. Confirm `submitConfigured: true`.
7. Open `/admin/export?token=YOUR_TOKEN&format=json`.
8. Confirm the response count increments and the submitted row appears.

## Cleanup

- Run `sql/cleanup_test_rows.sql` in Supabase once you are ready to remove synthetic data.

