'use client';

import React from 'react';
import { AppShell, useApp } from '@/layout/AppShell';
import { OrganizationGraph } from '@/organization/OrganizationGraph';

export default function OrganizationPage() {
  const { openEmployeeDetail, openAddEmployeeModal, dataVersion } = useApp();

  return (
    <AppShell title="Organization & Hierarchy">
      <OrganizationGraph
        onSelectEmployee={openEmployeeDetail}
        onOpenAddPerson={openAddEmployeeModal}
        dataVersion={dataVersion}
      />
    </AppShell>
  );
}
