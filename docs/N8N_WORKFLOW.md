# n8n Workflow

Use this workflow to capture questionnaire submissions and append each one to Google Sheets as a new timestamped row.

## Goal

- The deployed questionnaire posts to `/api/submit`.
- `server.mjs` and the Vercel `api/submit.js` route forward that JSON to `N8N_WEBHOOK_URL`.
- n8n receives the payload, normalizes it, and appends it to Google Sheets.

## Workflow shape

1. **Webhook**
   - Method: `POST`
   - Path: choose a stable slug, for example `createch-questionnaire`
   - Respond: use `Respond to Webhook` or `When Last Node Finishes`
   - Add auth if you want extra protection

2. **Code** or **Set**
   - Keep the row shape simple for Sheets.
   - Ensure `submitted_at` exists.
   - Flatten the array-like fields if you add any later.

3. **Google Sheets**
   - Operation: `Append Row`
   - Map columns automatically or manually
   - Target a sheet with headers already created in the first row

4. **Respond to Webhook**
   - Return `{ ok: true, pseudonym, submitted_at }`
   - The questionnaire shows a success message after the proxy gets a success response

## Recommended sheet columns

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

## Suggested n8n Code node

If you want to normalize the webhook payload before Google Sheets, use a Code node like this:

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
      platforms: Array.isArray(input.platforms) ? input.platforms.join('; ') : (input.platforms || ''),
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

## Response contract

Return a small JSON object so the questionnaire can confirm success:

```json
{
  "ok": true,
  "pseudonym": "P7W2Q",
  "submitted_at": "2026-05-08T20:00:00.000Z"
}
```

## Authentication

- For a quick setup, use a secret header like `X-Webhook-Secret`.
- Match that header in both the questionnaire proxy and the n8n webhook workflow.
- Keep the webhook URL private even if the Sheet is shared.

