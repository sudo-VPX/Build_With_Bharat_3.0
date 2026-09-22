import React from 'react';
import { Zap } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const RecommendationsPage = ({ recommendations, onReview, onViewPlan }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-2xl font-bold text-[#171717]">Recommendations</h1>
        <p className="text-sm text-[#6B6B63] mt-0.5">Human-review queue — every change requires your approval.</p>
      </div>
    </div>
    <div className="space-y-3">
      {(recommendations || []).map(r => (
        <Card key={r.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5">
          <div className="w-10 h-10 bg-[#F1F3EC] rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-[#4D6B16]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#171717] mb-0.5">{r.title}</p>
            <p className="text-xs text-[#6B6B63]">
              <span className="font-mono bg-[#F7F7F2] px-1.5 py-0.5 rounded border border-[#E4E5DC]">{r.identity_name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge type={r.status === 'APPROVED' ? 'approved' : r.status === 'REJECTED' ? 'rejected' : 'pending'}>
              {r.status === 'PENDING_HUMAN_REVIEW' ? '⏳ Pending' : r.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
            </Badge>
            {r.status === 'PENDING_HUMAN_REVIEW' && (
              <Button variant="secondary" className="text-xs py-1.5 px-3" onClick={() => onReview(r, r.identity_name)}>
                Review →
              </Button>
            )}
            {r.status === 'APPROVED' && (
              <Button variant="ghost" className="text-xs py-1.5 px-3" onClick={() => onViewPlan(r.id)}>
                🔧 View Plan
              </Button>
            )}
          </div>
        </Card>
      ))}
      {!recommendations?.length && <p className="text-center py-12 text-sm text-[#92928A]">No recommendations. Run a scan.</p>}
    </div>
  </div>
);

export default RecommendationsPage;
