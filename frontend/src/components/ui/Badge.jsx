import React from 'react';

const Badge = ({ children, type = 'default', className = '' }) => {
  const types = {
    critical: 'bg-[#FDECEE] text-[#D64545]',
    high: 'bg-[#FDECEE] text-[#D64545]',
    medium: 'bg-[#FEF5E5] text-[#C77B00]',
    warning: 'bg-[#FEF5E5] text-[#C77B00]',
    low: 'bg-[#EAF4EB] text-[#2F7D32]',
    success: 'bg-[#EAF4EB] text-[#2F7D32]',
    aws: 'bg-[#FFF2E5] text-[#E5780F]',
    azure: 'bg-[#E6F0FF] text-[#0066CC]',
    gcp: 'bg-[#E6F0FF] text-[#1565C0]',
    default: 'bg-[#F7F7F2] text-[#6B6B63]',
    active: 'bg-[#EAF4EB] text-[#2F7D32]',
    pending: 'bg-[#FEF5E5] text-[#C77B00]',
    approved: 'bg-[#EAF4EB] text-[#2F7D32]',
    rejected: 'bg-[#FDECEE] text-[#D64545]',
    used: 'bg-[#EAF4EB] text-[#2F7D32]',
    unused: 'bg-[#FDECEE] text-[#D64545]',
    wildcard: 'bg-[#F3F0FF] text-[#6B3FA0]',
  };
  const t = (type || 'default').toLowerCase();
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${types[t] || types.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
