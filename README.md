# NexusHR

> A full-stack Human Resource Management System (HRMS) built for Restroworks, featuring role-based access control, offline-first attendance, payroll processing, leave management, and real-time sync.

---

## Table of Contents

- [Overview](#overview)
- [HR Portal Exclusive Features](#hr-portal-exclusive-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running the Backend](#running-the-backend)
  - [Running the Client](#running-the-client)
  - [Seeding the Database](#seeding-the-database)
- [Process Management (PM2)](#process-management-pm2)
- [Workers](#workers)
  - [Payroll Generator](#payroll-generator)
  - [Payroll Batch](#payroll-batch)
  - [Image Worker](#image-worker)
  - [Analytics Worker](#analytics-worker)
- [Bulk Payroll Processing](#bulk-payroll-processing)
- [Backend](#backend)
  - [Entry Point & Clustering](#entry-point--clustering)
  - [Server Setup](#server-setup)
  - [Configuration & Env Validation](#configuration--env-validation)
  - [Database](#database)
  - [Middlewares](#middlewares)
  - [Utilities](#utilities)
  - [API Modules](#api-modules)
    - [Auth](#auth-apiv1auth)
    - [Users](#users-apiv1user)
    - [Skills](#skills-apiv1skills)
    - [Departments](#departments-apiv1departments)
    - [Leaves](#leaves-apiv1leaves)
    - [Salaries](#salaries-apiv1salaries)
    - [Payroll](#payroll-apiv1payroll)
    - [Attendance](#attendance-apiv1attendance)
    - [Sync](#sync-apiv1sync)
- [Client](#client)
  - [Routing & Role-Based Access](#routing--role-based-access)
  - [Pages](#pages)
  - [Components](#components)
  - [Hooks](#hooks)
  - [State Management (Redux)](#state-management-redux)
  - [Utilities](#utilities-1)
    - [ApiCaller](#apicaller)
    - [DbManger (IndexedDB)](#dbmanger-indexeddb)
    - [OnlineStateChecker](#onlinestatechecker)
    - [PdfGenerator](#pdfgenerator)
  - [Web Workers](#web-workers)
- [Offline-First Architecture](#offline-first-architecture)
- [Data Flow Diagram](#data-flow-diagram)
- [API Response Format](#api-response-format)

---

## Overview

NexusHR is a monorepo HRMS application with a **Node.js/Express** backend and a **React/TypeScript** SPA frontend. It supports two user roles:

| Role | Default Landing Page | Access |
|------|---------------------|--------|
| **HR** | `/employee` | Full management: employees, departments, skills, salaries, payroll, leaves, attendance analytics |
| **Employee** | `/attendance` | Self-service: attendance punch-in/out, own leave requests, own payroll/salary view |

Key highlights:
- **JWT authentication** with automatic access-token refresh via HTTP-only cookies (using a dedicated session collection)
- **Offline-first attendance**: punches are stored in IndexedDB when offline and synced via a Web Worker when connectivity is restored
- **Secure Face Verification**: photo verification required during punch-out workflows
- **Clustered backend**: Node.js cluster module forks multiple worker processes for horizontal scaling
- **BullMQ + Redis / SQS** queue for processing offline batch jobs and analytics generation
- **Zod validation** on all backend endpoints for runtime type safety

---

## HR Portal Exclusive Features

The NexusHR platform empowers Human Resource administrators with a specialized suite of tools and dashboards tailored for organizational management:

- **Advanced Analytics & Worker Queues**: Trigger background analytics generation for selected months and years via a dedicated Docker LocalStack queue and view the results in comprehensive dashboards.
- **Enhanced Payroll PDF Reports**: Export detailed payslips featuring visual range charts for bonus/deduction distributions and department-wise statistics.
- **Domain-Specific Aesthetic Dashboards**: Curated, responsive dashboards with domain-specific color schemes for managing Skills, Departments, and Salaries.
- **Refined Leave & Attendance Insights**: Visually enhanced leave dashboards featuring segmented bar charts (by leave types) and aesthetic pie charts for quick status assessments.
- **Events Management**: An interactive organization-wide Events Calendar that HR can manage, seeding and displaying events with detailed dialogs.
- **Bulk Payroll Processing**: Process payroll for entire departments or the full organization concurrently using distributed background workers (generator and batch writers).

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** (ESM) | Runtime |
| **Express 5** | HTTP framework |
| **Mongoose 9** | MongoDB ODM |
| **bcrypt** | Password hashing |
| **jsonwebtoken** | JWT access & refresh tokens |
| **cookie-parser** | HTTP-only cookie handling |
| **zod** | Schema validation |
| **uuid** | Unique ID generation |
| **dotenv** | Environment variables |

### Client
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **TypeScript** | Static typing |
| **Vite 7** | Build tool & dev server |
| **TailwindCSS 4** | Utility-first styling |
| **shadcn/ui + Radix UI** | Accessible component primitives |
| **React Router DOM 7** | Client-side routing |
| **Redux Toolkit** | Global state (user session) |
| **Axios** | HTTP client |
| **idb** | IndexedDB wrapper (offline queue) |
| **Recharts** | Analytics charts |
| **@react-pdf/renderer** | PDF payslip generation |
| **date-fns** | Date utilities |
| **lucide-react** | Icon library |

---

## Project Structure

```
NexusHR/
├── backend/
│   ├── src/
│   │   ├── index.js           # Entry point — cluster setup
│   │   ├── server.js          # App class — Express setup
│   │   ├── routes.js          # Root router mounting all modules
│   │   ├── seed.js            # Database seeder (50+ docs per model)
│   │   ├── config/
│   │   │   ├── Config.js      # Zod env schema validator
│   │   │   ├── Db.js          # Mongoose connection class
│   │   │   └── env.js         # Singleton config export (Cfg)
│   │   ├── middlewares/
│   │   │   ├── verify.middleware.js   # JWT verification
│   │   │   └── error.middleware.js    # Global error handler
│   │   ├── utils/
│   │   │   ├── AsyncHandler.js   # Wraps async route handlers
│   │   │   ├── Error.js          # ApiError class
│   │   │   ├── Response.js       # ApiResponse class
│   │   │   └── index.js          # Re-exports utils
│   │   ├── queue/
│   │   │   └── payroll.queue.js  # SQS client — sends bulk payroll messages
│   │   ├── types/                # Shared Zod schemas / type definitions
│   │   └── modules/
│   │       ├── Users/            # Authentication + employee management
│   │       ├── Skills/           # Skill CRUD
│   │       ├── Departments/      # Department CRUD
│   │       ├── Leaves/           # Leave types, balances, requests
│   │       ├── Salaries/         # Salary structures
│   │       ├── Payroll/          # Payroll generation & retrieval
│   │       ├── Attendance/       # Punch-in/out records
│   │       └── Sync/             # Offline batch sync endpoint
│   └── package.json
├── workers/
│   ├── payroll-generator/        # Reads SQS, aggregates employee data, publishes batches
│   │   └── src/
│   │       ├── payroll.generator.js
│   │       ├── conf/config.js
│   │       └── utils/
│   │           ├── Db.js
│   │           └── Employees.js  # MongoDB aggregation pipeline
│   ├── payroll-batch/            # Consumes batches and bulk-writes payroll records
│   │   └── src/
│   │       ├── payroll.batch.js
│   │       ├── conf/Config.js
│   │       └── utils/Db.js
│   └── image-worker/             # Image processing worker
│       └── src/
│           └── image-worker.js
├── docker/                       # Docker Compose + LocalStack for SQS
├── ecosystem.config.js           # PM2 multi-app config
└── client/
    ├── src/
    │   ├── main.tsx             # React entry point + Redux Provider
    │   ├── App.tsx              # Router + ProtectedRoute + RoleBasedRedirect
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   └── dashboard/
    │   │       ├── Employee.tsx
    │   │       ├── Departments.tsx
    │   │       ├── Salaries.tsx
    │   │       ├── Skills.tsx
    │   │       ├── Payroll.tsx
    │   │       ├── Attendance.tsx
    │   │       └── Leaves.tsx
    │   ├── components/          # Reusable UI components
    │   ├── hooks/               # Feature-specific data hooks
    │   ├── store/               # Redux store + userState slice
    │   ├── utils/
    │   │   ├── ApiCaller.ts     # Axios wrapper with token refresh
    │   │   ├── DbManger.ts      # IndexedDB offline attendance queue
    │   │   ├── OnlineStateChecker.ts
    │   │   └── PdfGenerator.tsx
    │   ├── workers/
    │   │   ├── syncQueue.worker.ts   # Flushes IndexedDB → server
    │   │   └── pdf.worker.tsx
    │   └── types/               # TypeScript type definitions
    └── package.json
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client (Browser)                       │
│                                                              │
│  React SPA  ──── Redux (userState) ──── ProtectedRoutes     │
│      │                                                       │
│  ApiCaller (Axios)  ←──── Token Refresh on 401 ────────┐    │
│      │                                                  │    │
│  IndexedDB (idb)   ←── OfflineAttendanceQueue          │    │
│  syncQueue.worker  ──── flush() on reconnect ──────────┘    │
└──────────────────────────────────────────────────────────────┘
               │ HTTP (REST)  / cookies
┌──────────────────────────────────────────────────────────────┐
│                   Backend (Node.js Cluster)                   │
│                                                              │
│  Primary Process  ──── forks N workers (½ CPU cores)        │
│                                                              │
│  Each Worker:                                                │
│  Express 5 ──── /api/v1/* ──── VerifyMiddleware (JWT)       │
│      │                                                       │
│  Modules: Auth | Users | Skills | Departments | Leaves      │
│           Salaries | Payroll | Attendance | Sync            │
│      │                                                       │
│  Mongoose ──── MongoDB        SQS Queue (payroll.queue.js)  │
└──────────────────────────────────────────────────────────────┘
               │                          │ SQS Messages
┌──────────────────────────────────────────────────────────────┐
│                     Workers (PM2 Managed)                     │
│                                                              │
│  payroll-generator (×1)                                      │
│    └─ Polls SQS → aggregates employees → publishes batches  │
│                                                              │
│  payroll-batch (×3)                                          │
│    └─ Polls SQS → bulk-writes payroll records to MongoDB    │
│                                                              │
│  image-worker (×1)                                           │
│    └─ Image processing tasks                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- MongoDB (local or Atlas)

### Environment Variables

Create a `.env` file in `backend/`:

```env
PORT=8000
INSTANCES=2                          # Number of cluster workers to fork
ACCESS_TOKEN_SECRET=your_secret_here
REFRESH_TOKEN=your_refresh_secret_here
MONGO_DB_URL=mongodb://localhost:27017
DB_NAME=nexushr
```

Create a `.env` file in `client/`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Running the Backend

```bash
cd backend
npm install
node src/index.js
```

### Running the Client

```bash
cd client
npm install
npm run dev        # Development server (Vite) on http://localhost:5173
npm run build      # Production build
npm run preview    # Preview production build
```

### Seeding the Database

Populates all collections with 50+ realistic documents:

```bash
cd backend
npm run seed
```

---

## Process Management (PM2)

Use the root PM2 ecosystem file to run all services together.

### Prerequisites

- PM2 installed globally (`npm i -g pm2`)
- Dependencies installed in each app folder (`backend`, `workers`, `client`)

### PM2 App Instances

| Service | PM2 Name | Instances | Mode |
|---------|----------|-----------|------|
| Backend API | `nexushr-backend` | 1 | cluster |
| Payroll Generator | `nexushr-payroll-worker` | 1 | cluster |
| Payroll Batch Writer | `nexushr-payroll-batch` | 3 | cluster |
| Image Worker | `nexushr-image-worker` | 1 | cluster |
| Analytics Worker | `nexushr-analytics` | 1 | cluster |
| Client Dev Server | `nexushr-client` | 1 | fork |

The **payroll-batch** worker runs with 3 instances so multiple batches of employee payrolls can be written in parallel for faster processing.

### Start all services

```bash
cd NexusHR
pm2 start ecosystem.config.js
```

### Start PM2 on system reboot

Run this once to register PM2 with system startup, then save the current process list:

```bash
pm2 startup
# run the command PM2 prints (usually with sudo)
pm2 save
```

After reboot, PM2 restores and starts the app list saved by `pm2 save`.

### Useful PM2 commands

```bash
pm2 ls
pm2 logs
pm2 restart ecosystem.config.js
pm2 stop ecosystem.config.js
pm2 delete ecosystem.config.js
```

---

## Workers

Independent Node.js processes managed by PM2 that handle background tasks via SQS queues.

### Payroll Generator

**`workers/payroll-generator/src/payroll.generator.js`**

Long-polls the **subscriber SQS queue** for bulk payroll messages from the backend. On receiving a message:

1. Parses `{ departments, month, year, bulkBonus, bulkDeduction }` from the event
2. Calls `GetEmployeeBatches()` — an **async generator** that runs a MongoDB aggregation pipeline on the `users` collection
3. The pipeline joins salary, last payroll (including bonus), unpaid-leave deductions, and attendance data for each employee
4. Yields employee batches of up to 1,000 documents
5. Publishes each batch along with `month`, `year`, `bulkBonus`, and `bulkDeduction` to the **publisher SQS queue**
6. Deletes the original message

**Aggregation pipeline stages (Employees.js):**

| Stage | Purpose |
|-------|---------|
| Match by department | Filter employees (skip if "All") |
| Lookup last payroll | Get the most recent payroll (bonus carry-forward) |
| Lookup salary | From last payroll's salary ref, or fall back to current salary |
| Lookup unpaid leaves | ACCEPTED leave requests for the month where `leaveType.isPaid = false` |
| Count present days | Distinct attendance days in the month |
| Compute per-day salary | `base / totalDaysInMonth` |
| Compute leave deductions | `quantity * perDaySalary` for each unpaid leave |
| Final projection | Employee info, salary, last payroll bonus, leave deductions |

### Payroll Batch

**`workers/payroll-batch/src/payroll.batch.js`** — Runs **3 instances** via PM2.

Long-polls the **publisher SQS queue** for employee batches. On receiving a batch:

1. Parses `{ employees, month, year, bulkBonus, bulkDeduction }`
2. Queries MongoDB to find employees who **already have a payroll** for this month/year — skips them
3. For each remaining employee, builds a payroll document:
   - **bonus** = bonus from last payroll + bulk bonus
   - **deduction** = unpaid leave deductions + bulk deduction
4. Executes a `bulkWrite` with `ordered: false` to insert all payroll records in one operation
5. Deletes the SQS message

### Image Worker

**`workers/image-worker/src/image-worker.js`**

Handles image processing tasks (resizing, optimization) via SQS.

### Analytics Worker

**`workers/analytics/...`**

Handles processing of HR analytics data, triggered by a dedicated analytics queue via LocalStack. Evaluates metrics such as departmental bonuses, deductions, and monthly aggregations.

---

## Bulk Payroll Processing

End-to-end flow for generating payroll across the organization:

```
HR clicks "Generate Bulk" in the UI
       │
       ▼
BulkPayrollDialog: selects month, year, departments,
                   optional bulk bonus & bulk deduction
       │
       ▼
POST /api/v1/payroll/bulk
  { month, year, department?, bulkBonus?, bulkDeduction? }
       │
       ▼
PayrollController.GenerateBulkPayroll
  → Validates with Zod (GenerateBulkPayrollValidationSchema)
  → Sends SQS message via PayrollSendMessage()
  → Returns 200 immediately (fire-and-forget)
       │
       ▼  SQS (subscriber queue)
       │
payroll-generator worker (×1)
  → Polls SQS, receives { departments, month, year, bulkBonus, bulkDeduction }
  → Runs aggregation pipeline on users collection
  → Yields batches of up to 1,000 enriched employee documents
  → Publishes each batch to SQS (publisher queue)
       │
       ▼  SQS (publisher queue)
       │
payroll-batch worker (×3 — competing consumers)
  → Polls SQS, receives { employees, month, year, bulkBonus, bulkDeduction }
  → Skips employees that already have payroll for this month/year
  → For each employee:
       bonus    = lastPayroll.bonus + bulkBonus
       deduction = unpaidLeaveDeductions + bulkDeduction
  → Executes bulkWrite (ordered: false) into payrolls collection
       │
       ▼
Payroll records in MongoDB
  → Visible in the Payroll page for HR and employees
  → Downloadable as PDF payslips
```

### What goes into each payroll record

| Field | Source |
|-------|--------|
| `user` | Employee ID |
| `salary` | Salary ref from last payroll, or employee's current salary |
| `bonus` | Bonus array carried from last payroll + bulk bonus from HR |
| `deduction` | Unpaid leave deductions (auto-calculated) + bulk deduction from HR |
| `month` | Selected month |
| `year` | Selected year |

### Deduction amounts (negative in DB)

The payroll model's `pre("save")` hook ensures deduction amounts are stored as **negative values**. During bulk-write (raw MongoDB), the `payroll-batch` worker inserts deduction amounts as-is (positive), matching the same pipeline output as single payroll generation.

---

## Backend

### Entry Point & Clustering

**`src/index.js`**

Uses Node.js built-in `cluster` module. The primary process computes the number of workers as `max(INSTANCES env var, half the machine's CPU cores)` and forks that many worker processes. Each worker runs its own Express HTTP server.

```
Primary ──── fork() × N ──── Worker 1 (Express, port 8000)
                         ──── Worker 2 (Express, port 8000)
                         ...
```

If a worker dies, the primary throws an error (fail-fast; can be changed to auto-restart by uncommenting `cluster.fork()` in the exit handler).

---

### Server Setup

**`src/server.js`** — `App` class

| Method | Description |
|--------|-------------|
| `#initializeSerivces()` | Connects to MongoDB via `DB` class |
| `#initializeMiddlewares()` | CORS (localhost:5173), JSON, cookieParser, urlencoded |
| `#initializeRoutes()` | Mounts `Routes` at `/api/v1` |
| `#initializeErrorHandling()` | Registers the global `errorHandler` |
| `Listen(PORT)` | Starts the HTTP server |

---

### Configuration & Env Validation

**`src/config/Config.js`** — `Config` class

Validates all required environment variables at startup using a **Zod schema**. If any variable is missing or has the wrong type, the process exits immediately with a descriptive error. This prevents silent misconfigurations.

Required variables: `PORT`, `INSTANCES`, `ACCESS_TOKEN_SECRET`, `MONGO_DB_URL`, `DB_NAME`, `REFRESH_TOKEN`.

**`src/config/env.js`** — exports the singleton `Cfg` object (parsed config).

---

### Database

**`src/config/Db.js`**

A simple `DB` class wrapping Mongoose's `connect()`. The connection URL and database name are passed from env config.

---

### Redis

**`src/utils/redis.client.js`** — `RedisClient` (node:redis)

A singleton wrapping the official `redis` Node.js client. Used for general caching or session purposes. Connects automatically on first `getInstance()` call.

### Middlewares

| File | Middleware | Description |
|------|-----------|-------------|
| `verify.middleware.js` | `VerifyMiddleware` | Reads JWT from `cookies.accessToken` or `Authorization` header. Verifies against `ACCESS_TOKEN_SECRET`. Adds decoded payload to `req.user`. Throws 401 on failure or expiry. |
| `error.middleware.js` | `errorHandler` | Global error handler. Maps `ApiError` instances to structured JSON responses. Catches any unhandled thrown errors. |

---

### Utilities

| File | Export | Description |
|------|--------|-------------|
| `AsyncHandler.js` | `AsyncHandler(fn)` | Wraps an async route handler in a try/catch, forwarding errors to `next()`. Eliminates boilerplate try/catch in controllers. |
| `Error.js` | `ApiError` | Custom error class extending `Error`. Carries `statusCode`, `message`, and optional `errors` array. |
| `Response.js` | `ApiResponse` | Standardized success response shape: `{ statusCode, message, data, success, errors }`. |

---

### API Modules

All modules follow a consistent **Routes → Controller → Model** pattern. Each module directory contains:
- `Routes/` — Express Router class defining endpoints
- `Controllers/` — Business logic, calls models, sends `ApiResponse`
- `Models/` (or `models/`) — Mongoose schema definitions

---

#### Auth (`/api/v1/auth`)

> No auth required on these routes.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/login` | Accepts credentials, verifies password with bcrypt, issues JWT access token (cookie) + refresh token (cookie) |
| `POST` | `/refresh-access-token` | Uses refresh token cookie to issue a new access token |
| `POST` | `/logout` | Clears access and refresh token cookies |

---

#### Users (`/api/v1/user`)

> All routes protected by `VerifyMiddleware`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/create-employee` | Creates a new employee user (HR only) |
| `PUT` | `/update-employee/:id` | Updates employee details |
| `GET` | `/get-users` | Returns all users (paginated) |
| `GET` | `/get-users/:id` | Returns a single user by ID |
| `DELETE` | `/delete-employee/:id` | Soft or hard deletes an employee |

The `Users` module also contains:
- **`Encrypts.js`**: bcrypt helpers for hashing and comparing passwords

---

#### Skills (`/api/v1/skills`)

> Protected by `VerifyMiddleware`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create a new skill |
| `GET` | `/` | List all skills |
| `PUT` | `/:id` | Update a skill |
| `DELETE` | `/:id` | Delete a skill |

---

#### Departments (`/api/v1/departments`)

> Protected by `VerifyMiddleware`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create a department |
| `GET` | `/` | List all departments |
| `PUT` | `/:id` | Update a department |
| `DELETE` | `/:id` | Delete a department |

---

#### Leaves (`/api/v1/leaves`)

The Leaves module is subdivided into three sub-routers:

**Leave Types** (`/api/v1/leaves/types`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create a leave type (e.g., Sick, Casual) |
| `GET` | `/` | List all leave types |
| `PUT` | `/:id` | Update a leave type |
| `DELETE` | `/:id` | Delete a leave type |

**Leave Balances** (`/api/v1/leaves/balances`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Assign leave balance to an employee |
| `GET` | `/` | Get all leave balances (HR) or own balance (Employee) |
| `PUT` | `/:id` | Update leave balance |
| `DELETE` | `/:id` | Remove a leave balance |

**Leave Requests** (`/api/v1/leaves/requests`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Submit a leave request (Employee) |
| `GET` | `/` | List requests (HR sees all, Employee sees own) |
| `PUT` | `/:id` | Approve / reject (HR) or update (Employee) |
| `DELETE` | `/:id` | Cancel a request |

Transactions (Mongoose sessions) are used in leave balance + request write operations to maintain **ACID guarantees** — a failed request won't silently deduct balance.

---

#### Salaries (`/api/v1/salaries`)

> Protected by `VerifyMiddleware`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create a salary structure for an employee |
| `GET` | `/` | List all salaries (paginated) |
| `GET` | `/:id` | Get salary for a specific employee |
| `PUT` | `/:id` | Update salary |
| `DELETE` | `/:id` | Remove a salary record |

---

#### Payroll (`/api/v1/payroll`)

> Protected by `VerifyMiddleware`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Generate payroll for a single employee (HR only) |
| `GET` | `/` | List generated payrolls (filterable by month, year) |
| `GET` | `/:id` | Get a specific payroll document |
| `GET` | `/leave-deductions/:id` | Get unpaid-leave deductions for an employee |
| `POST` | `/bulk` | Generate bulk payroll for all/selected departments (HR only) |

Employee access is restricted to their own payroll. HR can view and generate payrolls for all employees. Payroll documents can be exported as PDFs from the frontend.

**Bulk payroll request body:**

```json
{
  "month": 3,
  "year": 2026,
  "department": ["dept_id_1", "dept_id_2"],
  "bulkBonus": [
    { "reason": "Festival Bonus", "amount": 5000 }
  ],
  "bulkDeduction": [
    { "reason": "Insurance Premium", "amount": 1500 }
  ]
}
```

If `department` is omitted, payroll is generated for **all** departments. `bulkBonus` and `bulkDeduction` are optional arrays applied to every employee in the batch.

---

#### Attendance (`/api/v1/attendance`)

> Protected by `VerifyMiddleware`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Record a punch-in or punch-out |
| `GET` | `/` | Retrieve attendance records (HR gets all, Employee gets own) |

Attendance records are created with a `type: "IN" | "OUT"` and a timestamp. HR analytics view supports filtering by department, month, and year.

---

#### Sync (`/api/v1/sync`)

> Protected by `VerifyMiddleware`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Accepts a batch array of offline attendance punches and writes them to MongoDB |

This endpoint is called exclusively by the frontend's `syncQueue.worker.ts` after the device comes back online. The controller processes the batch atomically.

---

## Client

### Routing & Role-Based Access

**`src/App.tsx`**

The entire app is wrapped in `<ProtectedRoute>` — unauthenticated users are redirected to `/login`. After login, `<RoleBasedRedirect>` reads the user's role from Redux and sends them to their default page:

- `HR` → `/employee`
- `EMPLOYEE` → `/attendance`

All pages are nested under a shared `<Layout>` component (sidebar + header).

---

### Pages

| Route | Component | Role | Description |
|-------|-----------|------|-------------|
| `/login` | `Login.tsx` | Public | Email/password login form |
| `/employee` | `Employee.tsx` | HR | Employee list with create/update/delete, paginated |
| `/departments` | `Departments.tsx` | HR | Department management |
| `/skills` | `Skills.tsx` | HR | Skill management |
| `/salaries` | `Salaries.tsx` | HR | Salary structure management, paginated |
| `/payroll` | `Payroll.tsx` | Both | HR: generate & view all payrolls. Employee: view own payroll |
| `/attendance` | `Attendance.tsx` | Both | HR: analytics dashboard. Employee: punch in/out + history |
| `/leaves` | `Leaves.tsx` | Both | HR: manage types, balances, requests. Employee: apply & track |
| `/events` | `Events.tsx` | Both | Interactive organization-wide events calendar |

---

### Components

Components live in `src/components/` and are organized by feature:

- **`Layout`** — Shell with `Sidebar` and `Header`
- **`Sidebar`** — Navigation links filtered by role
- **`Header`** — User info + logout
- **`leaves/`** — `ApplyLeaveModal`, leave type/balance/request tables
- **`payroll/`** — Payroll table, filter controls
- **`employee/`** — Employee form modal, employee table
- **`departments/`, `skills/`, `salaries/`** — Respective CRUD tables and modals
- **`Attendance/`** — Punch button, attendance history table, analytics charts (Recharts)

All components use **shadcn/ui** primitives (Dialog, Select, Popover, Checkbox, etc.) styled with TailwindCSS.

---

### Hooks

Custom hooks in `src/hooks/` abstract all data-fetching logic from page components. Each hook owns its module's state, API calls, and local sync state:

| Hook | Description |
|------|-------------|
| `useLogin` | Login form state + auth API call |
| `useEmployee` | Employee CRUD + pagination |
| `useDepartments` | Department CRUD |
| `useSkills` | Skill CRUD |
| `useSalaries` | Salary CRUD + pagination |
| `usePayroll` | Payroll generation + paginated fetch |
| `useAttendance` | Punch in/out (with offline handling) + history fetch. Triggers `syncQueue.worker` on reconnect |
| `useLeaves` | Aggregates leave types, balances, and requests. Merges local unsynced changes with API data |
| `useEmployeeLeaves` | Employee-facing leave view (own balances + requests) |

Hooks that support offline-first pass a `syncState` property to table rows, which renders an **"Unsynced"** badge for locally-cached but not-yet-sent mutations.

---

### State Management (Redux)

**`src/store/index.ts`** uses Redux Toolkit's `configureStore` with a single slice:

| Slice | State | Description |
|-------|-------|-------------|
| `userStateSlice` | `userDetails` | Stores the logged-in user's profile (id, name, role, etc.) after login. Cleared on logout. Used by `ProtectedRoute` and `RoleBasedRedirect`. |

---

### Utilities

#### ApiCaller

**`src/utils/ApiCaller.ts`**

A typed generic wrapper around Axios with the following features:

- **Base URL** from `VITE_API_BASE_URL` env var (defaults to `http://localhost:8000`)
- **Offline detection**: Returns a `503` result immediately if `navigator.onLine` is `false` or an `ERR_NETWORK` error is thrown
- **Automatic token refresh**: On a `401` response, it transparently hits `/api/v1/auth/refresh-access-token`. Concurrent requests during the refresh are queued (subscriber pattern) and replayed after the new token is issued
- **Return type**: `ApiResult<T>` — a discriminated union `{ ok: true, response } | { ok: false, response }`

```ts
// Example usage
const result = await ApiCaller<Body, ResponseType>({
  requestType: "GET",
  paths: ["api", "v1", "user", "get-users"],
  queryParams: { page: 1, limit: 10 },
});

if (result.ok) {
  console.log(result.response.data);
}
```

#### DbManger (IndexedDB)

**`src/utils/DbManger.ts`** — `OfflineAttendanceQueue`

Manages a browser-side IndexedDB database (`attendance-queue`) with an object store (`punches`) for storing offline attendance records when the user is without internet.

| Method | Description |
|--------|-------------|
| `init()` | Opens (or creates) the IndexedDB database, creates the `punches` store with a `createdAt` index |
| `addPunch(type)` | Adds a `{ id: UUID, type: "IN"/"OUT", createdAt: timestamp }` record |
| `getAllPunches()` | Returns all queued punches ordered by `createdAt` |
| `deletePunch(id)` | Deletes a single punch by ID (called after successful sync) |
| `clear()` | Clears all punches |

A default singleton `attendanceQueue` is exported and initialized at module load time.

#### OnlineStateChecker

**`src/utils/OnlineStateChecker.ts`**

Utility that listens to `window.online` / `window.offline` events and exposes an observable or callback for hooks to react to connectivity changes. Used by `useAttendance` to trigger the sync worker when the device reconnects.

#### PdfGenerator

**`src/utils/PdfGenerator.tsx`**

A React PDF template built with `@react-pdf/renderer`. Generates formatted payslip PDFs from payroll data. Used in the Payroll page to allow employees and HR to download payslips.

---

### Web Workers

#### `syncQueue.worker.ts`

A dedicated **Web Worker** (runs off the main thread) that flushes queued offline attendance punches to the server. It operates entirely with raw `indexedDB` APIs (no `idb` wrapper, since workers can't import ES modules easily).

**Lifecycle:**
1. Main thread posts `{ type: "FLUSH", baseUrl }` when the device goes online
2. Worker opens the same `attendance-queue` IndexedDB
3. Batches punches (10 per batch) and `POST`s them to `/api/v1/sync`
4. On success, deletes each synced punch from IndexedDB
5. Posts `{ type: "FLUSH_COMPLETE" }` or `{ type: "FLUSH_ERROR", error }` back to the main thread

#### `pdf.worker.tsx`

A Web Worker for off-thread PDF generation, preventing UI blocking during large payslip renders.

---

## Offline-First Architecture

```
User punches IN/OUT (no internet)
       │
       ▼
OfflineAttendanceQueue.addPunch()  ──→  IndexedDB (attendance-queue)
       │
       │  (device comes back online)
       │
       ▼
OnlineStateChecker detects online event
       │
       ▼
useAttendance triggers syncQueue.worker (FLUSH message)
       │
       ▼
syncQueue.worker reads IndexedDB → batches → POST /api/v1/sync
       │
       ▼
Backend Sync Controller → writes to MongoDB (Attendance collection)
       │
       ▼
syncQueue.worker deletes synced records from IndexedDB
       │
       ▼
Worker posts FLUSH_COMPLETE → UI refreshes attendance list
```

The "Unsynced" badge is shown in the attendance table for records that exist only in IndexedDB and haven't been confirmed by the server yet, giving users a clear visual indicator of pending items.

---

## Data Flow Diagram

```
Client                              Backend
─────────────────────────────────── ──────────────────────────────────
Login form
  └─ POST /api/v1/auth/login ──────► AuthController.Login
                                         │ bcrypt.compare
                                         │ jwt.sign (access + refresh)
  ◄─ Set-Cookie: accessToken ──────────┘

Protected page load
  └─ GET /api/v1/user/get-users ───► VerifyMiddleware (jwt.verify)
     + cookies.accessToken             └─► UserController.GetUsers
                                              └─► Mongoose.find()
  ◄─ { data: [...users] } ───────────────────────────────────────────

Token expiry (401)
  ApiCaller intercepts
  └─ POST /api/v1/auth/refresh ────► AuthController.RefreshToken
  ◄─ new accessToken cookie                │ jwt.verify(refreshToken)
  └─ Retry original request ───────────── │ jwt.sign(new accessToken)
```

---

## API Response Format

All endpoints return a consistent JSON envelope:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "success": true,
  "errors": []
}
```

Error responses follow the same shape with `success: false` and the appropriate HTTP status code:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "data": null,
  "success": false,
  "errors": []
}
```

---

*NexusHR — Built with ❤️ for Restroworks*
