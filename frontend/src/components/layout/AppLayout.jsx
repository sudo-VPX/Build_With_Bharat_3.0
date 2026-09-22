import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Users, Activity, Clock, AlertTriangle,
  CheckCircle, FileText, Settings, Search, Menu,
  LogOut, ChevronDown, RefreshCw, Star
} from 'lucide-react';
import Button from '../ui/Button';

const AppLayout = ({ currentRoute, navigate, children, onRunScan, scanning, mode }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handle = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const links = [
    { group: 'MONITOR' },
    { id: 'dashboard', label: 'Dashboard', icon: Activity, path: '/app/dashboard' },
    { id: 'users', label: 'Users & Access', icon: Users, path: '/app/users' },
    { id: 'drift', label: 'Permission Drift', icon: AlertTriangle, path: '/app/drift' },
    { id: 'temp', label: 'Temp Access', icon: Clock, path: '/app/temp' },
    { group: 'ACT' },
    { id: 'recs', label: 'Recommendations', icon: CheckCircle, path: '/app/recs' },
    { id: 'audit', label: 'Audit Logs', icon: FileText, path: '/app/audit' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/app/settings' },
  ];

  return (
    <div className="min-h-screen flex bg-[#F7F7F2]">
      {/* Sidebar */}
      <aside className={`w-60 bg-[#F7F7F2] border-r border-[#E4E5DC] flex flex-col h-screen sticky top-0 transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative z-30`}>
        <div className="px-5 py-5 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo.jpg" alt="CloudGuard Logo" className="w-7 h-7 object-contain" />
          <span className="font-bold text-lg tracking-tight text-[#171717]">CloudGuard</span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto hide-scrollbar">
          {links.map((link, i) => {
            if (link.group) return <div key={i} className="px-3 pt-5 pb-2 text-[10px] font-bold text-[#92928A] tracking-widest">{link.group}</div>;
            const isActive = currentRoute === link.path || currentRoute.startsWith(`/app/identity`) && link.path === '/app/users';
            const Icon = link.icon;
            return (
              <button key={link.id} onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white text-[#4D6B16] shadow-sm border border-[#E4E5DC]' : 'text-[#6B6B63] hover:bg-white/60 hover:text-[#171717]'}`}>
                <Icon className={`w-[17px] h-[17px] ${isActive ? 'text-[#4D6B16]' : 'text-[#92928A]'}`} />
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Scan button at bottom of sidebar */}
        <div className="p-4 border-t border-[#E4E5DC]">
          <div className="flex gap-2 mb-2">
            <select id="scanModeSelect" className="flex-1 text-xs bg-white border border-[#E4E5DC] rounded-xl px-3 py-2 text-[#171717]">
              <option value="demo">Demo Mode</option>
              <option value="live">Live AWS Scan</option>
            </select>
          </div>
          <Button variant="primary" className="w-full py-2.5" disabled={scanning}
            onClick={() => {
              const sel = document.getElementById('scanModeSelect');
              onRunScan(sel?.value || 'demo');
            }}>
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning…' : 'Run Scan'}
          </Button>
          <p className={`text-[10px] text-center mt-2 font-semibold ${mode === 'live' ? 'text-[#2F7D32]' : 'text-[#C77B00]'}`}>
            {mode === 'live' ? '🟢 LIVE MODE' : '🟡 DEMO MODE'}
          </p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen w-full min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#F7F7F2] border-b border-[#E4E5DC] flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-[#6B6B63]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#92928A]" />
              <input type="text" placeholder="Search identities, findings…" className="pl-9 pr-4 py-2 rounded-xl border border-[#E4E5DC] bg-white text-sm focus:outline-none focus:border-[#4D6B16] text-[#171717] placeholder:text-[#92928A] w-64" />
            </div>
          </div>
          <div className="flex items-center gap-3" ref={profileRef}>
            <Button onClick={() => navigate('/pricing')} variant="secondary" className="hidden lg:flex text-xs py-2 px-3">
              <Star className="w-3.5 h-3.5 text-[#C77B00]" /> Upgrade Pro
            </Button>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-[#E4E5DC]/50">
                <div className="w-9 h-9 rounded-full bg-white border border-[#E4E5DC] shadow-sm flex items-center justify-center text-[#4D6B16] font-bold text-xs">AD</div>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B6B63]" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-[#E4E5DC] overflow-hidden py-1 z-30">
                  <div className="px-4 py-3 border-b border-[#E4E5DC] bg-[#F7F7F2]">
                    <p className="text-sm font-semibold text-[#171717]">Admin User</p>
                    <p className="text-xs text-[#6B6B63]">admin@cloudguard.com</p>
                  </div>
                  <button onClick={() => { setProfileOpen(false); navigate('/app/settings'); }} className="w-full text-left px-4 py-2.5 text-sm text-[#171717] hover:bg-[#F7F7F2] flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#92928A]" /> Settings
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate('/login'); }} className="w-full text-left px-4 py-2.5 text-sm text-[#D64545] hover:bg-[#FDECEE] flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
