'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { UserSummary, Department } from '@/types';
import { UserPlus } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAdded: () => void;
  defaultManagerId?: string;
}

export function AddEmployeeModal({
  isOpen,
  onClose,
  onEmployeeAdded,
  defaultManagerId,
}: AddEmployeeModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [role, setRole] = useState<'EMPLOYEE' | 'ADMIN' | 'FOUNDER'>('EMPLOYEE');
  const [employees, setEmployees] = useState<UserSummary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/organization')
        .then((res) => res.json())
        .then((data) => {
          if (data.employees) {
            setEmployees(data.employees);
            if (defaultManagerId) {
              setManagerId(defaultManagerId);
            } else if (data.employees.length > 0 && !managerId) {
              // Default to first founder
              const founder = data.employees.find((e: UserSummary) => e.role === 'FOUNDER');
              setManagerId(founder ? founder.id : data.employees[0].id);
            }
          }
        });

      fetch('/api/departments')
        .then((res) => res.json())
        .then((data) => {
          if (data.departments) {
            setDepartments(data.departments);
            if (data.departments.length > 0 && !departmentId) {
              setDepartmentId(data.departments[0].id);
            }
          }
        });

      setError('');
    }
  }, [isOpen, defaultManagerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          designation: designation.trim() || 'Team Member',
          departmentId: departmentId || null,
          managerId: managerId || null,
          role,
          password: 'password123',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add team member');
      }

      setName('');
      setEmail('');
      setDesignation('');
      onEmployeeAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="+ Add Team Member" description="Add an employee and position them in the hierarchy">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-950/50 border border-red-800/50 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            className="w-full px-3.5 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] placeholder-[#57606A] text-sm focus:border-[#38BDF8] focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
            Work Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@company.com"
            className="w-full px-3.5 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] placeholder-[#57606A] text-sm focus:border-[#38BDF8] focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
              Designation / Title
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="w-full px-3 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] text-sm focus:border-[#38BDF8] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] text-sm focus:border-[#38BDF8] focus:outline-hidden"
            >
              <option value="">No Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
              Reports To (Manager)
            </label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] text-sm focus:border-[#38BDF8] focus:outline-hidden"
            >
              <option value="">None (Top Level / Founder)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.designation || 'Team'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8C959F] mb-1.5 uppercase tracking-wider">
              Access Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'EMPLOYEE' | 'ADMIN' | 'FOUNDER')}
              className="w-full px-3 py-2 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[#F2F4F5] text-sm focus:border-[#38BDF8] focus:outline-hidden"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
              <option value="FOUNDER">Founder</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-[#0B0D0F] border border-[#2A3036] rounded-lg text-[11px] text-[#8C959F]">
          Initial password for new member will be set to: <code className="text-[#38BDF8]">password123</code>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A3036]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Team Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}
