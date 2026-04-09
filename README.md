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

1. Open `index.html` in a browser, or serve the folder with a simple static server.
2. Update `js/config.js` with your Supabase project URL and anon key.
3. Run `sql/responses_schema.sql` in Supabase to create the `responses` table and insert policy.
4. If you want a local preview server, run `python -m http.server` from the project folder and open the shown localhost URL.

## Notes

- The form is intentionally static and dependency-light.
- Responses are sent directly to Supabase from the browser, so only the public anon key should be used here.
- If you change field IDs in the HTML, keep the same IDs in `js/app.js` and the SQL schema.
