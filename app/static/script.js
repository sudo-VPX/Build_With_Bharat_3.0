/* ===================================================================
   CloudGuard — Dashboard JavaScript
   Vanilla JS — no framework.  Fetches from the FastAPI backend and
   renders the identities table, detail panel, and modals.
=================================================================== */

'use strict';

// ── State ────────────────────────────────────────────────────────
let activeIdentityId = null;
let allIdentities = [];

// ── Utility ─────────────────────────────────────────────────────

function severityClass(sev) {
  return 'badge badge-' + (sev || 'LOW');
}

function riskBarColor(score) {
  if (score >= 70) return 'var(--sev-critical)';
  if (score >= 45) return 'var(--sev-high)';
  if (score >= 20) return 'var(--sev-medium)';
  return 'var(--sev-low)';
}

function riskBar(score) {
  const color = riskBarColor(score);
  return `
    <div class="risk-bar-wrap">
      <div class="risk-bar-bg">
        <div class="risk-bar-fill" style="width:${score}%;background:${color}"></div>
      </div>
      <span class="risk-score-num" style="color:${color}">${score}</span>
    </div>`;
}

function statusBadge(status) {
  const label = status === 'PENDING_HUMAN_REVIEW' ? '⏳ Pending Review'
    : status === 'APPROVED' ? '✅ Approved'
    : status === 'REJECTED' ? '❌ Rejected'
    : status;
  return `<span class="badge badge-${status}">${label}</span>`;
}

function permStatusBadge(status) {
  const icons = { used: '✅ Used', unused: '❌ Unused', wildcard: '⚡ Wildcard' };
  return `<span class="badge badge-${status}">${icons[status] || status}</span>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Banner ───────────────────────────────────────────────────────

function showBanner(msg, isError = false) {
  const el = document.getElementById('scanBanner');
  el.textContent = msg;
  el.className = 'scan-banner' + (isError ? ' error' : '');
  el.style.display = 'block';
  if (!isError) setTimeout(() => { el.style.display = 'none'; }, 5000);
}

// ── Summary cards ─────────────────────────────────────────────────

async function loadSummary() {
  try {
    const res = await fetch('/api/summary');
    const d = await res.json();
    document.getElementById('valIdentities').textContent = d.total_identities ?? '—';
    document.getElementById('valDrift').textContent      = d.drift_findings ?? '—';
    document.getElementById('valHigh').textContent       = d.high_risk ?? '—';
    document.getElementById('valCritical').textContent   = d.critical ?? '—';
    document.getElementById('valReview').textContent     = d.pending_review ?? '—';

    const badge = document.getElementById('modeBadge');
    badge.textContent = (d.mode || 'demo').toUpperCase();
    badge.className = 'mode-badge' + (d.mode === 'live' ? ' live' : '');
    document.getElementById('footerMode').textContent = 'Mode: ' + (d.mode || 'demo');
  } catch (e) {
    console.error('Summary fetch failed', e);
  }
}

// ── Identities table ──────────────────────────────────────────────

async function loadIdentities() {
  try {
    const res = await fetch('/api/identities');
    allIdentities = await res.json();
    renderIdentitiesTable(allIdentities);
  } catch (e) {
    document.getElementById('identitiesBody').innerHTML =
      '<tr><td colspan="6" class="loading">Failed to load identities.</td></tr>';
  }
}

function renderIdentitiesTable(rows) {
  const tbody = document.getElementById('identitiesBody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading">No identities found.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr class="${r.identity_id === activeIdentityId ? 'active-row' : ''}"
        onclick="loadIdentityDetail('${escHtml(r.identity_id)}')">
      <td><strong>${escHtml(r.identity_name)}</strong></td>
      <td><span style="color:var(--text-muted)">${escHtml(r.identity_type)}</span></td>
      <td>${riskBar(r.risk_score)}</td>
      <td><span class="${severityClass(r.severity)}">${r.severity}</span></td>
      <td>${r.finding_count}</td>
      <td><button class="btn btn-primary" style="font-size:11px;padding:4px 10px"
            onclick="event.stopPropagation();loadIdentityDetail('${escHtml(r.identity_id)}')">Inspect →</button></td>
    </tr>`).join('');
}

