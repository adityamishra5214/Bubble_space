'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/ui/Button';
import {
  Building2,
  User,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface EmployeeInput {
  name: string;
  email: string;
  designation: string;
  departmentName: string;
  reportsToEmail: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [companyName, setCompanyName] = useState('');

  // Step 2
  const [founderName, setFounderName] = useState('');
  const [founderEmail, setFounderEmail] = useState('');
  const [founderPassword, setFounderPassword] = useState('');
  const [founderDesignation, setFounderDesignation] = useState('Founder & CEO');

  // Step 3
  const [employees, setEmployees] = useState<EmployeeInput[]>([
    {
      name: 'Engineering Lead',
      email: 'eng.lead@company.com',
      designation: 'Engineering Lead',
      departmentName: 'Engineering',
      reportsToEmail: '',
    },
    {
      name: 'Marketing Lead',
      email: 'marketing.lead@company.com',
      designation: 'Marketing Lead',
      departmentName: 'Marketing',
      reportsToEmail: '',
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddEmployeeRow = () => {
    setEmployees([
      ...employees,
      {
        name: '',
        email: '',
        designation: '',
        departmentName: 'Engineering',
        reportsToEmail: founderEmail,
      },
    ]);
  };

  const handleRemoveEmployeeRow = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const handleUpdateEmployee = (index: number, field: keyof EmployeeInput, val: string) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: val };
    setEmployees(updated);
  };

  const handleFinishOnboarding = async () => {
    setIsLoading(true);
    setError('');

    try {
      const validEmployees = employees.filter((e) => e.name.trim() && e.email.trim());

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          founder: {
            name: founderName.trim(),
            email: founderEmail.trim().toLowerCase(),
            password: founderPassword,
            designation: founderDesignation.trim() || 'Founder & CEO',
          },
          employees: validEmployees,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      setStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D0F] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#0284C7]/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-2xl space-y-6 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="font-mono text-xl font-bold tracking-wider text-[#F2F4F5]">
            FLOW <span className="text-[#38BDF8]">•</span> Setup
          </div>
          <p className="text-xs text-[#8C959F]">Configure your company operating system</p>
        </div>

        {/* Stepper Header */}
        <div className="flex items-center justify-between px-8 py-3 bg-[#15191D] border border-[#2A3036] rounded-xl text-xs">
          <div
            className={`flex items-center gap-2 font-medium ${
              step === 1 ? 'text-[#38BDF8]' : step > 1 ? 'text-emerald-400' : 'text-[#57606A]'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono">
              1
            </span>
            Company
          </div>
          <div className="w-12 h-px bg-[#2A3036]" />
          <div
            className={`flex items-center gap-2 font-medium ${
              step === 2 ? 'text-[#38BDF8]' : step > 2 ? 'text-emerald-400' : 'text-[#57606A]'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono">
              2
            </span>
            Founder Profile
          </div>
          <div className="w-12 h-px bg-[#2A3036]" />
          <div
            className={`flex items-center gap-2 font-medium ${
              step === 3 ? 'text-[#38BDF8]' : step > 3 ? 'text-emerald-400' : 'text-[#57606A]'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono">
              3
            </span>
            Team Hierarchy
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#15191D] border border-[#2A3036] rounded-2xl p-6 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 text-xs bg-red-950/60 border border-red-800/60 text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* STEP 1: Company Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#0284C7]/20 text-[#38BDF8] border border-[#0284C7]/40">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F2F4F5]">What is your company name?</h2>
                  <p className="text-xs text-[#8C959F]">This will isolate all organization data.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8C959F] uppercase tracking-wider mb-1.5">
                  Company / Organization Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Innovations"
                  className="w-full px-3.5 py-2.5 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-sm text-[#F2F4F5] placeholder-[#57606A] focus:border-[#38BDF8] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-[#2A3036]">
                <Button
                  variant="primary"
                  disabled={!companyName.trim()}
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Founder Setup
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Founder Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#0284C7]/20 text-[#38BDF8] border border-[#0284C7]/40">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F2F4F5]">Create Founder Account</h2>
                  <p className="text-xs text-[#8C959F]">
                    This account will hold top-level organization authority.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8C959F] uppercase tracking-wider mb-1.5">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={founderName}
                    onChange={(e) => setFounderName(e.target.value)}
                    placeholder="e.g. Aditya Sharma"
                    className="w-full px-3.5 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-sm text-[#F2F4F5] focus:border-[#38BDF8] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8C959F] uppercase tracking-wider mb-1.5">
                    Your Designation
                  </label>
                  <input
                    type="text"
                    value={founderDesignation}
                    onChange={(e) => setFounderDesignation(e.target.value)}
                    placeholder="Founder & CEO"
                    className="w-full px-3.5 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-sm text-[#F2F4F5] focus:border-[#38BDF8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8C959F] uppercase tracking-wider mb-1.5">
                  Work Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={founderEmail}
                  onChange={(e) => setFounderEmail(e.target.value)}
                  placeholder="aditya@company.com"
                  className="w-full px-3.5 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-sm text-[#F2F4F5] focus:border-[#38BDF8] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8C959F] uppercase tracking-wider mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={founderPassword}
                  onChange={(e) => setFounderPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-sm text-[#F2F4F5] focus:border-[#38BDF8] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#2A3036]">
                <Button variant="ghost" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!founderName.trim() || !founderEmail.trim() || founderPassword.length < 6}
                  onClick={() => setStep(3)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Team Hierarchy
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Initial Team Members */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#0284C7]/20 text-[#38BDF8] border border-[#0284C7]/40">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#F2F4F5]">Add Team Members</h2>
                    <p className="text-xs text-[#8C959F]">
                      FLOW will automatically construct your reporting hierarchy graph.
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddEmployeeRow}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Row
                </Button>
              </div>

              {/* Rows */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {employees.map((emp, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#0B0D0F] border border-[#2A3036] rounded-xl space-y-2 relative"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={emp.name}
                        onChange={(e) => handleUpdateEmployee(idx, 'name', e.target.value)}
                        placeholder="Employee Name"
                        className="px-2.5 py-1.5 bg-[#15191D] border border-[#2A3036] rounded-lg text-xs text-[#F2F4F5] focus:border-[#38BDF8] focus:outline-hidden"
                      />
                      <input
                        type="email"
                        value={emp.email}
                        onChange={(e) => handleUpdateEmployee(idx, 'email', e.target.value)}
                        placeholder="Email Address"
                        className="px-2.5 py-1.5 bg-[#15191D] border border-[#2A3036] rounded-lg text-xs text-[#F2F4F5] focus:border-[#38BDF8] focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={emp.designation}
                        onChange={(e) => handleUpdateEmployee(idx, 'designation', e.target.value)}
                        placeholder="Designation / Role"
                        className="px-2.5 py-1.5 bg-[#15191D] border border-[#2A3036] rounded-lg text-xs text-[#F2F4F5] focus:border-[#38BDF8] focus:outline-hidden"
                      />
                      <select
                        value={emp.departmentName}
                        onChange={(e) => handleUpdateEmployee(idx, 'departmentName', e.target.value)}
                        className="px-2.5 py-1.5 bg-[#15191D] border border-[#2A3036] rounded-lg text-xs text-[#F2F4F5] focus:border-[#38BDF8] focus:outline-hidden"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Product">Product</option>
                        <option value="Operations">Operations</option>
                        <option value="Design">Design</option>
                      </select>
                    </div>

                    {employees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployeeRow(idx)}
                        className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Remove member
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#2A3036]">
                <Button variant="ghost" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  isLoading={isLoading}
                  onClick={handleFinishOnboarding}
                  rightIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Build Organization Graph
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Ready Screen */}
          {step === 4 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#F2F4F5]">Your organization is ready!</h2>
                <p className="text-xs text-[#8C959F] max-w-sm mx-auto">
                  {companyName} has been initialized with reporting hierarchies and visual workspace nodes.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/organization')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Open Organization Graph
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Existing user link */}
        <div className="text-center text-xs text-[#8C959F]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#38BDF8] font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
