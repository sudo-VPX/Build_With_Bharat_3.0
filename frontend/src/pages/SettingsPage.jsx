import React from 'react';
import { User, Star, Server } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const SettingsPage = ({ navigate, mode, onScanModeChange }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-[#171717]">Settings & Accounts</h1>
      <p className="text-sm text-[#6B6B63] mt-0.5">Manage preferences and cloud integrations.</p>
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-base font-bold text-[#171717] mb-4 flex items-center gap-2"><User className="w-4 h-4 text-[#4D6B16]" /> Profile Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6B6B63] mb-1">Full Name</label>
            <input type="text" defaultValue="Admin User" className="w-full px-3 py-2 rounded-xl border border-[#E4E5DC] bg-[#F7F7F2] text-[#171717] text-sm" readOnly />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B63] mb-1">Email</label>
            <input type="email" defaultValue="admin@cloudguard.com" className="w-full px-3 py-2 rounded-xl border border-[#E4E5DC] bg-[#F7F7F2] text-[#171717] text-sm" readOnly />
          </div>
          <Button variant="secondary" className="w-full">Update Profile</Button>
        </div>
      </Card>
      <Card>
        <h3 className="text-base font-bold text-[#171717] mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-[#C77B00]" /> Billing & Plan</h3>
        <div className="bg-[#FEF5E5] border border-[#C77B00]/20 rounded-2xl p-4 mb-4">
          <p className="text-sm font-bold text-[#C77B00] mb-1">Current Plan: Free Tier</p>
          <p className="text-xs text-[#C77B00]/80">Upgrade to unlock AI insights and priority support.</p>
        </div>
        <Button variant="primary" className="w-full mb-2" onClick={() => navigate('/pricing')}>Upgrade to Pro</Button>
        <Button variant="outline" className="w-full">View Billing History</Button>
      </Card>
      <Card className="md:col-span-2">
        <h3 className="text-base font-bold text-[#171717] mb-4 flex items-center gap-2"><Server className="w-4 h-4 text-[#4D6B16]" /> Cloud Integrations</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3.5 border border-[#E4E5DC] rounded-2xl bg-white">
            <div className="flex items-center gap-3">
              <div className="bg-[#FFF2E5] px-2.5 py-1.5 rounded-lg text-[#E5780F] font-bold text-xs">AWS</div>
              <div>
                <p className="text-sm font-semibold text-[#171717]">AWS Organization</p>
                <p className="text-xs text-[#92928A]">Profile: CloudGuard · Region: ap-south-1</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge type={mode === 'live' ? 'success' : 'warning'}>{mode === 'live' ? 'Connected' : 'Demo Mode'}</Badge>
              <Button variant="secondary" className="text-xs py-1.5 px-3">Manage</Button>
            </div>
          </div>
          <div className="flex justify-between items-center p-3.5 border border-[#E4E5DC] rounded-2xl bg-white opacity-60">
            <div className="flex items-center gap-3">
              <div className="bg-[#E6F0FF] px-2.5 py-1.5 rounded-lg text-[#0066CC] font-bold text-xs">GCP</div>
              <div>
                <p className="text-sm font-semibold text-[#171717]">Google Cloud</p>
                <p className="text-xs text-[#92928A]">Not connected — coming soon</p>
              </div>
            </div>
            <Button variant="outline" className="text-xs py-1.5 px-3">Connect</Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

export default SettingsPage;
