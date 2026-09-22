import React from 'react';
import { CheckCircle, X } from 'lucide-react';

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 bg-[#171717] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-bounce-once max-w-sm">
    <CheckCircle className="w-4 h-4 text-[#4D6B16] shrink-0" />
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 text-[#92928A] hover:text-white"><X className="w-4 h-4" /></button>
  </div>
);

export default Toast;
