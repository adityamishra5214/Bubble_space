'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar } from '@/ui/Avatar';
import { cn } from '@/lib/utils';
import { UserSummary } from '@/types';
import {
  Network,
  GitBranch,
  CheckCircle2,
  ListTodo,
  Activity,
  LayoutDashboard,
  Settings,
  BookOpen,
  LogOut,
  FolderGit2,
} from 'lucide-react';

interface SidebarProps {
  user: UserSummary | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Task Flow Canvas', href: '/flow', icon: FolderGit2 },
    { name: 'Operational Pulse', href: '/dashboard', icon: Activity },
    { name: 'Organization Graph', href: '/organization', icon: Network },
    { name: 'My Tasks', href: '/tasks/my', icon: CheckCircle2 },
    { name: 'All Tasks Registry', href: '/tasks', icon: ListTodo },
    { name: 'Activity Feed', href: '/activity', icon: BookOpen },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <aside className="w-64 bg-[#EFECE6] border-r border-[#DCD7CE] flex flex-col shrink-0 select-none h-screen fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#DCD7CE] bg-[#FAF8F5]">
        <Link href="/flow" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#1C1A17] flex items-center justify-center text-[#FAF8F5] font-black text-sm shadow-sm group-hover:scale-105 transition-transform font-mono">
            FLOW
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-tight text-base text-[#1C1A17] font-mono">
              FLOW
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#736D64] font-bold text-[9px] font-mono border border-[#DCD7CE]">
              OS
            </span>
          </div>
        </Link>
        <span className="w-2 h-2 rounded-full bg-[#10B981]" title="System Online" />
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {/* Workspace Log Section */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#9B9489] font-mono">
            WORKSPACE LOG
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/' &&
                pathname.startsWith(item.href) &&
                (item.href !== '/tasks' || pathname === '/tasks'));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group cursor-pointer',
                  isActive
                    ? 'bg-[#1C1A17] text-[#FAF8F5] shadow-sm'
                    : 'text-[#736D64] hover:text-[#1C1A17] hover:bg-[#FAF8F5]'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-[#FAF8F5]' : 'text-[#9B9489] group-hover:text-[#1C1A17]'
                  )}
                />
                <span className="flex-1">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Notebook Index Section */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#9B9489] font-mono">
            NOTEBOOK INDEX
          </div>

          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all group',
              pathname === '/settings'
                ? 'bg-[#1C1A17] text-[#FAF8F5]'
                : 'text-[#736D64] hover:text-[#1C1A17] hover:bg-[#FAF8F5]'
            )}
          >
            <Settings
              className={cn(
                'w-4 h-4',
                pathname === '/settings' ? 'text-[#FAF8F5]' : 'text-[#9B9489] group-hover:text-[#1C1A17]'
              )}
            />
            <span>Settings & Layout</span>
          </Link>

          <Link
            href="/organization"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-[#736D64] hover:text-[#1C1A17] hover:bg-[#FAF8F5] transition-all group"
          >
            <BookOpen className="w-4 h-4 text-[#9B9489] group-hover:text-[#1C1A17]" />
            <span>Field Manual</span>
          </Link>
        </div>
      </div>

      {/* Footer Edition Stamp */}
      <div className="p-4 border-t border-[#DCD7CE] bg-[#FAF8F5]">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#EFECE6] border border-[#DCD7CE]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-[#1C1A17]">Edition v2.4 Notebook</span>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white text-[#10B981] font-extrabold border border-[#DCD7CE]">
            READY
          </span>
        </div>
      </div>
    </aside>
  );
}
