import React from 'react';

const Card = ({ children, className = '', noPadding = false }) => (
  <div className={`bg-white border border-[#E4E5DC] rounded-2xl shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

export default Card;
