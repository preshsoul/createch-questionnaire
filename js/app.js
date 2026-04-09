// ── CONSENT GATE ──
function gateConsent(shouldScroll = true) {
  const consent = document.getElementById('consentCheck');
  const form = document.getElementById('form');
  const submitBtn = document.getElementById('submitBtn');
  if (!consent || !form || !submitBtn) return;

  const ok = consent.checked;
  form.style.display = ok ? 'block' : 'none';
  submitBtn.disabled = !ok;
  if (ok && shouldScroll) form.scrollIntoView({ behavior:'smooth', block:'start' });
}

// ── CHAR COUNTER ──
function cc(el, id, max) {
  const n = el.value.length;
  const el2 = document.getElementById(id);
  if (n > max) el.value = el.value.substring(0, max);
  if (el2) {
    const next = el.value.length;
    el2.textContent = `${next} / ${max}`;
    el2.className = 'char-note' + (next > max * 0.88 ? ' warn' : '');
  }
  updateProgress();
}

// ── PROGRESS ──
const requiredIds = [
  'country','duration',
  'a_self_intro',
  'b1_intent','b2_deliberateness','b3_turning_point','b4_boundary',
  'c1_awareness_link','c2_trust_transfer','c3_reputation_risk',
  'd1_structural_friction','d2_identity_as_asset',
  'e1_strategic_opportunity','e2_untold_narrative'
];
function updateProgress() {
  let filled = 0;
  requiredIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const v = el.tagName === 'SELECT' ? el.value : el.value.trim();
    if (el.tagName === 'SELECT') {
      if (v.length > 0) filled++;
    } else if (v.length >= 10) {
      filled++;
    }
  });
  // also check platforms
  const plats = document.querySelectorAll('input[name="plat"]:checked');
  if (plats.length > 0) filled++;
  const total = requiredIds.length + 1;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = Math.round((filled/total)*100) + '%';
}

// ── NAV DOTS ──
const sects = ['intro','sA','sB','sC','sD','sE'];
document.querySelectorAll('.dot').forEach((d, i) => {
  d.addEventListener('click', () => {
    document.getElementById(sects[i])?.scrollIntoView({ behavior:'smooth' });
  });
});
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const idx = sects.indexOf(e.target.id);
      if (idx >= 0) {
        document.querySelectorAll('.dot').forEach(d => d.classList.remove('on'));
        document.querySelectorAll('.dot')[idx]?.classList.add('on');
      }
    }
  });
}, { threshold: 0.25 });
sects.forEach(id => { const el = document.getElementById(id); if(el) io.observe(el); });

// ── OPTION TOGGLE ──
document.querySelectorAll('input[name="plat"]').forEach(input => {
  const sync = () => {
    const item = input.closest('.opt-item');
    if (item) item.classList.toggle('on', input.checked);
    updateProgress();
  };
  input.addEventListener('change', sync);
  sync();
});

// ── VALIDATE ──
function validate() {
  let ok = true;
  const wrapMap = {
    country:       'w-country',
    duration:      'w-duration',
    a_self_intro:  'w-a-self',
    b1_intent:     'w-b1',
    b2_deliberateness: 'w-b2',
    b3_turning_point:  'w-b3',
    b4_boundary:       'w-b4',
    c1_awareness_link: 'w-c1',
    c2_trust_transfer: 'w-c2',
    c3_reputation_risk:'w-c3',
    d1_structural_friction: 'w-d1',
    d2_identity_as_asset:   'w-d2',
    e1_strategic_opportunity: 'w-e1',
    e2_untold_narrative:      'w-e2',
  };
  Object.entries(wrapMap).forEach(([fieldId, wrapId]) => {
    const field = document.getElementById(fieldId);
    const wrap  = document.getElementById(wrapId);
    if (!field || !wrap) return;
    const v = field.tagName === 'SELECT' ? field.value : field.value.trim();
    const bad = v.length < (field.tagName === 'SELECT' ? 1 : 10);
    wrap.classList.toggle('invalid', bad);
    if (bad) ok = false;
  });
  const plats = document.querySelectorAll('input[name="plat"]:checked');
  const platWrap = document.getElementById('w-platforms');
  if (platWrap) platWrap.classList.toggle('invalid', plats.length === 0);
  if (plats.length === 0) ok = false;
  return ok;
}

