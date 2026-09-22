import React from 'react';
import {
  Shield, CheckCircle, Search, BarChart3, Target,
  Fingerprint, RefreshCw, Zap, AlertTriangle, FileText,
  Cloud, ArrowRight
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const LandingPage = ({ navigate }) => (
  <div className="min-h-screen flex flex-col bg-[#F7F7F2]">
    {/* Nav */}
    <nav className="flex justify-between items-center px-8 py-5 max-w-7xl w-full mx-auto">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <img src="/logo.jpg" alt="CloudGuard Logo" className="w-8 h-8 object-contain" />
        <span className="font-bold text-xl tracking-tight text-[#171717]">CloudGuard</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/login')} className="text-[#6B6B63] font-medium hover:text-[#171717] text-sm transition-colors">Sign in</button>
        <Button onClick={() => navigate('/pricing')} variant="primary">Upgrade to Pro</Button>
      </div>
    </nav>

    {/* Hero */}
    <section className="flex-1 max-w-7xl mx-auto w-full px-8 pt-10 pb-20 grid md:grid-cols-2 gap-16 items-center">
      <div>
        <div className="inline-flex items-center gap-2 bg-[#F1F3EC] border border-[#4D6B16]/20 text-[#4D6B16] text-xs font-bold px-4 py-2 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4D6B16]" /> Cloud Access Intelligence, Reimagined
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-[#171717] leading-[1.05] tracking-tight mb-6">
          Every permission.<br/><em className="text-[#4D6B16] not-italic">Exactly right.</em>
        </h1>
        <p className="text-lg text-[#6B6B63] leading-relaxed mb-10 max-w-lg">
          CloudGuard continuously finds and removes excessive cloud access — before it becomes your next security incident. Don't ask what access is granted. Ask what's <strong>actually used.</strong>
        </p>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => navigate('/login')} variant="primary" className="py-3.5 px-8 text-base rounded-2xl">
            Open Console <ArrowRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => navigate('/pricing')} variant="secondary" className="py-3.5 px-8 text-base rounded-2xl">
            See Pricing
          </Button>
        </div>
        <div className="flex flex-wrap gap-6 mt-10 text-xs text-[#92928A]">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-[#4D6B16]" /> No auto-mutations</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-[#4D6B16]" /> Human-approved remediation</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-[#4D6B16]" /> AWS IAM + CloudTrail</span>
        </div>
      </div>

      {/* Hero visual */}
      <div className="relative h-80 md:h-96 flex items-center justify-center">
        <div className="absolute w-72 h-72 rounded-full border border-[#E4E5DC] orbit-spin" />
        <div className="absolute w-52 h-52 rounded-full border border-dashed border-[#4D6B16]/20 orbit-spin-reverse" />
        {/* Shield center */}
        <div className="relative z-10 w-28 h-32 flex flex-col items-center justify-center text-white rounded-t-full rounded-b-[40%]"
          style={{ background: 'linear-gradient(145deg, #6F8F24, #3D5210)', clipPath: 'polygon(50% 0,94% 17%,88% 68%,50% 100%,12% 68%,6% 17%)' }}>
          <Shield className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-bold text-green-200">Protected</span>
        </div>
        {/* Floating cards */}
        <div className="absolute top-6 left-4 bg-white border border-[#E4E5DC] rounded-2xl px-4 py-3 shadow-lg float-card flex items-center gap-3">
          <span className="w-8 h-8 bg-[#FDECEE] text-[#D64545] rounded-xl flex items-center justify-center text-base">⚠</span>
          <div>
            <p className="text-[9px] font-bold text-[#92928A] tracking-wider">RISK DETECTED</p>
            <p className="text-xs font-bold text-[#171717]">Overprivileged access</p>
          </div>
        </div>
        <div className="absolute bottom-8 right-4 bg-white border border-[#E4E5DC] rounded-2xl px-4 py-3 shadow-lg float-card-delay flex items-center gap-3">
          <span className="w-8 h-8 bg-[#EAF4EB] text-[#2F7D32] rounded-xl flex items-center justify-center text-base">✓</span>
          <div>
            <p className="text-[9px] font-bold text-[#92928A] tracking-wider">REMEDIATION</p>
            <p className="text-xs font-bold text-[#171717]">Approved by admin</p>
          </div>
        </div>
        <div className="absolute bottom-16 left-6 bg-white border border-[#E4E5DC] rounded-2xl px-4 py-3 shadow-lg float-card flex items-center gap-3">
          <span className="w-8 h-8 bg-[#F1F3EC] text-[#4D6B16] rounded-xl flex items-center justify-center text-base">◉</span>
          <div>
            <p className="text-[9px] font-bold text-[#92928A] tracking-wider">RISK SCORE</p>
            <p className="text-xs font-bold text-[#171717]">42 <em className="text-[#2F7D32] font-normal not-italic">↓ 8 pts</em></p>
          </div>
        </div>
      </div>
    </section>

    {/* Stats */}
    <section className="bg-[#171717] py-10">
      <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[['1.2M+', 'Permissions analyzed'], ['73k', 'Risky permissions removed'], ['99.9%', 'Cloud coverage'], ['24/7', 'Continuous monitoring']].map(([v, l]) => (
          <div key={l}>
            <p className="text-3xl font-display font-bold text-[#4D6B16] mb-1">{v}</p>
            <p className="text-xs text-[#92928A]">{l}</p>
          </div>
        ))}
      </div>
    </section>

    {/* How it works */}
    <section className="py-24 bg-white border-y border-[#E4E5DC]">
      <div className="max-w-5xl mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-[#171717] mb-4">How CloudGuard Works</h2>
          <p className="text-lg text-[#6B6B63] max-w-2xl mx-auto">A seamless process from visibility to remediation — no automatic changes, always human-approved.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-[#E4E5DC]" />
          {[
            { icon: Search, n: '1', title: 'Continuous Discovery', desc: 'Map every identity, resource, and policy across AWS — continuously.' },
            { icon: BarChart3, n: '2', title: 'Intelligent Analysis', desc: 'Compare granted permissions against actual usage in CloudTrail to identify excessive risk.' },
            { icon: Target, n: '3', title: 'Approved Remediation', desc: 'Generate least-privilege recommendations. Admins review and approve. Zero automatic changes.' },
          ].map(({ icon: Icon, n, title, desc }) => (
            <div key={n} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-full border border-[#E4E5DC] flex items-center justify-center mb-5 shadow-sm">
                <Icon className="w-9 h-9 text-[#4D6B16]" />
              </div>
              <h3 className="text-lg font-bold text-[#171717] mb-2">{n}. {title}</h3>
              <p className="text-sm text-[#6B6B63] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="py-24 max-w-6xl mx-auto px-8">
      <div className="text-center mb-16">
        <h2 className="font-display text-4xl font-bold text-[#171717] mb-4">Why CloudGuard?</h2>
        <p className="text-lg text-[#6B6B63]">Everything you need to secure cloud identities in one clean platform.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: Fingerprint, title: 'Identity-First Security', desc: 'Prioritize security around the new perimeter: identities. Manage human and machine access in one place.' },
          { icon: RefreshCw, title: 'Just-In-Time Access', desc: 'Eliminate standing privileges by granting time-bound approvals for sensitive operations.' },
          { icon: Zap, title: 'Risk Engine', desc: 'Deterministic risk scores based on permission sensitivity, inactivity, wildcards, and MFA status.' },
          { icon: AlertTriangle, title: 'Drift Detection', desc: 'Get instantly alerted when permissions accumulate beyond what the identity actually needs.' },
          { icon: FileText, title: 'Audit Logs', desc: 'Full chronological record of system events, identity actions, and admin decisions.' },
          { icon: Cloud, title: 'AWS-Native', desc: 'Reads IAM policies and CloudTrail events. Uses read-only APIs — never modifies your account automatically.' },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="p-7 hover:border-[#4D6B16] transition-colors duration-300 cursor-default">
            <div className="w-10 h-10 bg-[#F1F3EC] rounded-xl flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-[#4D6B16]" />
            </div>
            <h3 className="text-base font-bold text-[#171717] mb-2">{title}</h3>
            <p className="text-sm text-[#6B6B63] leading-relaxed">{desc}</p>
          </Card>
        ))}
      </div>
    </section>

    {/* Permission compare visual */}
    <section className="py-16 bg-[#171717] mx-8 rounded-3xl mb-20">
      <div className="max-w-4xl mx-auto px-8 text-center">
        <p className="text-[10px] font-bold tracking-widest text-[#4D6B16] mb-3">MAKE THE CHANGE VISIBLE</p>
        <h2 className="font-display text-4xl font-bold text-white mb-4">Broad access in.<br /><em className="text-[#4D6B16] not-italic">Safe access out.</em></h2>
        <p className="text-[#92928A] mb-10">Every recommendation shows exactly what will change, and why.</p>
        <div className="grid grid-cols-3 items-center gap-4 max-w-xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
            <p className="text-[9px] font-bold tracking-widest text-[#92928A] mb-3">BEFORE</p>
            <p className="text-xs font-bold text-white mb-3">Excessive permissions</p>
            {['S3:*', 'EC2:*', 'IAM:*'].map(p => <code key={p} className="block text-[11px] bg-white/10 text-[#FDECEE] px-3 py-1.5 rounded-lg mb-1.5 font-mono">{p}</code>)}
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#4D6B16] font-bold">→</div>
            <p className="text-[9px] text-[#4D6B16] mt-1 font-bold">CloudGuard</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
            <p className="text-[9px] font-bold tracking-widest text-[#92928A] mb-3">AFTER</p>
            <p className="text-xs font-bold text-white mb-3">Least privilege</p>
            {['✓ S3:GetObject', '✓ EC2:Describe', '× IAM removed'].map((p, i) => (
              <code key={p} className={`block text-[11px] px-3 py-1.5 rounded-lg mb-1.5 font-mono ${i < 2 ? 'bg-[#EAF4EB]/20 text-[#A8C04A]' : 'bg-[#FDECEE]/10 text-[#f88]'}`}>{p}</code>
            ))}
          </div>
        </div>
        <Button onClick={() => navigate('/login')} variant="ghost" className="mt-12 bg-white text-[#4D6B16] hover:bg-[#F1F3EC] py-3.5 px-10 text-base rounded-2xl">
          Open CloudGuard Console <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </section>

    <footer className="bg-white border-t border-[#E4E5DC] py-10">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center text-sm text-[#6B6B63]">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <img src="/logo.jpg" alt="CloudGuard Logo" className="w-5 h-5 object-contain" />
          <span className="font-semibold text-[#171717]">CloudGuard</span>
          <span>© 2026 All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <span className="hover:text-[#171717] cursor-pointer">Privacy</span>
          <span className="hover:text-[#171717] cursor-pointer">Terms</span>
          <span className="hover:text-[#171717] cursor-pointer">Status</span>
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;
