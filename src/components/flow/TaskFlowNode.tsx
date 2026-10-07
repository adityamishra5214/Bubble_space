'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Avatar } from '@/ui/Avatar';
import { StatusBadge, PriorityBadge } from '@/ui/Badge';
import { Task } from '@/types';
import { formatDueDate } from '@/lib/utils';
import { Calendar, AlertCircle } from 'lucide-react';

export interface TaskNodeData {
  task: Task;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const TaskFlowNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as TaskNodeData;
  const task = nodeData?.task;

  if (!task) return null;

  const dueInfo = formatDueDate(task.dueDate);
  const isBlocked = task.status === 'BLOCKED';
  const isDone = task.status === 'DONE';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData?.onSelect) {
      nodeData.onSelect();
    }
  };

  // Pastel accent tab color
  const getTabColor = () => {
    if (isDone) return 'bg-[#86EFAC]';
    if (isBlocked) return 'bg-[#FCA5A5]';
    if (task.status === 'IN_PROGRESS') return 'bg-[#93C5FD]';
    return 'bg-[#CBD5E1]';
  };

  return (
    <div
      onClick={handleClick}
      className={`relative w-80 rounded-2xl bg-[#FFFFFF] border-2 transition-all duration-200 cursor-pointer select-none group shadow-sm p-4 pt-3.5 ${
        selected
          ? 'ring-4 ring-[#1C1A17] ring-offset-2 ring-offset-[#F7F5F0]'
          : task.isOverdue || isBlocked
          ? 'border-[#EF4444]'
          : isDone
          ? 'border-[#10B981]'
          : 'border-[#1C1A17] hover:border-[#2563EB]'
      }`}
    >
      {/* Top Accent Tab Header */}
      <div
        className={`absolute -top-1.5 left-8 px-4 h-2.5 rounded-full shadow-xs ${getTabColor()}`}
      />

      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#1C1A17] !w-2.5 !h-2.5 !border-2 !border-[#FFFFFF]"
      />

      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-[#1C1A17] !w-2.5 !h-2.5 !border-2 !border-[#FFFFFF]"
      />

      {/* Status & Priority Row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <StatusBadge status={task.status} size="sm" />
        <PriorityBadge priority={task.priority} size="sm" />
      </div>

      {/* Task Title */}
      <h3 className="text-sm font-extrabold text-[#1C1A17] group-hover:text-[#2563EB] transition-colors line-clamp-2 leading-snug mb-1.5 font-sans">
        {task.title}
      </h3>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-[11px] text-[#736D64] line-clamp-2 leading-relaxed mb-3">
          {task.description}
        </p>
      )}

      {/* Bottom Assignee & Flow Pill */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#E8E4DC] text-[11px]">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {task.assignee ? (
            <>
              <Avatar name={task.assignee.name} avatar={task.assignee.avatar} size="xs" />
              <span className="font-bold text-[#1C1A17] truncate text-xs">
                {task.assignee.name}
              </span>
            </>
          ) : (
            <span className="text-[#9B9489] italic text-xs">Unassigned</span>
          )}
        </div>

        {task.flow ? (
          <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#DCD7CE] text-[10px] font-mono text-[#736D64] truncate max-w-[120px] font-semibold">
            {task.flow.name}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-[#9B9489]">{dueInfo.text}</span>
        )}
      </div>

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-[#1C1A17] !w-2.5 !h-2.5 !border-2 !border-[#FFFFFF]"
      />

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#1C1A17] !w-2.5 !h-2.5 !border-2 !border-[#FFFFFF]"
      />
    </div>
  );
});

TaskFlowNode.displayName = 'TaskFlowNode';
