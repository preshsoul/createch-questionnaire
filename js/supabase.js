function getSubmitConfig() {
  const config = window.CREATECH_CONFIG || {};
  return {
    endpoint: String(config.submitEndpoint || '/api/submit').trim() || '/api/submit',
  };
}

async function submitQuestionnaire(payload) {
  const { endpoint } = getSubmitConfig();

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Submission workflow error: ${res.status} - ${err}`);
  }

  return res.json().catch(() => ({ ok: true }));
}
