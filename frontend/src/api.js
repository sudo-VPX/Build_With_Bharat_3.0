/* CloudGuard API client — all fetch helpers for the FastAPI backend */

const BASE = ''  // same origin — Vite proxies /api → FastAPI in dev; FastAPI serves frontend in prod

async function json(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const getHealth = () =>
  fetch(`${BASE}/health`).then(json)

export const getSummary = () =>
  fetch(`${BASE}/api/summary`).then(json)

export const getIdentities = () =>
  fetch(`${BASE}/api/identities`).then(json)

export const getIdentity = (id) =>
  fetch(`${BASE}/api/identities/${encodeURIComponent(id)}`).then(json)

export const getFindings = () =>
  fetch(`${BASE}/api/findings`).then(json)

export const getRecommendations = () =>
  fetch(`${BASE}/api/recommendations`).then(json)

export const reviewRecommendation = (id, decision, reviewerNote = '') =>
  fetch(`${BASE}/api/recommendations/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, reviewer_note: reviewerNote }),
  }).then(json)

export const getRemediationPlan = (id) =>
  fetch(`${BASE}/api/recommendations/${encodeURIComponent(id)}/remediation-plan`).then(json)

export const runScan = (mode = 'demo', awsProfile = null, awsRegion = null) =>
  fetch(`${BASE}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, aws_profile: awsProfile, aws_region: awsRegion }),
  }).then(json)
