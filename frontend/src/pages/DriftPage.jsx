import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SeverityDot from '../components/ui/SeverityDot';

const DriftPage = ({ findings }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-2xl font-bold text-[#171717]">Permission Drift</h1>
        <p className="text-sm text-[#6B6B63] mt-0.5">Identities accumulating privileges beyond what they use.</p>
      </div>
    </div>
    <Card noPadding className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E4E5DC] bg-[#F7F7F2]">
              {['Identity', 'Severity', 'Category', 'Finding', 'Score Impact'].map(h => (
                <th key={h} className="py-3 px-5 text-[11px] font-bold text-[#92928A] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(findings || []).map((f, i) => (
              <tr key={f.id} className="border-b border-[#E4E5DC] hover:bg-[#F7F7F2] last:border-b-0">
                <td className="py-4 px-5">
                  <div className="font-semibold text-sm text-[#171717]">{f.identity_name}</div>
                  <div className="text-xs text-[#92928A] mt-0.5">{f.identity_id}</div>
                </td>
                <td className="py-4 px-5"><Badge type={f.severity.toLowerCase()}><SeverityDot severity={f.severity} />{f.severity}</Badge></td>
                <td className="py-4 px-5 text-xs text-[#6B6B63] font-mono">{f.category}</td>
                <td className="py-4 px-5 text-sm text-[#171717]">{f.title}</td>
                <td className="py-4 px-5">
                  <span className="font-bold text-[#171717]">+{f.score_impact}</span>
                  <span className="text-xs text-[#92928A] ml-1">pts</span>
                </td>
              </tr>
            ))}
            {!findings?.length && <tr><td colSpan={5} className="py-12 text-center text-sm text-[#92928A]">No findings. Run a scan.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

export default DriftPage;
