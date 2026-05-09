function cc(el, id, max) {
  const next = Math.min(el.value.length, max);
  const note = document.getElementById(id);
  if (el.value.length > max) {
    el.value = el.value.substring(0, max);
  }
  if (note) {
    note.textContent = `${next} / ${max}`;
    note.className = 'char-note' + (next > max * 0.88 ? ' warn' : '');
  }
}

document.querySelectorAll('input[name="plat"]').forEach(input => {
  const sync = () => {
    const item = input.closest('.opt-item');
    if (item) item.classList.toggle('on', input.checked);
  };
  input.addEventListener('change', sync);
  sync();
});

function validate() {
  let ok = true;
  const required = {
    country: 'w-country',
    duration: 'w-duration',
    a_self_intro: 'w-a-self',
    b1_intent: 'w-b1',
    b2_deliberateness: 'w-b2',
    b3_turning_point: 'w-b3',
    b4_boundary: 'w-b4',
    c1_awareness_link: 'w-c1',
    c2_trust_transfer: 'w-c2',
    c3_reputation_risk: 'w-c3',
    d1_structural_friction: 'w-d1',
    d2_identity_as_asset: 'w-d2',
    e1_strategic_opportunity: 'w-e1',
    e2_untold_narrative: 'w-e2',
  };

  Object.entries(required).forEach(([fieldId, wrapId]) => {
    const field = document.getElementById(fieldId);
    const wrap = document.getElementById(wrapId);
    if (!field || !wrap) return;
    const value = field.tagName === 'SELECT' ? field.value : field.value.trim();
    const invalid = value.length === 0;
    wrap.classList.toggle('invalid', invalid);
    if (invalid) ok = false;
  });

  const plats = document.querySelectorAll('input[name="plat"]:checked');
  const platWrap = document.getElementById('w-platforms');
  if (platWrap) platWrap.classList.toggle('invalid', plats.length === 0);
  if (plats.length === 0) ok = false;

  return ok;
}

function collect() {
  const platforms = [...document.querySelectorAll('input[name="plat"]:checked')].map(c => c.value).join('; ');
  const value = id => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  return {
    country: value('country'),
    operating_duration: value('duration'),
    sector: value('sector'),
    platforms,
    a_self_intro: value('a_self_intro'),
    b1_intent: value('b1_intent'),
    b2_deliberateness: value('b2_deliberateness'),
    b3_turning_point: value('b3_turning_point'),
    b4_boundary: value('b4_boundary'),
    b5_model: value('b5_model'),
    c1_awareness_link: value('c1_awareness_link'),
    c2_trust_transfer: value('c2_trust_transfer'),
    c3_reputation_risk: value('c3_reputation_risk'),
    c4_loyalty_origin: value('c4_loyalty_origin'),
    d1_structural_friction: value('d1_structural_friction'),
    d2_identity_as_asset: value('d2_identity_as_asset'),
    d3_ecosystem_learning: value('d3_ecosystem_learning'),
    e1_strategic_opportunity: value('e1_strategic_opportunity'),
    e2_untold_narrative: value('e2_untold_narrative'),
    referral: value('referral'),
    followup_email: value('followup_email'),
    pseudonym: `P${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    submitted_at: new Date().toISOString(),
    submit_source: 'web',
  };
}

async function handleSubmit() {
  if (!validate()) {
    const status = document.getElementById('saveStatus');
    if (status) {
      status.textContent = 'Please complete the highlighted required fields before submitting.';
      status.className = 'save-status err';
    }
    document.querySelector('.invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn = document.getElementById('submitBtn');
  const status = document.getElementById('saveStatus');
  if (!btn || !status) return;

  btn.disabled = true;
  btn.textContent = 'Saving…';
  status.textContent = 'Sending submission…';
  status.className = 'save-status';

  try {
    const payload = collect();
    await submitQuestionnaire(payload);

    status.textContent = `✓ Saved successfully. Reference: ${payload.pseudonym}.`;
    if (payload.followup_email) {
      status.textContent += ' Follow-up email included.';
    }
    status.className = 'save-status ok';

    setTimeout(() => {
      if (typeof window.showSuccess === 'function') {
        window.showSuccess();
      }
    }, 600);
  } catch (err) {
    console.error(err);
    status.textContent = '⚠ Could not submit your response. Please check your connection and try again.';
    status.className = 'save-status err';
    btn.disabled = false;
    btn.textContent = 'Submit Responses';
  }
}

document.getElementById('form')?.addEventListener('submit', e => {
  e.preventDefault();
  handleSubmit();
});

document.getElementById('submitBtn')?.addEventListener('click', handleSubmit);