// ── COLLECT ──
function collect() {
  const plats = [...document.querySelectorAll('input[name="plat"]:checked')].map(c => c.value);
  return {
    country:               v('country'),
    operating_duration:    v('duration'),
    sector:                v('sector'),
    platforms:             plats,
    a_self_intro:          v('a_self_intro'),
    b1_intent:             v('b1_intent'),
    b2_deliberateness:     v('b2_deliberateness'),
    b3_turning_point:      v('b3_turning_point'),
    b4_boundary:           v('b4_boundary'),
    b5_model:              v('b5_model'),
    c1_awareness_link:     v('c1_awareness_link'),
    c2_trust_transfer:     v('c2_trust_transfer'),
    c3_reputation_risk:    v('c3_reputation_risk'),
    c4_loyalty_origin:     v('c4_loyalty_origin'),
    d1_structural_friction:v('d1_structural_friction'),
    d2_identity_as_asset:  v('d2_identity_as_asset'),
    d3_ecosystem_learning: v('d3_ecosystem_learning'),
    e1_strategic_opportunity: v('e1_strategic_opportunity'),
    e2_untold_narrative:      v('e2_untold_narrative'),
    referral:              v('referral'),
    followup_email:        v('followup_email'),
    pseudonym: 'P' + Math.random().toString(36).substring(2,6).toUpperCase()
  };
}
function v(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

// ── DRAFT AUTOSAVE ──
const DRAFT_KEY = 'createch-questionnaire:draft:v1';
let draftTimer = null;
let restoringDraft = false;

function getDraftStatusEl() {
  return document.getElementById('draftStatus');
}

function draftMessage(text) {
  const el = getDraftStatusEl();
  if (el) el.textContent = text;
}

function draftStamp(prefix) {
  const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  draftMessage(`${prefix} ${time}.`);
}

function readDraftState() {
  const state = { consentChecked: !!document.getElementById('consentCheck')?.checked };
  document.querySelectorAll('#form input, #form select, #form textarea').forEach(el => {
    if (!el.id && !el.name) return;
    if (el.type === 'checkbox') {
      if (!state.checkboxes) state.checkboxes = {};
      const key = el.id || el.name;
      if (el.name === 'plat') {
        if (!state.platforms) state.platforms = [];
        if (el.checked) state.platforms.push(el.value);
      } else {
        state.checkboxes[key] = el.checked;
      }
      return;
    }
    const key = el.id || el.name;
    state[key] = el.value;
  });
  return state;
}

function syncTextareaCounters() {
  document.querySelectorAll('textarea[oninput]').forEach(textarea => {
    const oninput = textarea.getAttribute('oninput') || '';
    const match = oninput.match(/cc\(this,'([^']+)',(\d+)\)/);
    if (!match) return;
    cc(textarea, match[1], Number(match[2]));
  });
}

function syncPlatformClasses() {
  document.querySelectorAll('input[name="plat"]').forEach(input => {
    const item = input.closest('.opt-item');
    if (item) item.classList.toggle('on', input.checked);
  });
}

function applyDraftState(state) {
  if (!state) return;
  restoringDraft = true;
  try {
    const consent = document.getElementById('consentCheck');
    if (consent && typeof state.consentChecked === 'boolean') {
      consent.checked = state.consentChecked;
    }

    Object.entries(state.checkboxes || {}).forEach(([key, checked]) => {
      const el = document.getElementById(key);
      if (el && el.type === 'checkbox') el.checked = !!checked;
    });

    document.querySelectorAll('#form input, #form select, #form textarea').forEach(el => {
      if (!el.id || el.type === 'checkbox') return;
      const value = state[el.id];
      if (typeof value === 'string') el.value = value;
    });

    (state.platforms || []).forEach(value => {
      const el = [...document.querySelectorAll('input[name="plat"]')].find(input => input.value === value);
      if (el) el.checked = true;
    });

    syncTextareaCounters();
    syncPlatformClasses();
    updateProgress();
  } finally {
    restoringDraft = false;
  }
}

function saveDraft() {
  if (restoringDraft) return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(readDraftState()));
    draftStamp('Draft saved locally at');
  } catch (err) {
    console.warn('Draft autosave failed:', err);
    draftMessage('Local draft could not be saved in this browser.');
  }
}

function scheduleDraftSave() {
  if (restoringDraft) return;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 350);
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);
    applyDraftState(state);
    draftStamp('Draft restored from');
    return true;
  } catch (err) {
    console.warn('Draft restore failed:', err);
    draftMessage('A saved draft could not be restored.');
    return false;
  }
}

function clearDraft(resetForm = false) {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (err) {
    console.warn('Draft clear failed:', err);
  }
  if (resetForm) {
    document.getElementById('form')?.reset();
    document.getElementById('consentCheck') && (document.getElementById('consentCheck').checked = false);
    document.querySelectorAll('.opt-item').forEach(item => item.classList.remove('on'));
    syncTextareaCounters();
    updateProgress();
    gateConsent(false);
  }
  draftMessage('Local draft cleared.');
}

// ── SUBMIT ──
async function handleSubmit() {
  if (!validate()) {
    document.querySelector('.invalid')?.scrollIntoView({ behavior:'smooth', block:'center' });
    return;
  }
  const btn = document.getElementById('submitBtn');
  const status = document.getElementById('saveStatus');
  if (!btn || !status) return;
  btn.disabled = true;
  btn.textContent = 'Saving…';
  status.textContent = 'Sending to database…';
  status.className = 'save-status';

  const payload = collect();

  try {
    await saveToSupabase(payload);
    clearDraft(false);
    status.textContent = '✓ Saved successfully.';
    status.className = 'save-status ok';
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = '100%';
    setTimeout(() => {
      document.getElementById('intro')?.style.setProperty('display', 'none');
      document.getElementById('form')?.style.setProperty('display', 'none');
      document.getElementById('done')?.classList.add('show');
      document.getElementById('done')?.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 600);
  } catch (err) {
    console.error(err);
    status.textContent = '⚠ Could not connect to database. Please check your internet and try again, or contact the researcher.';
    status.className = 'save-status err';
    btn.disabled = false;
    btn.textContent = 'Submit My Responses';
  }
}

// ── INIT ──
document.getElementById('form')?.addEventListener('submit', event => {
  event.preventDefault();
  handleSubmit();
});
document.getElementById('form')?.addEventListener('input', scheduleDraftSave);
document.getElementById('form')?.addEventListener('change', scheduleDraftSave);
document.getElementById('consentCheck')?.addEventListener('change', () => gateConsent());
document.getElementById('clearDraftBtn')?.addEventListener('click', () => {
  const ok = confirm('Clear the local draft and reset the questionnaire?');
  if (!ok) return;
  clearDraft(true);
});
restoreDraft();
gateConsent(false);
updateProgress();
