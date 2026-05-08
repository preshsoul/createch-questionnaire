# Createch Questionnaire

Static questionnaire for an MBA dissertation study on founder personal branding in African Createch.

## Structure

- `index.html` - questionnaire markup and page shell
- `css/styles.css` - visual styling
- `js/app.js` - form behavior, validation, progress, and submit flow
- `js/config.js` - Supabase connection settings
- `js/supabase.js` - Supabase save helper
- `sql/responses_schema.sql` - database schema and RLS policy
- `.vscode/settings.json` - local editor defaults for the project

## Local use

1. Put your Supabase values in `.env` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Run `npm start` from the project folder and open the printed localhost URL.
3. Run `sql/responses_schema.sql` in Supabase to create the `responses` table and insert policy.
4. If you need to inspect the raw env wiring, the server serves `js/config.js` dynamically from `.env`.
5. For recovery/export, add `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EXPORT_TOKEN` to `.env`, then call `/admin/export?token=...` from the local server. Add `&scope=test` or `&scope=real` to filter obvious synthetic rows.
6. To test without mixing browser drafts, open the app with `?mode=test`; the session gets a test banner and test-style pseudonyms while still using the same table.

## Notes

- The form is intentionally static and dependency-light.
- Responses are sent directly to Supabase from the browser, so only the public anon key should be used here.
- The project now reads Supabase configuration from `.env` at runtime when served through `server.mjs`.
- Draft responses are recoverable only from the same browser profile via localStorage; already-submitted rows can only be exported if Supabase read access is available.
- The admin export endpoint uses the service-role key from `.env` and is protected by `ADMIN_EXPORT_TOKEN`.
- If you change field IDs in the HTML, keep the same IDs in `js/app.js` and the SQL schema.
