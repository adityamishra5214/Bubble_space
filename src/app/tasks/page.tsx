'use client';

import React from 'react';
import { AppShell, useApp } from '@/layout/AppShell';
import { TasksTable } from '@/tasks/TasksTable';

export default function AllTasksPage() {
  const { openTaskDetail, openNewTaskModal, dataVersion } = useApp();

  return (
    <AppShell title="Global Task Registry">
      <TasksTable
        onSelectTask={openTaskDetail}
        onOpenNewTask={() => openNewTaskModal()}
        dataVersion={dataVersion}
      />
    </AppShell>
  );
}
