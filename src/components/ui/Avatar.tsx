import React from 'react';
import { cn, getInitials } from '@/lib/utils';
import { Star, AlertCircle } from 'lucide-react';

interface AvatarProps {
  name: string;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  hasOverdue?: boolean;
  isFounder?: boolean;
}

export function Avatar({
  name,
  avatar,
  size = 'md',
  className,
  hasOverdue,
  isFounder,
}: AvatarProps) {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-20 h-20 text-xl font-extrabold',
  };

  const initials = getInitials(name);

  return (
    <div className="relative inline-flex shrink-0">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className={cn('rounded-full object-cover border-2 border-[#1C1A17] shadow-sm', sizeMap[size], className)}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-mono border-2 border-[#1C1A17] bg-[#1C1A17] text-[#FAF8F5] select-none shadow-sm',
            sizeMap[size],
            className
          )}
        >
          {initials}
        </div>
      )}

      {/* Founder Gold Star Badge */}
      {isFounder && (
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#EAB308] text-[#1C1A17] flex items-center justify-center border border-[#1C1A17] shadow-xs"
          title="Founder"
        >
          <Star className="w-2.5 h-2.5 fill-current" />
        </div>
      )}

      {/* Overdue Coral Alert Badge */}
      {hasOverdue && !isFounder && (
        <div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white flex items-center justify-center border-2 border-[#FFFFFF] font-bold text-[10px] animate-pulse-subtle shadow-xs"
          title="Has overdue tasks"
        >
          !
        </div>
      )}
    </div>
  );
}
