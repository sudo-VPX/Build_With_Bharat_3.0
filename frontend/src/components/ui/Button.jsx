import React from 'react';

const Button = ({ children, variant = 'primary', className = '', onClick, disabled = false }) => {
  const base = 'px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm';
  const variants = {
    primary: 'bg-[#4D6B16] text-white hover:bg-[#6F8F24] shadow-sm',
    secondary: 'bg-white border border-[#E4E5DC] text-[#171717] hover:bg-[#F7F7F2]',
    outline: 'bg-transparent border border-[#E4E5DC] text-[#6B6B63] hover:text-[#171717] hover:border-[#4D6B16]',
    danger: 'bg-[#FDECEE] text-[#D64545] hover:bg-[#FBD9DD]',
    ghost: 'bg-transparent text-[#4D6B16] hover:bg-[#F1F3EC]',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default Button;
