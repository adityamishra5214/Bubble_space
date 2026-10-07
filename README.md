# FLOW — Work & Organization Operating System

> **Single Source of Truth for Organizational Hierarchy, Task Ownership, and Visual Workflow.**

---

## ⚡ Quick Start Commands

To run the application locally from scratch:

```bash
# 1. Install dependencies
npm install

# 2. Sync SQLite database schema (creates dev.db with zero external config)
npx prisma db push

# 3. Seed realistic company hierarchy, 17 tasks, dependencies, and audit logs
npm run db:seed

# 4. Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Credentials

The seed script initializes the **Acme Corp** multi-tier reporting structure:

| User | Role | Designation | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Aditya** | Founder | Founder & CEO | `aditya@acme.com` | `password123` |
| **Rahul** | Admin | Engineering Lead (reports to Aditya) | `rahul@acme.com` | `password123` |
| **Priya** | Admin | Marketing Lead (reports to Aditya) | `priya@acme.com` | `password123` |
| **Aman** | Employee | Backend Engineer (reports to Rahul) | `aman@acme.com` | `password123` |
| **Neha** | Employee | Frontend Engineer (reports to Rahul) | `neha@acme.com` | `password123` |
| **Riya** | Employee | Marketing Associate (reports to Priya) | `riya@acme.com` | `password123` |

*(Quick 1-click login buttons are also available directly on the `/login` page)*

---

## 🧭 Application Flow & User Journey

```
                        ORGANIZATION
                             │
                  ┌──────────┴──────────┐
                  │                     │
              Founder A             Founder B
                  │                     │
            ┌─────┴─────┐          ┌────┴────┐
            │           │          │         │
         Manager      Manager    Manager   Manager
            │
       ┌────┴────┐
       │         │
     Employee  Employee
       │
       ├──────────────→ [Task A]
       │                   │
       │                   ↓ (BLOCKS)
       └──────────────→ [Task B]
                           │
                           ↓
                         DONE
```

### 1. Multi-Tenant Onboarding (`/onboarding` & `/login`)
- **Step 1:** Create Company workspace.
- **Step 2:** Create Founder profile.
- **Step 3:** Add team members with initial department and reporting relationship.
- Generates company tenant isolation at the database level.

### 2. Organization Hierarchy Graph (`/organization`)
- **Visual Structure:** Connected circular bubble nodes representing founders, leads, and employees.
- **Node Badges:**
  - Active task count badge pill.
  - Overdue task alert dot (pulsing red indicator).
  - Founder golden shield icon.
- **Interactivity:**
  - Pan, zoom, node drag, and **Auto Align Hierarchy** (Dagre algorithm).
  - Department filter pills (*All, Engineering, Marketing, Operations, Product, Design*).
  - Search bar to locate employees instantly.
- **Employee Slide-out Drawer:**
  - Clicking any node opens the right-hand panel.
  - Shows direct manager and direct reports with 1-click navigation.
  - Displays **Active Tasks**, **Overdue Tasks**, and **Completed Tasks**.
  - Includes **`+ Assign Task to [Person]`** quick action.

### 3. Task Flow Operational Canvas (`/flow`)
- **Visual Work Map:** Rectangular task cards representing tasks moving through the organization.
- **Clear Ownership:** Every card prominently displays **Task Title**, **Owner Bubble**, **Status**, **Priority**, and **Due Date**.
- **Dependency Connections:** Drag from one task handle to another to create real **BLOCKS** dependencies.
- **Interactive Views:** Filter by *All Tasks*, *My Tasks*, *Team Tasks*, *Overdue Only*, *Completed*, or by *Work Stream (Flow)*.
- **Position Persistence:** Node drag positions are automatically saved.

### 4. My Tasks (`/tasks/my`)
- Organized into 4 operational tiers:
  1. **OVERDUE** (High-priority crimson alert styling)
  2. **TODAY**
  3. **UPCOMING**
  4. **COMPLETED**
- 1-click toggle to mark tasks DONE or move back into progress.

### 5. Global Task Registry (`/tasks`)
- High-density company-wide table.
- Search by task title, description, or owner.
- Filter by Assignee, Department, Status, Priority, Due Date, and Flow.
- Sort by Title, Priority, Due Date, or Date Created.
- Inline status dropdowns.

### 6. Single Task Drawer & Contextual Details
- Slide-over drawer accessible from anywhere in the app:
  - Inline title and description editing.
  - Single Owner reassignment dropdown.
  - Status & Priority selectors.
  - Date picker with calculated overdue alerts (e.g. *"Overdue by 2 days"*).
  - Dependent tasks list (*Blocked By* and *Blocks*).
  - Contextual comments section with instant updates.
  - Chronological audit trail showing every state change.

### 7. Real-time Activity & Audit Trail (`/activity`)
- Answers: *"Who created this?", "Who assigned it?", "Who changed the status?", "When was it done?"*
- Logs events: `TASK_CREATED`, `TASK_ASSIGNED`, `TASK_REASSIGNED`, `TASK_STATUS_CHANGED`, `TASK_COMPLETED`, `TASK_COMMENTED`, `EMPLOYEE_CREATED`, `EMPLOYEE_MANAGER_CHANGED`, `FLOW_CREATED`.

### 8. Operational Dashboard (`/dashboard`)
- Answers: *"What is happening right now?"*
- Live metrics: Active Tasks, Overdue Count, Due Today, Completed This Week.
- Tasks by Status Breakdown (*TODO, IN PROGRESS, BLOCKED, DONE*).
- **"Who is Doing What?"**: Employee workload cards showing active task counts, in-progress items, and direct links.

### 9. Global Search & In-App Notifications
- **Global Search (`⌘K` / `Ctrl+K`):** Search across employees, tasks, and flows with instant jump.
- **In-App Notifications Bell:** Live alerts for task assignments, status updates, and overdue tasks.

---

## 🛠 Tech Stack

- **Framework:** Next.js (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS (Custom Dark Palette: `#0B0D0F`, `#111418`, `#15191D`, `#2A3036`, `#38BDF8`)
- **Graph & Canvas:** `@xyflow/react` (React Flow 12) + `@dagrejs/dagre`
- **Database & ORM:** SQLite (`dev.db`) + Prisma ORM 6
- **Authentication:** JWT HTTP-only cookie sessions (`jose`) + `bcryptjs` password hashing
- **Validation:** Zod schemas
- **Icons & Dates:** Lucide React, `date-fns`
