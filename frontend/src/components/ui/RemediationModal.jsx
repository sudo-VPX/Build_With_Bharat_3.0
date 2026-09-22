import React from 'react';
import { X } from 'lucide-react';

const RemediationModal = ({ plan, onClose }) => {
  if (!plan) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-[#4D6B16] px-8 py-5 text-white flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-[#A8C04A] mb-1">DRY-RUN REMEDIATION PLAN</p>
            <h2 className="text-lg font-bold">{plan.identity_name}</h2>
            <p className="text-sm text-[#c8d8a0] mt-0.5">{plan.finding_category}</p>
          </div>
          <button onClick={onClose} className="text-[#A8C04A] hover:text-white mt-0.5"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 space-y-5">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-[#92928A] mb-2">PERMISSIONS UNDER REVIEW</p>
            <div className="flex flex-wrap gap-2">
              {(plan.actions_under_review || []).map(a => (
                <code key={a} className="text-xs bg-[#FDECEE] text-[#D64545] px-3 py-1 rounded-lg font-mono">{a}</code>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-widest text-[#92928A] mb-2">DRY-RUN STEPS</p>
            <ol className="space-y-2">
              {(plan.dry_run_steps || []).map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#171717]">
                  <span className="w-5 h-5 rounded-full bg-[#F1F3EC] text-[#4D6B16] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step.replace(/^\d+\.\s*/, '')}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-[#FEF5E5] border border-[#C77B00]/20 rounded-xl p-4">
            <p className="text-xs text-[#C77B00] font-semibold leading-relaxed">⚠️ {plan.warning}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemediationModal;
