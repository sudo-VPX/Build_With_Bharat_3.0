import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const PricingPage = ({ navigate }) => (
  <div className="min-h-screen bg-[#F7F7F2] flex flex-col">
    <nav className="flex justify-between items-center px-8 py-5 max-w-7xl w-full mx-auto">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <img src="/logo.jpg" alt="CloudGuard Logo" className="w-7 h-7 object-contain" /><span className="font-bold text-xl tracking-tight">CloudGuard</span>
      </div>
      <Button variant="outline" onClick={() => navigate('/')}>← Back to Home</Button>
    </nav>
    <div className="flex-1 max-w-5xl mx-auto w-full px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="font-display text-5xl font-bold text-[#171717] mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-[#6B6B63]">Unlock advanced security insights and approved remediation workflows.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { name: 'Monthly', sub: 'Perfect for short-term audits.', price: '₹599', per: '/mo', features: ['Full Dashboard Access', 'Basic Permission Drift', 'Standard Support'], popular: false },
          { name: 'Quarterly', sub: 'Ideal for growing teams.', price: '₹1,599', per: '/3mo', features: ['Everything in Monthly', 'Advanced AI Insights', 'JIT Temporary Access', 'Priority Support'], popular: true },
          { name: 'Annually', sub: 'Maximum value and security.', price: '₹5,999', per: '/yr', features: ['Everything in Quarterly', 'AI Auto-remediation', 'Unlimited Queries', 'Dedicated Manager'], popular: false },
        ].map(plan => (
          <Card key={plan.name} className={`flex flex-col relative ${plan.popular ? 'border-[#4D6B16] shadow-md scale-105 z-10' : ''}`}>
            {plan.popular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4D6B16] text-white text-xs font-bold px-4 py-1.5 rounded-full">MOST POPULAR</div>}
            <h3 className="text-xl font-bold text-[#171717] mb-1">{plan.name}</h3>
            <p className="text-sm text-[#6B6B63] mb-5">{plan.sub}</p>
            <div className="mb-6"><span className="text-4xl font-bold text-[#171717]">{plan.price}</span><span className="text-[#92928A] ml-1">{plan.per}</span></div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map(f => <li key={f} className="flex items-start gap-2.5 text-sm text-[#171717]"><CheckCircle className="w-4 h-4 text-[#4D6B16] shrink-0 mt-0.5" />{f}</li>)}
            </ul>
            <Button variant={plan.popular ? 'primary' : 'secondary'} className="w-full py-3" onClick={() => navigate('/login')}>
              Choose {plan.name}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

export default PricingPage;
