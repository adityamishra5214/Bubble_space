import React from 'react';
import { cn } from '@/lib/utils';
import { TaskStatus, TaskPriority } from '@/types';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  const styles: Record<TaskStatus, { bg: string; text: string; dot: string; label: string; border: string }> = {
    TODO: {
      bg: 'bg-[#F4F1EB]',
      border: 'border-[#DCD7CE]',
      text: 'text-[#736D64]',
      dot: 'bg-[#9B9489]',
      label: 'TODO',
    },
    IN_PROGRESS: {
      bg: 'bg-[#EFF6FF]',
      border: 'border-[#BFDBFE]',
      text: 'text-[#1D4ED8]',
      dot: 'bg-[#2563EB]',
      label: 'IN PROGRESS',
    },
    BLOCKED: {
      bg: 'bg-[#FEF2F2]',
      border: 'border-[#FECACA]',
      text: 'text-[#DC2626]',
      dot: 'bg-[#EF4444]',
      label: 'BLOCKED',
    },
    DONE: {
      bg: 'bg-[#ECFDF5]',
      border: 'border-[#A7F3D0]',
      text: 'text-[#059669]',
      dot: 'bg-[#10B981]',
      label: 'DONE',
    },
  };

  const config = styles[status] || styles.TODO;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold font-mono border rounded-full uppercase tracking-wider',
        config.bg,
        config.border,
        config.text,
        sizeClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, className, size = 'md' }: PriorityBadgeProps) {
  const styles: Record<TaskPriority, { text: string; bg: string; border: string; label: string }> = {
    LOW: {
      text: 'text-[#736D64]',
      bg: 'bg-[#F4F1EB]',
      border: 'border-[#DCD7CE]',
      label: 'LOW',
    },
    MEDIUM: {
      text: 'text-[#736D64]',
      bg: 'bg-[#F4F1EB]',
      border: 'border-[#DCD7CE]',
      label: 'MEDIUM',
    },
    HIGH: {
      text: 'text-[#736D64]',
      bg: 'bg-[#EFECE6]',
      border: 'border-[#DCD7CE]',
      label: 'HIGH',
    },
    URGENT: {
      text: 'text-[#854D0E]',
      bg: 'bg-[#FEF08A]',
      border: 'border-[#EAB308]',
      label: '! URGENT (P0)',
    },
  };

  const config = styles[priority] || styles.MEDIUM;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold font-mono border rounded-md uppercase tracking-wider',
        config.bg,
        config.border,
        config.text,
        sizeClasses,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function DepartmentBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-[#736D64] bg-[#F4F1EB] border border-[#DCD7CE] rounded-full',
        className
      )}
    >
      {name}
    </span>
  );
}