// ── Detail panel ──────────────────────────────────────────────────

async function loadIdentityDetail(id) {
  activeIdentityId = id;
  renderIdentitiesTable(allIdentities); // refresh active row highlight

  const placeholder = document.getElementById('detailPlaceholder');
  const content     = document.getElementById('detailContent');
  placeholder.style.display = 'none';
  content.style.display     = 'block';
  content.innerHTML         = '<div class="loading" style="padding:40px">Loading…</div>';

  try {
    const res  = await fetch(`/api/identities/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    renderDetail(data);
  } catch (e) {
    content.innerHTML = `<div class="loading">Failed to load identity: ${escHtml(e.message)}</div>`;
  }
}

function renderDetail(data) {
  const id       = data.identity;
  const content  = document.getElementById('detailContent');

  // Build the full detail HTML
  content.innerHTML = `
    <!-- Header -->
    <div class="detail-header">
      <div class="detail-name">${escHtml(id.name)}</div>
      <div class="detail-meta">
        <span>🆔 ${escHtml(id.id)}</span>
        <span>🏷️ ${escHtml(id.identity_type)}</span>
        ${id.account_id ? `<span>🏦 Account: ${escHtml(id.account_id)}</span>` : ''}
        ${id.last_activity ? `<span>📅 Last Activity: ${escHtml(id.last_activity)}</span>` : ''}
        ${id.mfa_enabled === true  ? '<span style="color:var(--sev-low)">🔐 MFA Enabled</span>' : ''}
        ${id.mfa_enabled === false ? '<span style="color:var(--sev-critical)">⚠️ MFA Disabled</span>' : ''}
      </div>
      <div style="margin-top:10px">
        ${riskBar(data.risk_score)}
        <span style="margin-left:8px">${'<span class="' + severityClass(data.severity) + '">' + data.severity + '</span>'}</span>
      </div>
    </div>

    <!-- Permissions table -->
    <h3 class="section-title">Permissions (${(data.permission_table || []).length})</h3>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Permission</th><th>Resource</th><th>Source</th><th>CloudTrail Status</th>
        </tr></thead>
        <tbody>
          ${(data.permission_table || []).map(p => `
            <tr>
              <td><code style="color:var(--accent-blue)">${escHtml(p.action)}</code></td>
              <td style="font-size:11px;color:var(--text-muted);max-width:180px;overflow:hidden;text-overflow:ellipsis"
                  title="${escHtml(p.resource)}">${escHtml(p.resource)}</td>
              <td style="font-size:11px;color:var(--text-muted)">${escHtml(p.source)}</td>
              <td>${permStatusBadge(p.status)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Findings -->
    <h3 class="section-title">Findings (${data.findings.length})</h3>
    <div id="findingsList" style="padding:0 18px 10px;display:flex;flex-direction:column;gap:8px">
      ${data.findings.length ? data.findings.map(f => `
        <div class="finding-card sev-${f.severity}">
          <div class="finding-title">
            <span class="${severityClass(f.severity)}">${f.severity}</span>&nbsp;
            ${escHtml(f.title)}
          </div>
          <div class="finding-desc">${escHtml(f.description)}</div>
        </div>`).join('') : '<span class="no-items">✅ No findings — this identity looks healthy.</span>'}
    </div>

    <!-- Recommendations -->
    <h3 class="section-title">Recommendations (${data.recommendations.length})</h3>
    <div id="recsList" style="padding:0 18px 18px;display:flex;flex-direction:column;gap:10px">
      ${data.recommendations.length ? data.recommendations.map(r => `
        <div class="rec-card" id="rec-${escHtml(r.id)}">
          <div class="rec-title">${escHtml(r.title)}</div>
          <div class="rec-rationale">${escHtml(r.rationale)}</div>
          <div class="rec-actions">
            ${r.status === 'PENDING_HUMAN_REVIEW' ? `
              <button class="btn btn-approve" onclick="reviewRec('${escHtml(r.id)}','approved')">✅ Approve</button>
              <button class="btn btn-reject"  onclick="reviewRec('${escHtml(r.id)}','rejected')">❌ Reject</button>
            ` : ''}
            ${r.status === 'APPROVED' ? `
              <button class="btn btn-plan" onclick="showRemPlan('${escHtml(r.id)}')">🔧 View Remediation Plan</button>
            ` : ''}
            <span class="rec-status">${statusBadge(r.status)}</span>
          </div>
        </div>`).join('') : '<span class="no-items">No recommendations — nothing to review.</span>'}
    </div>
  `;
}

// ── Review a recommendation ───────────────────────────────────────

async function reviewRec(recId, decision) {
  try {
    const res = await fetch(`/api/recommendations/${encodeURIComponent(recId)}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reviewer_note: 'Reviewed via dashboard' }),
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    showBanner(`Recommendation ${decision === 'approved' ? 'approved ✅' : 'rejected ❌'}. No AWS permission was changed.`);
    // Refresh the detail panel and summary
    await loadIdentityDetail(activeIdentityId);
    await loadSummary();
  } catch (e) {
    showBanner(`Review failed: ${e.message}`, true);
  }
}

// ── Remediation plan modal ────────────────────────────────────────

async function showRemPlan(recId) {
  try {
    const res  = await fetch(`/api/recommendations/${encodeURIComponent(recId)}/remediation-plan`);
    if (!res.ok) throw new Error((await res.json()).detail);
    const plan = await res.json();

    const body = document.getElementById('modalBody');
    body.innerHTML = `
      <div class="plan-section">
        <div class="plan-label">Identity</div>
        <strong>${escHtml(plan.identity_name)}</strong> (${escHtml(plan.identity_id)})
      </div>
      <div class="plan-section">
        <div class="plan-label">Finding Category</div>
        <strong>${escHtml(plan.finding_category)}</strong>
      </div>
      <div class="plan-section">
        <div class="plan-label">Permissions Under Review</div>
        ${plan.actions_under_review.map(a => `<code style="color:var(--sev-critical);margin-right:6px">${escHtml(a)}</code>`).join('')}
      </div>
      <div class="plan-section">
        <div class="plan-label">Proposed Change</div>
        <span>${escHtml(plan.proposed_change)}</span>
      </div>
      <div class="plan-section">
        <div class="plan-label">Dry-Run Steps</div>
        <ol>${plan.dry_run_steps.map(s => `<li>${escHtml(s)}</li>`).join('')}</ol>
      </div>
      <div class="plan-section" style="color:var(--sev-critical);font-size:12px">
        Status: <strong>${escHtml(plan.status)}</strong>
      </div>`;

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('remPlanModal').classList.add('open');
  } catch (e) {
    showBanner(`Could not load remediation plan: ${e.message}`, true);
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('remPlanModal').classList.remove('open');
}

// Close modal on Escape key
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Run scan ──────────────────────────────────────────────────────

async function runScan() {
  const mode = document.getElementById('modeSelect').value;
  const btn  = document.getElementById('scanBtn');
  btn.textContent = '⏳ Scanning…';
  btn.disabled = true;

  try {
    const res  = await fetch('/api/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Scan failed');

    showBanner(`✅ ${mode === 'live' ? 'Live AWS' : 'Demo'} scan complete — ${data.identities_scanned} identities loaded.`);
    activeIdentityId = null;
    await loadAll();
  } catch (e) {
    showBanner(`Scan error: ${e.message}`, true);
  } finally {
    btn.textContent = '▶ Run Scan';
    btn.disabled = false;
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────

async function loadAll() {
  await Promise.all([loadSummary(), loadIdentities()]);
  // Reset detail panel
  document.getElementById('detailPlaceholder').style.display = 'flex';
  document.getElementById('detailContent').style.display = 'none';
}

// Initial load
loadAll();
