import React from 'react';
import { FileText } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const Dashboard = ({ summary, identities }) => {
  const chartData = summary?.chartData || [
    { name: 'Mon', incidents: 0, remediated: 0 },
    { name: 'Tue', incidents: 0, remediated: 0 },
    { name: 'Wed', incidents: 0, remediated: 0 },
    { name: 'Thu', incidents: 0, remediated: 0 },
    { name: 'Fri', incidents: 0, remediated: 0 },
    { name: 'Sat', incidents: 0, remediated: 0 },
    { name: 'Sun', incidents: 0, remediated: 0 },
  ];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Overview</h1>
          <p className="text-[#6B6B63] mt-0.5 text-sm">Your cloud security posture at a glance.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Identities', value: summary?.total_identities ?? '—', color: 'text-[#171717]' },
          { label: 'Drift Findings', value: summary?.drift_findings ?? '—', color: 'text-[#E5780F]' },
          { label: 'High Risk', value: summary?.high_risk ?? '—', color: 'text-[#D64545]' },
          { label: 'Critical', value: summary?.critical ?? '—', color: 'text-[#D64545]' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-semibold text-[#92928A] mb-2">{label}</p>
            <p className={`text-4xl font-bold ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Mode banner */}
      {summary && (
        <div className={`rounded-2xl px-5 py-3 flex items-center gap-3 text-sm ${summary.mode === 'live' ? 'bg-[#EAF4EB] border border-[#2F7D32]/20' : 'bg-[#FEF5E5] border border-[#C77B00]/20'}`}>
          <span className={`font-bold ${summary.mode === 'live' ? 'text-[#2F7D32]' : 'text-[#C77B00]'}`}>
            {summary.mode === 'live' ? '🟢 LIVE AWS SCAN' : '🟡 DEMO MODE'}
          </span>
          <span className="text-[#6B6B63]">
            {summary.mode === 'live' ? 'Connected to your AWS account — read-only.' : 'Showing synthetic demo data. Switch to Live Scan for real AWS data.'}
          </span>
          {summary.pending_review > 0 && (
            <span className="ml-auto bg-[#E5780F] text-white text-xs font-bold px-3 py-1 rounded-full">{summary.pending_review} pending review</span>
          )}
        </div>
      )}

      {/* Chart */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-[#6B6B63] mb-5">Incidents vs Remediations (7 Days)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E5DC" vertical={false} />
              <XAxis dataKey="name" stroke="#92928A" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#92928A" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E4E5DC', fontSize: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="incidents" stroke="#D64545" strokeWidth={2.5} dot={{ r: 3 }} name="New Incidents" />
              <Line type="monotone" dataKey="remediated" stroke="#4D6B16" strokeWidth={2.5} dot={{ r: 3 }} name="Remediated" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top identities preview */}
      {identities && identities.length > 0 && (
        <Card noPadding className="overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E4E5DC]">
            <h3 className="text-sm font-semibold text-[#171717]">Top Risk Identities</h3>
          </div>
          <div className="divide-y divide-[#E4E5DC]">
            {identities.slice(0, 4).map(id => (
              <div key={id.identity_id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F7F7F2]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F1F3EC] flex items-center justify-center text-xs font-bold text-[#4D6B16]">
                    {id.identity_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#171717]">{id.identity_name}</p>
                    <p className="text-xs text-[#92928A]">{id.identity_type} · {id.finding_count} findings</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge type={id.severity.toLowerCase()}>{id.severity}</Badge>
                  <span className="text-sm font-bold text-[#171717]">{id.risk_score}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
