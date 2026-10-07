'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/ui/Modal';
import { Avatar } from '@/ui/Avatar';
import { StatusBadge, PriorityBadge } from '@/ui/Badge';
import { Search, User, CheckSquare, GitCommit } from 'lucide-react';
import { UserSummary, Task, Flow } from '@/types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (taskId: string) => void;
  onSelectEmployee: (employeeId: string) => void;
  onSelectFlow: (flowId: string) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectTask,
  onSelectEmployee,
  onSelectFlow,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [employees, setEmployees] = useState<UserSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setEmployees([]);
      setTasks([]);
      setFlows([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setEmployees([]);
      setTasks([]);
      setFlows([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setEmployees(data.employees || []);
          setTasks(data.tasks || []);
          setFlows(data.flows || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const hasResults = employees.length > 0 || tasks.length > 0 || flows.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Workspace" maxWidth="lg">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C959F] absolute left-3.5 top-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees, tasks, work streams..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0B0D0F] border border-[#2A3036] rounded-xl text-sm text-[#F2F4F5] placeholder-[#57606A] focus:border-[#38BDF8] focus:outline-hidden"
          />
        </div>

        {/* Results Stream */}
        <div className="max-h-96 overflow-y-auto space-y-4 pt-1">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-[#8C959F]">Searching workspace...</div>
          ) : query && !hasResults ? (
            <div className="py-8 text-center text-xs text-[#57606A]">
              No matches found for &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Employees */}
              {employees.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[#8C959F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> People ({employees.length})
                  </div>
                  <div className="space-y-1">
                    {employees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => {
                          onSelectEmployee(emp.id);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#15191D] border border-[#2A3036] hover:border-[#38BDF8] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={emp.name} avatar={emp.avatar} size="xs" />
                          <div>
                            <div className="text-xs font-semibold text-[#F2F4F5]">{emp.name}</div>
                            <div className="text-[10px] text-[#8C959F]">{emp.designation}</div>
                          </div>
                        </div>
                        {emp.department && (
                          <span className="text-[10px] text-[#57606A] px-2 py-0.5 rounded bg-[#0B0D0F]">
                            {emp.department.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {tasks.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[#8C959F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3 h-3" /> Tasks ({tasks.length})
                  </div>
                  <div className="space-y-1">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          onSelectTask(task.id);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#15191D] border border-[#2A3036] hover:border-[#38BDF8] cursor-pointer transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="text-xs font-semibold text-[#F2F4F5] truncate">
                            {task.title}
                          </div>
                          <div className="text-[10px] text-[#8C959F] flex items-center gap-1.5 mt-0.5">
                            <span>Owner: {task.assignee?.name || 'Unassigned'}</span>
                            {task.flow && <span>• {task.flow.name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PriorityBadge priority={task.priority} size="sm" />
                          <StatusBadge status={task.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flows */}
              {flows.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[#8C959F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GitCommit className="w-3 h-3" /> Work Streams ({flows.length})
                  </div>
                  <div className="space-y-1">
                    {flows.map((flow) => (
                      <div
                        key={flow.id}
                        onClick={() => {
                          onSelectFlow(flow.id);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#15191D] border border-[#2A3036] hover:border-[#38BDF8] cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[#F2F4F5]">{flow.name}</div>
                          {flow.description && (
                            <div className="text-[10px] text-[#8C959F] truncate max-w-sm">
                              {flow.description}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-[#38BDF8] font-mono">
                          {flow._count?.tasks || 0} tasks
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
