# Createch Questionnaire

Static questionnaire for an MBA dissertation study on founder personal branding in African Createch.

## How it works

- The form is served as a static site.
- Submissions are sent to `/api/submit`.
- The submit route forwards the payload to `N8N_WEBHOOK_URL`.
- n8n appends the response to Google Sheets and returns success.

## Files

- [`index.html`](C:/Codings/createch-questionnaire/index.html) - questionnaire markup and page shell
- [`css/styles.css`](C:/Codings/createch-questionnaire/css/styles.css) - visual styling
- [`js/app.js`](C:/Codings/createch-questionnaire/js/app.js) - validation and submit flow
- [`js/submit.js`](C:/Codings/createch-questionnaire/js/submit.js) - tiny submit helper
- [`api/submit.js`](C:/Codings/createch-questionnaire/api/submit.js) - Vercel submit proxy
- [`server.mjs`](C:/Codings/createch-questionnaire/server.mjs) - local static server and proxy
- [`docs/N8N_WORKFLOW.md`](C:/Codings/createch-questionnaire/docs/N8N_WORKFLOW.md) - n8n + Google Sheets setup

## Setup

1. Add `N8N_WEBHOOK_URL` to your Vercel project and to your local `.env`.
2. Optionally add `N8N_WEBHOOK_SECRET` if your workflow checks a shared secret header.
3. In n8n, create the workflow described in [`docs/N8N_WORKFLOW.md`](C:/Codings/createch-questionnaire/docs/N8N_WORKFLOW.md).
4. Run `npm start` locally or deploy to Vercel.

## Notes

- The browser never talks directly to Google Sheets or Supabase.
- The project is intentionally kept small: validate, submit, confirm.
- If the app says it submitted successfully but nothing appears in Google Sheets, check the n8n workflow execution history first.
