import React from 'react';
import { FileText } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const mockLogs = [
  { id: 'LOG-99', time: '10:45 AM', actor: 'alice@company.com', event: 'Assumed Role', resource: 'Prod-DB-Cluster', result: 'Success' },
  { id: 'LOG-98', time: '10:12 AM', actor: 'CloudGuard System', event: 'Demo scan loaded', resource: 'All identities', result: 'Success' },
  { id: 'LOG-97', time: '09:30 AM', actor: 'bob@company.com', event: 'Recommendation Approved', resource: 'ec2:stopinstances', result: 'Success' },
  { id: 'LOG-96', time: '08:15 AM', actor: 'admin@cloudguard.com', event: 'Dashboard accessed', resource: 'Console', result: 'Success' },
];

const AuditPage = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-2xl font-bold text-[#171717]">Audit Logs</h1>
        <p className="text-sm text-[#6B6B63] mt-0.5">Chronological record of system and identity events.</p>
      </div>
      <Button variant="outline"><FileText className="w-4 h-4" /> Export CSV</Button>
    </div>
    <Card noPadding>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E4E5DC] bg-white">
            {['Time', 'Actor', 'Event', 'Resource', 'Result'].map(h => (
              <th key={h} className="py-3 px-5 text-[11px] font-bold text-[#92928A] uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mockLogs.map(log => (
            <tr key={log.id} className="border-b border-[#E4E5DC] hover:bg-[#F7F7F2] last:border-b-0">
              <td className="py-3.5 px-5 text-sm text-[#6B6B63]">{log.time}</td>
              <td className="py-3.5 px-5 text-sm font-semibold text-[#171717]">{log.actor}</td>
              <td className="py-3.5 px-5 text-sm text-[#171717]">{log.event}</td>
              <td className="py-3.5 px-5 text-sm font-mono text-[#6B6B63]">{log.resource}</td>
              <td className="py-3.5 px-5">
                <span className={`text-xs font-bold ${log.result === 'Success' ? 'text-[#2F7D32]' : 'text-[#D64545]'}`}>{log.result}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

export default AuditPage;
