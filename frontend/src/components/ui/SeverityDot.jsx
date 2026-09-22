import React from 'react';

const SeverityDot = ({ severity }) => {
  const colors = { CRITICAL: '#D64545', HIGH: '#E5780F', MEDIUM: '#C77B00', LOW: '#2F7D32' };
  return <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ background: colors[severity] || '#92928A' }} />;
};

export default SeverityDot;
