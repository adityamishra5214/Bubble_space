'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/ui/Button';
import { Avatar } from '@/ui/Avatar';
import { UserSummary, Notification } from '@/types';
import { Search, Plus, Bell, Check, Sparkles, Feather } from 'lucide-react';
import { format } from 'date-fns';

interface TopbarProps {
  user: UserSummary | null;
  title: string;
  onOpenNewTask: () => void;
  onOpenAddPerson: () => void;
  onOpenSearch: () => void;
  onSelectNotificationTask?: (taskId: string) => void;
}

export function Topbar({
  user,
  title,
  onOpenNewTask,
  onOpenAddPerson,
  onOpenSearch,
  onSelectNotificationTask,
}: TopbarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }

    if (notif.link && onSelectNotificationTask) {
      const match = notif.link.match(/id=([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        onSelectNotificationTask(match[1]);
      }
    }
    setIsNotifOpen(false);
  };

  return (
    <header className="h-16 bg-[#FAF8F5] border-b border-[#DCD7CE] flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left: Company & Flow Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-[#1C1A17] font-bold tracking-tight">
            {user?.company?.name || 'Acme Corp'}
          </span>
          <span className="text-[#9B9489]">/</span>
          <span className="text-[#736D64] font-medium">{title}</span>
        </div>

        {/* System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#FEF9C3] border border-[#FDE047] rounded-full text-xs text-[#854D0E] font-mono shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>All nodes connected • 84% on track</span>
        </div>
      </div>

      {/* Right: Search, Notifications, New Task, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#FFFFFF] border border-[#DCD7CE] hover:border-[#1C1A17] text-xs text-[#736D64] rounded-full transition-all cursor-pointer w-48 md:w-64 shadow-xs"
        >
          <Search className="w-3.5 h-3.5 text-[#9B9489]" />
          <span className="truncate">Search people, tasks, flows...</span>
          <kbd className="ml-auto text-[10px] bg-[#EFECE6] border border-[#DCD7CE] px-1.5 py-0.5 rounded text-[#736D64] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-full bg-[#FFFFFF] border border-[#DCD7CE] text-[#736D64] hover:text-[#1C1A17] hover:border-[#1C1A17] transition-all relative cursor-pointer shadow-xs"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#DCD7CE] rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#DCD7CE] bg-[#FAF8F5]">
                <div className="text-xs font-bold text-[#1C1A17]">Notifications</div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#E8E4DC]">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 text-xs cursor-pointer hover:bg-[#FAF8F5] transition-colors ${
                        !n.read ? 'bg-[#FEF9C3]/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1C1A17]">{n.title}</span>
                        <span className="text-[10px] text-[#9B9489]">
                          {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-xs text-[#736D64] mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-[#9B9489]">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* New Task Solid Black Button */}
        <Button
          variant="primary"
          size="sm"
          className="rounded-full px-4"
          onClick={onOpenNewTask}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Task
        </Button>

        {/* User Pill */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#DCD7CE]">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-[#1C1A17] leading-tight">{user.name}</div>
              <div className="text-[10px] text-[#736D64] capitalize font-mono">{user.role.toLowerCase()}</div>
            </div>
            <Avatar name={user.name} avatar={user.avatar} size="sm" isFounder={user.role === 'FOUNDER'} />
          </div>
        )}
      </div>
    </header>
  );
}
