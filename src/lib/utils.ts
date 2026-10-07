import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday, isTomorrow, isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDueDate(dateInput: Date | string | null | undefined): {
  text: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  if (!dateInput) {
    return { text: 'No due date', isOverdue: false, isToday: false };
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return { text: 'Invalid date', isOverdue: false, isToday: false };
  }

  const overdue = isPast(date) && !isToday(date);
  const dueToday = isToday(date);

  if (dueToday) {
    return { text: 'Due today', isOverdue: false, isToday: true };
  }
  if (isTomorrow(date)) {
    return { text: 'Due tomorrow', isOverdue: false, isToday: false };
  }
  if (isYesterday(date)) {
    return { text: 'Due yesterday', isOverdue: true, isToday: false };
  }
  if (overdue) {
    return { text: `Overdue (${format(date, 'MMM d')})`, isOverdue: true, isToday: false };
  }

  return { text: `Due ${format(date, 'MMM d')}`, isOverdue: false, isToday: false };
}

export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'TODO':
      return 'To Do';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'BLOCKED':
      return 'Blocked';
    case 'DONE':
      return 'Done';
    default:
      return status;
  }
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'Low';
    case 'MEDIUM':
      return 'Medium';
    case 'HIGH':
      return 'High';
    case 'URGENT':
      return 'Urgent';
    default:
      return priority;
  }
}
