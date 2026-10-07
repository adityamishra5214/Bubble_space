'use client';

import React from 'react';
import { AppShell, useApp } from '@/layout/AppShell';
import { MyTasksView } from '@/tasks/MyTasksView';

export default function MyTasksPage() {
  const { openTaskDetail, openNewTaskModal, dataVersion } = useApp();

  return (
    <AppShell title="My Tasks">
      <MyTasksView
        onSelectTask={openTaskDetail}
        onOpenNewTask={() => openNewTaskModal()}
        dataVersion={dataVersion}
      />
    </AppShell>
  );
}
