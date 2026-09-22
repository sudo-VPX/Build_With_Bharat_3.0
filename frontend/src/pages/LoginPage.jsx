import React from 'react';
import { Shield } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const LoginPage = ({ navigate }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F2] px-4">
    <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/')}>
      <img src="/logo.jpg" alt="CloudGuard Logo" className="w-9 h-9 object-contain" />
      <span className="font-bold text-2xl tracking-tight text-[#171717]">CloudGuard</span>
    </div>
    <Card className="w-full max-w-md shadow-sm">
      <h2 className="text-2xl font-bold text-[#171717] mb-1">Sign in</h2>
      <p className="text-[#6B6B63] text-sm mb-8">Access your cloud security dashboard.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#171717] mb-1.5">Email address</label>
          <input type="email" defaultValue="admin@cloudguard.com" className="w-full px-4 py-2.5 rounded-xl border border-[#E4E5DC] focus:outline-none focus:border-[#4D6B16] bg-white text-[#171717]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#171717] mb-1.5">Password</label>
          <input type="password" defaultValue="1234567890" className="w-full px-4 py-2.5 rounded-xl border border-[#E4E5DC] focus:outline-none focus:border-[#4D6B16] bg-white text-[#171717]" />
        </div>
        <Button variant="primary" className="w-full py-3 mt-2 rounded-xl" onClick={() => navigate('/app/dashboard')}>
          Sign in to Dashboard
        </Button>
      </div>
    </Card>
  </div>
);

export default LoginPage;
