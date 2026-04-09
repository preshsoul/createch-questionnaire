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
