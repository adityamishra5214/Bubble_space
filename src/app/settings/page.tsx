'use client';

import React, { useState, useEffect } from 'react';
import { AppShell, useApp } from '@/layout/AppShell';
import { Button } from '@/ui/Button';
import { Avatar } from '@/ui/Avatar';
import { Building2, User, Shield, RotateCcw, Check, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser, refreshData } = useApp();
  const [companyName, setCompanyName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (user?.company) {
      setCompanyName(user.company.name);
    }
  }, [user]);

  const handleReSeed = async () => {
    if (!confirm('Re-seed the database with the initial Acme Corp demo data?')) return;
    setIsSeeding(true);
    try {
      // In dev mode, trigger seed endpoint or prompt
      alert('To re-seed fresh demo data at any time, run: npm run db:seed in your terminal.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AppShell title="System Settings">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Company Settings */}
        <div className="bg-[#15191D] border border-[#2A3036] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-[#2A3036]">
            <div className="p-2.5 rounded-xl bg-[#0284C7]/20 text-[#38BDF8] border border-[#0284C7]/40">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F2F4F5]">Organization Workspace</h2>
              <p className="text-xs text-[#8C959F]">Company name and tenant identity.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#8C959F] uppercase tracking-wider mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-sm text-[#F2F4F5] focus:border-[#38BDF8] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="bg-[#15191D] border border-[#2A3036] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-[#2A3036]">
            <div className="p-2.5 rounded-xl bg-[#0284C7]/20 text-[#38BDF8] border border-[#0284C7]/40">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F2F4F5]">Your Profile</h2>
              <p className="text-xs text-[#8C959F]">Personal identity in the organization graph.</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-4 p-4 bg-[#0B0D0F] border border-[#2A3036] rounded-xl">
              <Avatar name={user.name} avatar={user.avatar} size="lg" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#F2F4F5]">{user.name}</div>
                <div className="text-xs text-[#38BDF8]">{user.designation || 'Team Member'}</div>
                <div className="text-xs text-[#8C959F]">{user.email}</div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#15191D] border border-[#2A3036] text-[#8C959F]">
                  <Shield className="w-3 h-3 text-[#38BDF8]" /> Role: {user.role}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Developer & Demo Helper */}
        <div className="bg-[#15191D] border border-[#2A3036] rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8C959F] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#38BDF8]" />
              Demo Data & Database State
            </div>
          </div>
          <p className="text-xs text-[#8C959F]">
            The SQLite database is stored locally in <code className="text-[#38BDF8]">prisma/dev.db</code> with multi-tenant company isolation. To reset with 17 interconnected tasks and the full Acme hierarchy, run:
          </p>
          <div className="p-3 bg-[#0B0D0F] border border-[#2A3036] rounded-lg font-mono text-xs text-[#38BDF8] select-all">
            npm run db:seed
          </div>
        </div>
      </div>
    </AppShell>
  );
}
