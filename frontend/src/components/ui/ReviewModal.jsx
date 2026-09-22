import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import Button from './Button';

const ReviewModal = ({ item, identity, onClose, onApprove, onReject, loading }) => {
  if (!item) return null;
  const isApproved = item.status === 'APPROVED';
  const isRejected = item.status === 'REJECTED';
  const isDone = isApproved || isRejected;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 text-[#92928A] hover:text-[#171717] transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <p className="text-[10px] font-bold tracking-widest text-[#92928A] mb-2">RECOMMENDATION REVIEW</p>
          <h2 className="text-xl font-bold text-[#171717] font-display">{item.title}</h2>
          {identity && <p className="text-sm text-[#6B6B63] mt-1">Identity: <span className="font-semibold text-[#171717]">{identity}</span></p>}
        </div>

        <div className="bg-[#F7F7F2] border border-[#E4E5DC] rounded-2xl p-4 mb-5">
          <p className="text-xs text-[#92928A] font-semibold mb-2">RATIONALE</p>
          <p className="text-sm text-[#171717] leading-relaxed">{item.rationale}</p>
        </div>

        <div className="bg-[#F7F7F2] border border-[#E4E5DC] rounded-2xl p-4 mb-6">
          <p className="text-xs text-[#92928A] font-semibold mb-2">PROPOSED CHANGE</p>
          <p className="text-sm text-[#171717] leading-relaxed">{item.proposed_change}</p>
        </div>

        {!isDone ? (
          <>
            <p className="text-xs text-[#6B6B63] mb-4 leading-relaxed">
              ⚠️ Human approval required. No AWS permission will be changed automatically.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onReject} disabled={loading}>
                <XCircle className="w-4 h-4 text-[#D64545]" /> Reject
              </Button>
              <Button variant="primary" className="flex-1" onClick={onApprove} disabled={loading}>
                <CheckCircle className="w-4 h-4" /> {loading ? 'Processing…' : 'Approve'}
              </Button>
            </div>
          </>
        ) : (
          <div className={`rounded-2xl p-4 text-center ${isApproved ? 'bg-[#EAF4EB] border border-[#2F7D32]/20' : 'bg-[#FDECEE] border border-[#D64545]/20'}`}>
            <p className={`font-bold ${isApproved ? 'text-[#2F7D32]' : 'text-[#D64545]'}`}>
              {isApproved ? '✅ Approved — Remediation plan available' : '❌ Rejected — No action taken'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
