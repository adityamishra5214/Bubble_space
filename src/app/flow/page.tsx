'use client';

import React from 'react';
import { AppShell, useApp } from '@/layout/AppShell';
import { TaskFlowCanvas } from '@/flow/TaskFlowCanvas';

export default function FlowPage() {
  const { openTaskDetail, openNewTaskModal, dataVersion } = useApp();

  return (
    <AppShell title="Task Flow & Operational Map">
      <TaskFlowCanvas
        onSelectTask={openTaskDetail}
        onOpenNewTask={(flowId) => openNewTaskModal(undefined, flowId)}
        dataVersion={dataVersion}
      />
    </AppShell>
  );
}
