'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CreateTaskModal } from '@/tasks/CreateTaskModal';
import { TaskDetailDrawer } from '@/tasks/TaskDetailDrawer';
import { AddEmployeeModal } from '@/organization/AddEmployeeModal';
import { EmployeeDrawer } from '@/organization/EmployeeDrawer';
import { GlobalSearchModal } from './GlobalSearchModal';
import { UserSummary, EmployeeWithStats } from '@/types';
import { useRouter } from 'next/navigation';

interface AppContextType {
  user: UserSummary | null;
  refreshUser: () => void;
  openTaskDetail: (taskId: string) => void;
  openEmployeeDetail: (employeeId: string) => void;
  openNewTaskModal: (assigneeId?: string, flowId?: string) => void;
  openAddEmployeeModal: (managerId?: string) => void;
  refreshData: () => void;
  dataVersion: number;
}

const AppContext = createContext<AppContextType>({
  user: null,
  refreshUser: () => {},
  openTaskDetail: () => {},
  openEmployeeDetail: () => {},
  openNewTaskModal: () => {},
  openAddEmployeeModal: () => {},
  refreshData: () => {},
  dataVersion: 0,
});

export const useApp = () => useContext(AppContext);

interface AppShellProps {
  children: React.ReactNode;
  title: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  // Modals & Drawers state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalDefaults, setTaskModalDefaults] = useState<{ assigneeId?: string; flowId?: string }>({});
  
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [addEmployeeDefaultManager, setAddEmployeeDefaultManager] = useState<string | undefined>();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeEmployee, setActiveEmployee] = useState<EmployeeWithStats | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Global hotkeys (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshData = () => {
    setDataVersion((v) => v + 1);
  };

  const openTaskDetail = (taskId: string) => {
    setActiveTaskId(taskId);
  };

  const openEmployeeDetail = async (employeeId: string) => {
    try {
      const res = await fetch('/api/organization');
      if (res.ok) {
        const data = await res.json();
        const found = (data.employees || []).find((e: EmployeeWithStats) => e.id === employeeId);
        if (found) {
          setActiveEmployee(found);
        }
      }
    } catch (err) {
      console.error('Failed to load employee for drawer:', err);
    }
  };

  const openNewTaskModal = (assigneeId?: string, flowId?: string) => {
    setTaskModalDefaults({ assigneeId, flowId });
    setIsTaskModalOpen(true);
  };

  const openAddEmployeeModal = (managerId?: string) => {
    setAddEmployeeDefaultManager(managerId);
    setIsAddEmployeeOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        refreshUser: fetchCurrentUser,
        openTaskDetail,
        openEmployeeDetail,
        openNewTaskModal,
        openAddEmployeeModal,
        refreshData,
        dataVersion,
      }}
    >
      <div className="min-h-screen bg-[#0B0D0F] text-[#F2F4F5] flex">
        {/* Fixed Sidebar */}
        <Sidebar user={user} />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col pl-64 min-w-0">
          <Topbar
            user={user}
            title={title}
            onOpenNewTask={() => openNewTaskModal()}
            onOpenAddPerson={() => openAddEmployeeModal()}
            onOpenSearch={() => setIsSearchOpen(true)}
            onSelectNotificationTask={(taskId) => openTaskDetail(taskId)}
          />

          <main className="flex-1 overflow-x-hidden p-6 relative">{children}</main>
        </div>

        {/* Global Modals & Drawers */}
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onTaskCreated={refreshData}
          defaultAssigneeId={taskModalDefaults.assigneeId}
          defaultFlowId={taskModalDefaults.flowId}
        />

        <AddEmployeeModal
          isOpen={isAddEmployeeOpen}
          onClose={() => setIsAddEmployeeOpen(false)}
          onEmployeeAdded={refreshData}
          defaultManagerId={addEmployeeDefaultManager}
        />

        <TaskDetailDrawer
          taskId={activeTaskId}
          isOpen={!!activeTaskId}
          onClose={() => setActiveTaskId(null)}
          onTaskUpdated={refreshData}
          onTaskDeleted={refreshData}
          onNavigateToTask={(targetId) => setActiveTaskId(targetId)}
        />

        <EmployeeDrawer
          employee={activeEmployee}
          isOpen={!!activeEmployee}
          onClose={() => setActiveEmployee(null)}
          onAssignTask={(empId) => {
            setActiveEmployee(null);
            openNewTaskModal(empId);
          }}
          onSelectTask={(taskId) => {
            setActiveEmployee(null);
            openTaskDetail(taskId);
          }}
          onSelectEmployee={(empId) => openEmployeeDetail(empId)}
          onTaskStatusChange={async (taskId, status) => {
            await fetch('/api/tasks', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: taskId, status }),
            });
            refreshData();
            if (activeEmployee) {
              openEmployeeDetail(activeEmployee.id);
            }
          }}
        />

        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectTask={(taskId) => openTaskDetail(taskId)}
          onSelectEmployee={(empId) => openEmployeeDetail(empId)}
          onSelectFlow={() => router.push('/flow')}
        />
      </div>
    </AppContext.Provider>
  );
}
