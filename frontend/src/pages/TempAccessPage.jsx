import React from 'react';
import { Key, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const mockTempAccess = [
  { id: 'REQ-102', user: 'bob@company.com', resource: 'Prod-DB-Cluster', duration: '4 hours', status: 'Pending Approval', requestedAt: '10 mins ago' },
  { id: 'REQ-101', user: 'alice@company.com', resource: 'EKS-Admin-Role', duration: '2 hours', status: 'Active', requestedAt: '1 hour ago' },
  { id: 'REQ-100', user: 'charlie@company.com', resource: 'Billing-Read-Only', duration: '24 hours', status: 'Expired', requestedAt: '2 days ago' },
];

const TempAccessPage = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-2xl font-bold text-[#171717]">Temporary Access</h1>
        <p className="text-sm text-[#6B6B63] mt-0.5">Just-In-Time (JIT) access requests.</p>
      </div>
      <Button variant="primary"><Key className="w-4 h-4" /> Request Access</Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {mockTempAccess.map(req => (
        <Card key={req.id} className="flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <Badge type={req.status === 'Active' ? 'success' : req.status === 'Pending Approval' ? 'warning' : 'default'}>{req.status}</Badge>
            <span className="text-xs text-[#92928A]">{req.requestedAt}</span>
          </div>
          <h4 className="text-sm font-bold text-[#171717] mb-1">{req.resource}</h4>
          <p className="text-xs text-[#6B6B63] mb-4">{req.user}</p>
          <div className="mt-auto pt-4 border-t border-[#E4E5DC] flex justify-between items-center">
            <div className="flex items-center gap-1 text-xs font-medium text-[#171717]">
              <Clock className="w-3.5 h-3.5 text-[#92928A]" /> {req.duration}
            </div>
            {req.status === 'Pending Approval' && (
              <div className="flex gap-3">
                <button className="text-xs font-medium text-[#D64545] hover:underline">Deny</button>
                <button className="text-xs font-medium text-[#4D6B16] hover:underline">Approve</button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default TempAccessPage;
