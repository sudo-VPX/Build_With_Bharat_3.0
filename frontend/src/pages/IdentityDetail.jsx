import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const IdentityDetail = ({ identity, onReview, navigate }) => {
  if (!identity) return <div className="py-20 text-center text-[#92928A]">Loading identity…</div>;
  const id = identity.identity;
  const permissions = identity.permission_table || [];
  const findings = identity.findings || [];
  const recs = identity.recommendations || [];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/app/users')} className="text-[#6B6B63] hover:text-[#171717] transition-colors text-sm">← Identities</button>
      </div>

      {/* Header */}
      <Card className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-[#F1F3EC] flex items-center justify-center text-xl font-bold text-[#4D6B16]">
          {id.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#171717]">{id.name}</h1>
          <div className="flex flex-wrap gap-4 mt-1 text-xs text-[#6B6B63]">
            <span>🆔 {id.id}</span>
            <span>🏷️ {id.identity_type}</span>
            {id.account_id && <span>🏦 {id.account_id}</span>}
            {id.last_activity && <span>📅 Last active: {id.last_activity}</span>}
            {id.mfa_enabled === true && <span className="text-[#2F7D32] font-semibold">🔐 MFA On</span>}
            {id.mfa_enabled === false && <span className="text-[#D64545] font-semibold">⚠️ MFA Off</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[#92928A] mb-1">Risk Score</p>
            <p className="text-3xl font-bold text-[#171717]">{identity.risk_score}<span className="text-base text-[#92928A]">/100</span></p>
          </div>
          <Badge type={identity.severity.toLowerCase()} className="text-sm px-3 py-1.5">{identity.severity}</Badge>
        </div>
      </Card>

      {/* Permissions table */}
      <div>
        <h2 className="text-base font-bold text-[#171717] mb-3">Permissions ({permissions.length})</h2>
        <Card noPadding className="overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E5DC] bg-[#F7F7F2]">
                {['Permission', 'Resource', 'Source', 'CloudTrail Status'].map(h => (
                  <th key={h} className="py-3 px-5 text-[11px] font-bold text-[#92928A] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((p, i) => (
                <tr key={i} className="border-b border-[#E4E5DC] hover:bg-[#F7F7F2] last:border-b-0">
                  <td className="py-3.5 px-5"><code className="text-[#4D6B16] text-xs bg-[#F1F3EC] px-2 py-1 rounded">{p.action}</code></td>
                  <td className="py-3.5 px-5 text-xs text-[#6B6B63] max-w-[200px] truncate" title={p.resource}>{p.resource}</td>
                  <td className="py-3.5 px-5 text-xs text-[#92928A]">{p.source}</td>
                  <td className="py-3.5 px-5">
                    <Badge type={p.status}>
                      {p.status === 'used' ? '✅ Used' : p.status === 'unused' ? '❌ Unused' : '⚡ Wildcard'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Findings */}
      {findings.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-[#171717] mb-3">Findings ({findings.length})</h2>
          <div className="space-y-3">
            {findings.map(f => (
              <div key={f.id} className={`rounded-2xl p-5 border-l-4 ${f.severity === 'CRITICAL' ? 'bg-[#FDECEE] border-[#D64545]' : f.severity === 'HIGH' ? 'bg-[#FFF2E5] border-[#E5780F]' : f.severity === 'MEDIUM' ? 'bg-[#FEF5E5] border-[#C77B00]' : 'bg-[#F7F7F2] border-[#E4E5DC]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge type={f.severity.toLowerCase()}>{f.severity}</Badge>
                  <span className="text-sm font-bold text-[#171717]">{f.title}</span>
                </div>
                <p className="text-xs text-[#6B6B63] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recs.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-[#171717] mb-3">Recommendations ({recs.length})</h2>
          <div className="space-y-3">
            {recs.map(r => (
              <Card key={r.id} className="p-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#171717] mb-1">{r.title}</p>
                    <p className="text-xs text-[#6B6B63] leading-relaxed line-clamp-2">{r.rationale}</p>
                  </div>
                  <Badge type={r.status === 'APPROVED' ? 'approved' : r.status === 'REJECTED' ? 'rejected' : 'pending'} className="shrink-0">
                    {r.status === 'PENDING_HUMAN_REVIEW' ? 'Pending Review' : r.status}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" className="text-xs py-1.5 px-3" onClick={() => onReview(r, id.name)}>
                    Review →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentityDetail;
