import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.comment.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.taskConnection.deleteMany();
  await prisma.task.deleteMany();
  await prisma.flow.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.company.deleteMany();

  // 1. Create Company
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corp',
      logo: '⚡',
    },
  });

  console.log(`Created Company: ${company.name} (${company.id})`);

  // 2. Create Departments
  const deptEng = await prisma.department.create({
    data: { name: 'Engineering', companyId: company.id },
  });
  const deptMktg = await prisma.department.create({
    data: { name: 'Marketing', companyId: company.id },
  });
  const deptProd = await prisma.department.create({
    data: { name: 'Product', companyId: company.id },
  });
  const deptOps = await prisma.department.create({
    data: { name: 'Operations', companyId: company.id },
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. Create Users with Reporting Hierarchy
  // Aditya - Founder (Top level)
  const aditya = await prisma.user.create({
    data: {
      name: 'Aditya',
      email: 'aditya@acme.com',
      password: passwordHash,
      role: 'FOUNDER',
      designation: 'Founder & CEO',
      departmentId: deptProd.id,
      companyId: company.id,
      status: 'ACTIVE',
    },
  });

  // Rahul - Engineering Lead (Reports to Aditya)
  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul',
      email: 'rahul@acme.com',
      password: passwordHash,
      role: 'ADMIN',
      designation: 'Engineering Lead',
      departmentId: deptEng.id,
      managerId: aditya.id,
      companyId: company.id,
      status: 'ACTIVE',
    },
  });

  // Priya - Marketing Lead (Reports to Aditya)
  const priya = await prisma.user.create({
    data: {
      name: 'Priya',
      email: 'priya@acme.com',
      password: passwordHash,
      role: 'ADMIN',
      designation: 'Marketing Lead',
      departmentId: deptMktg.id,
      managerId: aditya.id,
      companyId: company.id,
      status: 'ACTIVE',
    },
  });

  // Aman - Backend Engineer (Reports to Rahul)
  const aman = await prisma.user.create({
    data: {
      name: 'Aman',
      email: 'aman@acme.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      designation: 'Backend Engineer',
      departmentId: deptEng.id,
      managerId: rahul.id,
      companyId: company.id,
      status: 'ACTIVE',
    },
  });

  // Neha - Frontend Engineer (Reports to Rahul)
  const neha = await prisma.user.create({
    data: {
      name: 'Neha',
      email: 'neha@acme.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      designation: 'Frontend Engineer',
      departmentId: deptEng.id,
      managerId: rahul.id,
      companyId: company.id,
      status: 'ACTIVE',
    },
  });

  // Riya - Marketing Associate (Reports to Priya)
  const riya = await prisma.user.create({
    data: {
      name: 'Riya',
      email: 'riya@acme.com',
      password: passwordHash,
      role: 'EMPLOYEE',
      designation: 'Marketing Associate',
      departmentId: deptMktg.id,
      managerId: priya.id,
      companyId: company.id,
      status: 'ACTIVE',
    },
  });

  console.log('Created 6 team members in reporting hierarchy.');

  // 4. Create Flows (Work streams)
  const flowEng = await prisma.flow.create({
    data: {
      name: 'Q4 Platform Modernization',
      description: 'Core infrastructure overhaul, latency reduction, and visual workspace engine.',
      companyId: company.id,
    },
  });

  const flowMktg = await prisma.flow.create({
    data: {
      name: 'Brand Re-launch & Creative Campaign',
      description: 'Q4 brand storytelling, video launch assets, and paid acquisition engine.',
      companyId: company.id,
    },
  });

  const flowOps = await prisma.flow.create({
    data: {
      name: 'Revenue & Operations Automation',
      description: 'Financial reporting pipelines and internal business operations.',
      companyId: company.id,
    },
  });

  // Helper date calculations
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const today = new Date(now.getTime() + 2 * 60 * 60 * 1000); // later today
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const inTenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // 5. Create Tasks
  // Eng Flow
  const taskDbPartition = await prisma.task.create({
    data: {
      title: 'Database Partitioning & Index Tuning',
      description: 'Index high-frequency query paths and optimize SQLite / Postgres connection pooling.',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: twoDaysAgo,
      completedAt: yesterday,
      createdById: rahul.id,
      assignedToId: aman.id,
      companyId: company.id,
      flowId: flowEng.id,
      positionX: 50,
      positionY: 50,
    },
  });

  const taskArch = await prisma.task.create({
    data: {
      title: 'Q4 Architecture Redesign & API Layer',
      description: 'Refactor core service boundaries and enforce strict tenant isolation.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: inTwoDays,
      createdById: aditya.id,
      assignedToId: aman.id,
      companyId: company.id,
      flowId: flowEng.id,
      positionX: 380,
      positionY: 50,
    },
  });

  const taskDesignSystem = await prisma.task.create({
    data: {
      title: 'Frontend Design System & Dark Palette',
      description: 'Establish minimal near-black palette, custom typography tokens, and responsive canvas wrapper.',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: twoDaysAgo,
      completedAt: yesterday,
      createdById: rahul.id,
      assignedToId: neha.id,
      companyId: company.id,
      flowId: flowEng.id,
      positionX: 50,
      positionY: 220,
    },
  });

  const taskFlowVisualizer = await prisma.task.create({
    data: {
      title: 'Interactive Flow Visualizer & Node Engine',
      description: 'Build interactive canvas with React Flow, custom circular bubble nodes, and drag-and-drop connections.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: today,
      createdById: rahul.id,
      assignedToId: neha.id,
      companyId: company.id,
      flowId: flowEng.id,
      positionX: 380,
      positionY: 220,
    },
  });

  const taskStagingDeploy = await prisma.task.create({
    data: {
      title: 'Staging Deployment & Load Testing',
      description: 'Verify end-to-end multi-tenant isolation under simulated concurrent traffic.',
      status: 'BLOCKED',
      priority: 'HIGH',
      dueDate: inFiveDays,
      createdById: aditya.id,
      assignedToId: rahul.id,
      companyId: company.id,
      flowId: flowEng.id,
      positionX: 720,
      positionY: 130,
    },
  });

  const taskPaymentWebhook = await prisma.task.create({
    data: {
      title: 'Payment Gateway Webhook Reliability',
      description: 'Implement idempotent retry handling for billing webhooks.',
      status: 'TODO',
      priority: 'URGENT',
      dueDate: inTenDays,
      createdById: rahul.id,
      assignedToId: aman.id,
      companyId: company.id,
      flowId: flowEng.id,
      positionX: 1050,
      positionY: 50,
    },
  });

  const taskMobilePolish = await prisma.task.create({
    data: {
      title: 'Mobile Responsive Navigation Polish',
      description: 'Ensure smooth touch panning and compact task drawer on tablet and mobile viewports.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: inTwoDays,
      createdById: rahul.id,
      assignedToId: neha.id,
      companyId: company.id,
      flowId: flowEng.id,
      positionX: 720,
      positionY: 300,
    },
  });

  // Marketing Flow Tasks
  const taskBrandStrategy = await prisma.task.create({
    data: {
      title: 'Brand Strategy & Visual Guidelines',
      description: 'Define core messaging pillars, typography guidelines, and tone of voice.',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: twoDaysAgo,
      completedAt: yesterday,
      createdById: aditya.id,
      assignedToId: priya.id,
      companyId: company.id,
      flowId: flowMktg.id,
      positionX: 50,
      positionY: 450,
    },
  });

  const taskVideoCreative = await prisma.task.create({
    data: {
      title: 'Homepage Video Creative & Motion Assets',
      description: 'Record 45-second high-impact product walkthrough focusing on the people-to-task clarity.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: today,
      createdById: priya.id,
      assignedToId: riya.id,
      companyId: company.id,
      flowId: flowMktg.id,
      positionX: 380,
      positionY: 450,
    },
  });

  const taskAdCampaign = await prisma.task.create({
    data: {
      title: 'Meta & LinkedIn Campaign Setup',
      description: 'Configure audience segments, attribution tracking, and launch creative variants.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: inFiveDays,
      createdById: priya.id,
      assignedToId: riya.id,
      companyId: company.id,
      flowId: flowMktg.id,
      positionX: 720,
      positionY: 450,
    },
  });

  const taskInfluencerOutreach = await prisma.task.create({
    data: {
      title: 'Founder & Tech Influencer Beta Outreach',
      description: 'Coordinate with 20 leading engineering and design leaders for early access previews.',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      dueDate: inTenDays,
      createdById: aditya.id,
      assignedToId: priya.id,
      companyId: company.id,
      flowId: flowMktg.id,
      positionX: 1050,
      positionY: 450,
    },
  });

  const taskKeynote = await prisma.task.create({
    data: {
      title: 'Product Launch Keynote Presentation',
      description: 'Prepare executive slides showing the operational hierarchy and live task map.',
      status: 'TODO',
      priority: 'URGENT',
      dueDate: inFiveDays,
      createdById: aditya.id,
      assignedToId: aditya.id,
      companyId: company.id,
      flowId: flowMktg.id,
      positionX: 380,
      positionY: 600,
    },
  });

  // Ops & Revenue Flow Tasks (including Overdue tasks)
  const taskAmazonDashboard = await prisma.task.create({
    data: {
      title: 'Amazon Revenue & Inventory Dashboard',
      description: 'Consolidate live revenue metrics, daily margins, and inventory threshold alerts.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: twoDaysAgo, // OVERDUE
      createdById: aditya.id,
      assignedToId: rahul.id,
      companyId: company.id,
      flowId: flowOps.id,
      positionX: 50,
      positionY: 750,
    },
  });

  const taskSecurityAudit = await prisma.task.create({
    data: {
      title: 'SOC2 Type I Security Compliance Audit',
      description: 'Complete evidence collection and vendor review for annual security audit.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: inTenDays,
      createdById: aditya.id,
      assignedToId: rahul.id,
      companyId: company.id,
      flowId: flowOps.id,
      positionX: 380,
      positionY: 750,
    },
  });

  const taskQuarterlyForecast = await prisma.task.create({
    data: {
      title: 'Executive Quarterly Revenue Forecast',
      description: 'Model hiring runway, server compute costs, and ARR targets.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: today,
      createdById: aditya.id,
      assignedToId: aditya.id,
      companyId: company.id,
      flowId: flowOps.id,
      positionX: 720,
      positionY: 750,
    },
  });

  const taskFeedbackAnalysis = await prisma.task.create({
    data: {
      title: 'Beta User Feedback Sentiment Analysis',
      description: 'Categorize feedback from initial cohort into UX friction vs feature requests.',
      status: 'DONE',
      priority: 'LOW',
      dueDate: twoDaysAgo,
      completedAt: yesterday,
      createdById: priya.id,
      assignedToId: riya.id,
      companyId: company.id,
      flowId: flowMktg.id,
      positionX: 1050,
      positionY: 600,
    },
  });

  const taskEmailDeliverability = await prisma.task.create({
    data: {
      title: 'Transactional Email SPF & DKIM Tuning',
      description: 'Resolve delivery bounces and configure custom return-path headers.',
      status: 'BLOCKED',
      priority: 'MEDIUM',
      dueDate: yesterday, // OVERDUE
      createdById: rahul.id,
      assignedToId: aman.id,
      companyId: company.id,
      flowId: flowEng.id,
      positionX: 1050,
      positionY: 220,
    },
  });

  console.log('Created 17 realistic tasks with diverse priorities and statuses.');

  // 6. Create Task Connections (Dependencies)
  // taskDbPartition blocks taskArch
  await prisma.taskConnection.create({
    data: {
      sourceTaskId: taskDbPartition.id,
      targetTaskId: taskArch.id,
      relationshipType: 'BLOCKS',
    },
  });

  // taskDesignSystem blocks taskFlowVisualizer
  await prisma.taskConnection.create({
    data: {
      sourceTaskId: taskDesignSystem.id,
      targetTaskId: taskFlowVisualizer.id,
      relationshipType: 'BLOCKS',
    },
  });

  // taskArch blocks taskStagingDeploy
  await prisma.taskConnection.create({
    data: {
      sourceTaskId: taskArch.id,
      targetTaskId: taskStagingDeploy.id,
      relationshipType: 'BLOCKS',
    },
  });

  // taskFlowVisualizer blocks taskStagingDeploy
  await prisma.taskConnection.create({
    data: {
      sourceTaskId: taskFlowVisualizer.id,
      targetTaskId: taskStagingDeploy.id,
      relationshipType: 'BLOCKS',
    },
  });

  // taskBrandStrategy blocks taskVideoCreative
  await prisma.taskConnection.create({
    data: {
      sourceTaskId: taskBrandStrategy.id,
      targetTaskId: taskVideoCreative.id,
      relationshipType: 'BLOCKS',
    },
  });

  // taskVideoCreative blocks taskAdCampaign
  await prisma.taskConnection.create({
    data: {
      sourceTaskId: taskVideoCreative.id,
      targetTaskId: taskAdCampaign.id,
      relationshipType: 'BLOCKS',
    },
  });

  // taskBrandStrategy blocks taskKeynote
  await prisma.taskConnection.create({
    data: {
      sourceTaskId: taskBrandStrategy.id,
      targetTaskId: taskKeynote.id,
      relationshipType: 'BLOCKS',
    },
  });

  console.log('Created task dependency graph connections.');

  // 7. Create Task Comments
  await prisma.comment.create({
    data: {
      taskId: taskAmazonDashboard.id,
      userId: rahul.id,
      message: 'Pulled API credentials from AWS Secrets Manager. Syncing final settlement reports.',
      createdAt: yesterday,
    },
  });

  await prisma.comment.create({
    data: {
      taskId: taskAmazonDashboard.id,
      userId: aditya.id,
      message: 'Need this finalized ASAP so we can lock the board deck.',
      createdAt: now,
    },
  });

  await prisma.comment.create({
    data: {
      taskId: taskStagingDeploy.id,
      userId: rahul.id,
      message: 'Waiting on the interactive flow visualizer and final schema review before deploying.',
      createdAt: today,
    },
  });

  await prisma.comment.create({
    data: {
      taskId: taskEmailDeliverability.id,
      userId: aman.id,
      message: 'DNS records for DKIM are propagating. Waiting on domain registrar verification.',
      createdAt: yesterday,
    },
  });

  // 8. Create Activity Logs
  const activities = [
    {
      companyId: company.id,
      actorId: aditya.id,
      entityType: 'COMPANY',
      entityId: company.id,
      action: 'FLOW_CREATED',
      metadata: JSON.stringify({ name: 'Acme Corp setup complete' }),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: company.id,
      actorId: aditya.id,
      entityType: 'EMPLOYEE',
      entityId: rahul.id,
      action: 'EMPLOYEE_CREATED',
      metadata: JSON.stringify({ name: 'Rahul', designation: 'Engineering Lead' }),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: company.id,
      actorId: aditya.id,
      entityType: 'EMPLOYEE',
      entityId: priya.id,
      action: 'EMPLOYEE_CREATED',
      metadata: JSON.stringify({ name: 'Priya', designation: 'Marketing Lead' }),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      companyId: company.id,
      actorId: rahul.id,
      entityType: 'TASK',
      entityId: taskAmazonDashboard.id,
      taskId: taskAmazonDashboard.id,
      action: 'TASK_ASSIGNED',
      metadata: JSON.stringify({ title: taskAmazonDashboard.title, assignee: 'Rahul' }),
      createdAt: twoDaysAgo,
    },
    {
      companyId: company.id,
      actorId: neha.id,
      entityType: 'TASK',
      entityId: taskDesignSystem.id,
      taskId: taskDesignSystem.id,
      action: 'TASK_COMPLETED',
      metadata: JSON.stringify({ title: taskDesignSystem.title, status: 'DONE' }),
      createdAt: yesterday,
    },
    {
      companyId: company.id,
      actorId: priya.id,
      entityType: 'TASK',
      entityId: taskVideoCreative.id,
      taskId: taskVideoCreative.id,
      action: 'TASK_STATUS_CHANGED',
      metadata: JSON.stringify({ title: taskVideoCreative.title, from: 'TODO', to: 'IN_PROGRESS' }),
      createdAt: today,
    },
    {
      companyId: company.id,
      actorId: rahul.id,
      entityType: 'TASK',
      entityId: taskStagingDeploy.id,
      taskId: taskStagingDeploy.id,
      action: 'TASK_STATUS_CHANGED',
      metadata: JSON.stringify({ title: taskStagingDeploy.title, from: 'TODO', to: 'BLOCKED' }),
      createdAt: today,
    },
  ];

  for (const act of activities) {
    await prisma.activity.create({
      data: {
        companyId: act.companyId,
        actorId: act.actorId,
        entityType: act.entityType,
        entityId: act.entityId,
        taskId: act.taskId,
        action: act.action,
        metadata: act.metadata,
        createdAt: act.createdAt,
      },
    });
  }

  // 9. Create Notifications
  await prisma.notification.create({
    data: {
      companyId: company.id,
      userId: rahul.id,
      title: 'Task Overdue',
      message: 'Amazon Revenue & Inventory Dashboard is overdue by 2 days.',
      type: 'TASK_OVERDUE',
      link: `/tasks?id=${taskAmazonDashboard.id}`,
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      companyId: company.id,
      userId: neha.id,
      title: 'New Task Assigned',
      message: 'Rahul assigned "Interactive Flow Visualizer & Node Engine" to you.',
      type: 'TASK_ASSIGNED',
      link: `/flow?id=${taskFlowVisualizer.id}`,
      read: false,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n--- DEMO LOGIN CREDENTIALS ---');
  console.log('Founder:     aditya@acme.com / password123');
  console.log('Eng Lead:    rahul@acme.com  / password123');
  console.log('Mktg Lead:   priya@acme.com  / password123');
  console.log('Eng Team:    neha@acme.com   / password123');
  console.log('------------------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
