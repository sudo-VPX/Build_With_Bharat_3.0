import React from 'react';
import { ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SeverityDot from '../components/ui/SeverityDot';

const IdentitiesPage = ({ identities, navigate }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-2xl font-bold text-[#171717]">Users & Access</h1>
        <p className="text-sm text-[#6B6B63] mt-0.5">IAM identities detected in current scan.</p>
      </div>
    </div>
    <Card noPadding className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E4E5DC] bg-[#F7F7F2]">
              {['Identity', 'Type', 'Risk Score', 'Severity', 'Findings', 'Recommendations', ''].map(h => (
                <th key={h} className="py-3 px-5 text-[11px] font-bold text-[#92928A] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(identities || []).map((id, i) => (
              <tr key={id.identity_id} className="border-b border-[#E4E5DC] hover:bg-[#F7F7F2] last:border-b-0">
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#F1F3EC] flex items-center justify-center text-xs font-bold text-[#4D6B16]">
                      {id.identity_name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-[#171717] text-sm">{id.identity_name}</span>
                  </div>
                </td>
                <td className="py-4 px-5"><Badge type={id.identity_type === 'role' ? 'azure' : 'aws'}>{id.identity_type}</Badge></td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-[#E4E5DC] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${id.risk_score}%`, background: id.risk_score >= 70 ? '#D64545' : id.risk_score >= 45 ? '#E5780F' : id.risk_score >= 20 ? '#C77B00' : '#2F7D32' }} />
                    </div>
                    <span className="text-sm font-bold text-[#171717]">{id.risk_score}</span>
                  </div>
                </td>
                <td className="py-4 px-5"><Badge type={id.severity.toLowerCase()}><SeverityDot severity={id.severity} />{id.severity}</Badge></td>
                <td className="py-4 px-5 text-sm text-[#171717] font-semibold">{id.finding_count}</td>
                <td className="py-4 px-5 text-sm text-[#171717]">{id.recommendation_count}</td>
                <td className="py-4 px-5">
                  <button className="text-[#4D6B16] hover:text-[#6F8F24] p-1.5 rounded-lg hover:bg-[#F1F3EC]" onClick={() => navigate(`/app/identity/${id.identity_id}`)}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!identities?.length && <tr><td colSpan={7} className="py-12 text-center text-sm text-[#92928A]">No identities loaded. Run a scan.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

export default IdentitiesPage;
