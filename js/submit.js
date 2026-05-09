async function submitQuestionnaire(payload) {
  const res = await fetch('/api/submit', {
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
