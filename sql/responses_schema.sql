CREATE TABLE IF NOT EXISTS responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_at timestamptz DEFAULT now(),
  pseudonym text,
  country text,
  operating_duration text,
  platforms text[],
  sector text,

  -- Section A: Profile
  a_self_intro text,

  -- Section B: Personal Branding
  b1_intent text,
  b2_deliberateness text,
  b3_turning_point text,
  b4_boundary text,
  b5_model text,

  -- Section C: Brand Equity
  c1_awareness_link text,
  c2_trust_transfer text,
  c3_reputation_risk text,
  c4_loyalty_origin text,

  -- Section D: African Context
  d1_structural_friction text,
  d2_identity_as_asset text,
  d3_ecosystem_learning text,

  -- Section E: Synthesis
  e1_strategic_opportunity text,
  e2_untold_narrative text,

  -- Referral + contact
  referral text,
  followup_email text
);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'responses'
      AND policyname = 'allow_public_insert'
  ) THEN
    CREATE POLICY "allow_public_insert"
      ON responses
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_responses_reporting()
RETURNS TABLE (
  id uuid,
  submitted_at timestamptz,
  pseudonym text,
  country text,
  operating_duration text,
  platforms text[],
  sector text,
  a_self_intro text,
  b1_intent text,
  b2_deliberateness text,
  b3_turning_point text,
  b4_boundary text,
  b5_model text,
  c1_awareness_link text,
  c2_trust_transfer text,
  c3_reputation_risk text,
  c4_loyalty_origin text,
  d1_structural_friction text,
  d2_identity_as_asset text,
  d3_ecosystem_learning text,
  e1_strategic_opportunity text,
  e2_untold_narrative text,
  referral text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    id,
    submitted_at,
    pseudonym,
    country,
    operating_duration,
    platforms,
    sector,
    a_self_intro,
    b1_intent,
    b2_deliberateness,
    b3_turning_point,
    b4_boundary,
    b5_model,
    c1_awareness_link,
    c2_trust_transfer,
    c3_reputation_risk,
    c4_loyalty_origin,
    d1_structural_friction,
    d2_identity_as_asset,
    d3_ecosystem_learning,
    e1_strategic_opportunity,
    e2_untold_narrative,
    referral
  FROM responses
  ORDER BY submitted_at DESC;
$$;

REVOKE ALL ON FUNCTION private.get_responses_reporting() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_responses_reporting() TO authenticated;
