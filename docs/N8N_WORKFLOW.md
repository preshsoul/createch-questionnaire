# n8n Workflow

Use this workflow to capture questionnaire submissions and append each one to Google Sheets as a new timestamped row.

Official n8n references:
- [Webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Respond to Webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/)
- [Code node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/)
- [Google Sheets node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/)

## What the project sends

The deployed questionnaire posts to `/api/submit`. The app proxy forwards that JSON to `N8N_WEBHOOK_URL`, so the browser never talks to Google Sheets or Supabase directly.

Expected payload fields:
- `submitted_at`
- `pseudonym`
- `submit_mode`
- `submit_source`
- `country`
- `operating_duration`
- `platforms`
- `sector`
- `a_self_intro`
- `b1_intent`
- `b2_deliberateness`
- `b3_turning_point`
- `b4_boundary`
- `b5_model`
- `c1_awareness_link`
- `c2_trust_transfer`
- `c3_reputation_risk`
- `c4_loyalty_origin`
- `d1_structural_friction`
- `d2_identity_as_asset`
- `d3_ecosystem_learning`
- `e1_strategic_opportunity`
- `e2_untold_narrative`
- `referral`
- `followup_email`

## Build It

Create the workflow with these 4 nodes, in this order:

1. **Webhook**
   - HTTP Method: `POST`
   - Path: `createch-questionnaire`
   - Respond: `Using Respond to Webhook node`
   - If you want protection, add webhook auth or keep the URL secret and validate `X-Webhook-Secret` in the next node

2. **Code**
   - Purpose: normalize the incoming JSON for a clean spreadsheet row
   - Put this JavaScript in the node:

```js
const input = $json;

return [
  {
    json: {
      submitted_at: input.submitted_at || new Date().toISOString(),
      pseudonym: input.pseudonym || '',
      submit_mode: input.submit_mode || 'production',
      submit_source: input.submit_source || 'web',
      country: input.country || '',
      operating_duration: input.operating_duration || '',
      platforms: Array.isArray(input.platforms)
        ? input.platforms.join('; ')
        : (input.platforms || ''),
      sector: input.sector || '',
      a_self_intro: input.a_self_intro || '',
      b1_intent: input.b1_intent || '',
      b2_deliberateness: input.b2_deliberateness || '',
      b3_turning_point: input.b3_turning_point || '',
      b4_boundary: input.b4_boundary || '',
      b5_model: input.b5_model || '',
      c1_awareness_link: input.c1_awareness_link || '',
      c2_trust_transfer: input.c2_trust_transfer || '',
      c3_reputation_risk: input.c3_reputation_risk || '',
      c4_loyalty_origin: input.c4_loyalty_origin || '',
      d1_structural_friction: input.d1_structural_friction || '',
      d2_identity_as_asset: input.d2_identity_as_asset || '',
      d3_ecosystem_learning: input.d3_ecosystem_learning || '',
      e1_strategic_opportunity: input.e1_strategic_opportunity || '',
      e2_untold_narrative: input.e2_untold_narrative || '',
      referral: input.referral || '',
      followup_email: input.followup_email || '',
    },
  },
];
```

3. **Google Sheets**
   - Resource: `Sheet Within Document`
   - Operation: `Append Row`
   - Credential: connect your Google account
   - Document: pick the spreadsheet you want to write to
   - Sheet: pick the tab you want to append to
   - Create the header row first so each field maps cleanly to a column

4. **Respond to Webhook**
   - Respond With: `JSON`
   - Response Body:

```json
{
  "ok": true,
  "pseudonym": "={{ $json.pseudonym }}",
  "submitted_at": "={{ $json.submitted_at }}"
}
```

## Recommended sheet columns

Put these headers in row 1 of the Google Sheet:

- `submitted_at`
- `pseudonym`
- `submit_mode`
- `submit_source`
- `country`
- `operating_duration`
- `platforms`
- `sector`
- `a_self_intro`
- `b1_intent`
- `b2_deliberateness`
- `b3_turning_point`
- `b4_boundary`
- `b5_model`
- `c1_awareness_link`
- `c2_trust_transfer`
- `c3_reputation_risk`
- `c4_loyalty_origin`
- `d1_structural_friction`
- `d2_identity_as_asset`
- `d3_ecosystem_learning`
- `e1_strategic_opportunity`
- `e2_untold_narrative`
- `referral`
- `followup_email`

## Response contract

The questionnaire expects a small success JSON object. Keep it simple:

```json
{
  "ok": true,
  "pseudonym": "P7W2Q",
  "submitted_at": "2026-05-08T20:00:00.000Z"
}
```

## Security

- Keep the webhook URL private.
- If you use a shared secret, set the same `N8N_WEBHOOK_SECRET` in Vercel and in n8n.
- If you choose to validate the secret in the workflow, do it before the Google Sheets append step.

## Fast sanity check

After building the workflow:
- Send one test submission from the questionnaire.
- Confirm a new row appears in Google Sheets.
- Confirm the app shows a success message.
