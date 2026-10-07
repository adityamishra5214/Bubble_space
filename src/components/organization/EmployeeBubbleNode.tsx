'use client';

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Avatar } from '@/ui/Avatar';
import { EmployeeWithStats } from '@/types';
import { AlertCircle, Star } from 'lucide-react';

export interface EmployeeNodeData {
  employee: EmployeeWithStats;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const EmployeeBubbleNode = memo(({ data, selected }: NodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const nodeData = data as unknown as EmployeeNodeData;
  const employee = nodeData?.employee;

  if (!employee) return null;

  const isFounder = employee.role === 'FOUNDER';
  const hasOverdue = employee.stats?.overdueCount > 0;
  const activeCount = employee.stats?.activeCount || 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData?.onSelect) {
      nodeData.onSelect();
    }
  };

  return (
    <div
      className="relative flex flex-col items-center group cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Top Connection Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#1C1A17] !w-2.5 !h-2.5 !border-2 !border-[#FFFFFF]"
      />

      {/* Circular Avatar Node */}
      <div className="relative">
        <div
          className={`w-16 h-16 rounded-full p-1 transition-all duration-200 flex items-center justify-center ${
            selected
              ? 'ring-4 ring-[#1C1A17] ring-offset-2 ring-offset-[#F7F5F0] scale-105'
              : isFounder
              ? 'ring-4 ring-[#EAB308] shadow-md'
              : hasOverdue
              ? 'ring-3 ring-[#EF4444] shadow-md'
              : 'ring-3 ring-[#1C1A17] shadow-sm hover:scale-105'
          }`}
        >
          <Avatar
            name={employee.name}
            avatar={employee.avatar}
            size="lg"
            className="border-none"
          />
        </div>

        {/* Founder Star */}
        {isFounder && (
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#EAB308] text-[#1C1A17] flex items-center justify-center border-2 border-[#FFFFFF] shadow-sm"
            title="Founder & CEO"
          >
            <Star className="w-3 h-3 fill-current" />
          </div>
        )}

        {/* Overdue Coral Alert Badge */}
        {hasOverdue && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EF4444] text-white flex items-center justify-center border-2 border-[#FFFFFF] font-bold text-xs shadow-md animate-pulse-subtle"
            title={`${employee.stats.overdueCount} Overdue Task(s)`}
          >
            !
          </div>
        )}
      </div>

      {/* Attached Role Card underneath */}
      <div
        className={`mt-2 px-3 py-1.5 rounded-xl border-2 transition-all text-center min-w-[130px] shadow-sm ${
          hasOverdue
            ? 'bg-[#FEF2F2] border-[#EF4444]'
            : 'bg-[#FFFFFF] border-[#1C1A17] hover:border-[#38BDF8]'
        }`}
      >
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-xs font-bold text-[#1C1A17]">{employee.name}</span>
          <span className="text-[10px] text-[#736D64] font-medium truncate max-w-[80px]">
            {employee.designation?.split(' ')[0] || 'Member'}
          </span>
        </div>

        <div className="mt-1 pt-1 border-t border-[#E8E4DC] flex items-center justify-center gap-1.5 text-[10px] font-mono">
          {hasOverdue ? (
            <span className="text-[#DC2626] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              {activeCount} Tasks • {employee.stats.overdueCount} Overdue
            </span>
          ) : (
            <span className="text-[#736D64] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              {activeCount} Tasks • All on track
            </span>
          )}
        </div>
      </div>

      {/* Hover Card */}
      {isHovered && (
        <div className="absolute top-28 z-50 w-60 p-3.5 rounded-2xl bg-[#FFFFFF] border-2 border-[#1C1A17] shadow-2xl pointer-events-none text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2.5 mb-2 pb-2 border-b border-[#E8E4DC]">
            <Avatar name={employee.name} size="sm" isFounder={isFounder} />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1C1A17] truncate">{employee.name}</div>
              <div className="text-[10px] text-[#736D64] font-medium">{employee.designation}</div>
            </div>
          </div>

          <div className="space-y-1 text-[11px] text-[#736D64]">
            {employee.department && (
              <div className="flex justify-between">
                <span>Dept:</span>
                <span className="text-[#1C1A17] font-semibold">{employee.department.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Active Tasks:</span>
              <span className="text-[#1C1A17] font-mono font-bold">
                {employee.stats?.activeCount || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Overdue:</span>
              <span
                className={`font-mono font-bold ${
                  hasOverdue ? 'text-red-500' : 'text-[#736D64]'
                }`}
              >
                {employee.stats?.overdueCount || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Completed:</span>
              <span className="text-emerald-600 font-mono font-bold">
                {employee.stats?.completedCount || 0}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-[#E8E4DC] text-[9px] text-center text-[#9B9489] uppercase tracking-wider font-mono">
            Click node to open drawer & tasks
          </div>
        </div>
      )}

      {/* Bottom Connection Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#1C1A17] !w-2.5 !h-2.5 !border-2 !border-[#FFFFFF]"
      />
    </div>
  );
});

EmployeeBubbleNode.displayName = 'EmployeeBubbleNode';
