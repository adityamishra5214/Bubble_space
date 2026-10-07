'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/ui/Button';
import { Sparkles, ArrowRight, ShieldCheck, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/organization');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
    handleLogin(null as any, quickEmail, 'password123');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col justify-center items-center p-6 select-none relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1C1A17] text-[#FAF8F5] text-xl font-black font-mono shadow-md mb-2">
            F
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1C1A17] font-mono flex items-center justify-center gap-2">
            FLOW
            <span className="px-2 py-0.5 rounded-md bg-[#FEF08A] text-[#854D0E] font-bold text-xs font-mono border border-[#EAB308]/40">
              NOTEBOOK OS
            </span>
          </h1>
          <p className="text-xs text-[#736D64] max-w-xs mx-auto font-medium">
            The single source of truth for company structure, work flows, and single-owner accountability.
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-[#FFFFFF] border-2 border-[#1C1A17] rounded-3xl p-7 shadow-lg space-y-5">
          {error && (
            <div className="p-3 text-xs bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-[#736D64] uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9B9489] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-sm text-[#1C1A17] placeholder-[#9B9489] focus:border-[#1C1A17] focus:outline-hidden transition-colors font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-[#736D64] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9B9489] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#DCD7CE] rounded-xl text-sm text-[#1C1A17] placeholder-[#9B9489] focus:border-[#1C1A17] focus:outline-hidden transition-colors font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 justify-center text-sm font-bold shadow-sm"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-4 border-t border-[#E8E4DC] space-y-2">
            <div className="text-[10px] font-mono font-bold text-[#9B9489] uppercase tracking-wider text-center">
              Quick Demo Logins
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('aditya@acme.com')}
                className="p-2.5 bg-[#FAF8F5] border border-[#DCD7CE] hover:border-[#1C1A17] rounded-xl text-left transition-all cursor-pointer shadow-xs"
              >
                <div className="text-xs font-bold text-[#1C1A17]">Aditya</div>
                <div className="text-[10px] text-[#854D0E] font-semibold">Founder & CEO</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('rahul@acme.com')}
                className="p-2.5 bg-[#FAF8F5] border border-[#DCD7CE] hover:border-[#1C1A17] rounded-xl text-left transition-all cursor-pointer shadow-xs"
              >
                <div className="text-xs font-bold text-[#1C1A17]">Rahul</div>
                <div className="text-[10px] text-[#2563EB] font-semibold">Engineering Lead</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('priya@acme.com')}
                className="p-2.5 bg-[#FAF8F5] border border-[#DCD7CE] hover:border-[#1C1A17] rounded-xl text-left transition-all cursor-pointer shadow-xs"
              >
                <div className="text-xs font-bold text-[#1C1A17]">Priya</div>
                <div className="text-[10px] text-[#2563EB] font-semibold">Marketing Lead</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('neha@acme.com')}
                className="p-2.5 bg-[#FAF8F5] border border-[#DCD7CE] hover:border-[#1C1A17] rounded-xl text-left transition-all cursor-pointer shadow-xs"
              >
                <div className="text-xs font-bold text-[#1C1A17]">Neha</div>
                <div className="text-[10px] text-[#059669] font-semibold">Frontend Eng</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-[#736D64] font-medium">
          Need to register a new organization?{' '}
          <Link href="/onboarding" className="text-[#1C1A17] font-bold hover:underline">
            Create Company Setup
          </Link>
        </div>
      </div>
    </div>
  );
}
