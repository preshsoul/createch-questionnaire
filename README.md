# Createch Questionnaire

Static questionnaire for an MBA dissertation study on founder personal branding in African Createch.

## Structure

- `index.html` - questionnaire markup and page shell
- `css/styles.css` - visual styling
- `js/app.js` - form behavior, validation, progress, and submit flow
- `js/config.js` - runtime submission config injected by the server
- `js/supabase.js` - submission helper that posts to the webhook proxy
- `sql/responses_schema.sql` - database schema and RLS policy
- `.vscode/settings.json` - local editor defaults for the project

## Local use

1. Put your n8n webhook URL in `.env` as `N8N_WEBHOOK_URL`.
2. Optionally add `N8N_WEBHOOK_SECRET` if your workflow checks a shared secret header.
3. Run `npm start` from the project folder and open the printed localhost URL.
4. Run `sql/responses_schema.sql` in Supabase to create the `responses` table and follow-up table.
5. For recovery/export, add `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EXPORT_TOKEN` to `.env`, then call `/admin/export?token=...` from the local server. Add `&scope=test` or `&scope=real` to filter obvious synthetic rows.
6. To test without mixing browser drafts, open the app with `?mode=test`; the session gets a test banner and test-style pseudonyms while still using the same workflow.

## Vercel

1. Add `N8N_WEBHOOK_URL` and optionally `N8N_WEBHOOK_SECRET` in the Vercel project settings.
2. Keep `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EXPORT_TOKEN` only if you want the admin export route.
3. `vercel.json` rewrites `/js/config.js`, `/health`, and `/admin/export` to serverless API routes.
4. The browser submits to `/api/submit`; that route forwards the payload to n8n.
5. The local `server.mjs` is for development only; the deployed app should use the Vercel routes.

## Notes

- The form is intentionally static and dependency-light.
- Responses are sent to the n8n workflow through a same-origin `/api/submit` proxy, so the browser never talks to Supabase directly.
- The project now reads submission config from `.env` at runtime when served through `server.mjs`.
- Draft responses are recoverable only from the same browser profile via localStorage; already-submitted rows can only be exported if Supabase read access is available.
- The admin export endpoint uses the service-role key from `.env` and is protected by `ADMIN_EXPORT_TOKEN`.
- Follow-up email is saved into a separate `followup_contacts` table so it stays out of the main responses dataset.
- `sql/cleanup_test_rows.sql` removes the known synthetic submissions when you are ready to clean the table.
- `docs/VERCEL_CHECKLIST.md` lists the live deployment checks for Supabase and Vercel.
- If you change field IDs in the HTML, keep the same IDs in `js/app.js` and the SQL schema.
- If Supabase reports an unterminated dollar-quoted string while running `sql/responses_schema.sql`, paste the entire file in one run and make sure the function closes with `$$;` before the next statement.
