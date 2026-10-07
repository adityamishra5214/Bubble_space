'use client';

import React from 'react';
import { AppShell, useApp } from '@/layout/AppShell';
import { DashboardOverview } from '@/dashboard/DashboardOverview';

export default function DashboardPage() {
  const { openEmployeeDetail, openTaskDetail, openNewTaskModal, dataVersion } = useApp();

  return (
    <AppShell title="Operational Dashboard">
      <DashboardOverview
        onSelectEmployee={openEmployeeDetail}
        onSelectTask={openTaskDetail}
        onOpenNewTask={() => openNewTaskModal()}
        dataVersion={dataVersion}
      />
    </AppShell>
  );
}
