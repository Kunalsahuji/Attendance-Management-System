# Full-Stack MERN Attendance Management System (AttendSphere)

**Organization:** D-Table Analytics  
**Architecture:** React 19 (Vite) + Redux Toolkit & RTK Query + Node.js / Express + MongoDB Atlas + Tailwind CSS  
**Language:** JavaScript (`.js`, `.jsx`)

---

## 1. Overview & Core Capabilities

**AttendSphere** is an enterprise-grade full-stack employee attendance tracking platform built to guarantee proof of physical presence, eliminate buddy punching, and automate shift duration calculations:

1. **Live Camera Selfie Verification**: Real-time WebRTC camera capture using HTML5 MediaDevices API (`<video>` / `<canvas>`). **Strictly forbids file-picker uploads**. Hardware tracks are immediately terminated upon capture and dialog dismissal to protect user privacy.
2. **GPS Geolocation Tracking**: Captures real-time latitude, longitude, and accuracy upon Punch-In and Punch-Out. Integrates clickable Google Maps links for location audits.
3. **Automated Server-Side Shift Calculations**: Shift duration is computed strictly on the backend upon Punch-Out using server-authoritative timestamps:
   - $\ge 8.0\text{ hours} \rightarrow$ **Completed**
   - $< 8.0\text{ hours} \rightarrow$ **Incomplete**
   - Active shift $\rightarrow$ **In Progress**
4. **Role-Based Access Control (RBAC)**:
   - **Employee**: Biometric Punch In/Out, real-time live elapsed shift timer, personal history, overtime claim submissions.
   - **Manager**: Scoped team visibility, biometric authenticity review (side-by-side selfies & GPS audit), certify or reject attendance, adjudicate overtime claims.
   - **Admin**: System-wide organizational oversight, employee-to-manager assignment, executive audit certification, comprehensive daily report extraction.
5. **Biometric Authenticity Review Workflow**: Authorized Managers and Admins audit punch-in and punch-out selfies side by side, verify GPS coordinates, and certify status as **VALID** or flag as **INVALID (suspicious)** with audit remarks.
6. **Overtime Claim Management**: Employees can log overtime hours with business justifications; Managers approve or reject claims, tracking approved overtime separately from base shift hours.
7. **Role-Scoped Daily Reports**: Daily aggregated reports filterable by date, shift status, verification status, and overtime claims, with client-side CSV export capability.
8. **Responsive Modal System & Scroll Lock**: Viewport-adaptive modal architecture with background scroll freezing (`useBodyScrollLock`) and `overscroll-contain` prevention across all screen resolutions.

---

## 2. Seed Test Accounts (One-Click Login Supported)

The application includes pre-configured seed accounts in MongoDB Atlas and 1-Click demo login buttons on the Sign In page:

| Role | Email | Password | Scope & Responsibilities |
|---|---|---|---|
| **Admin** | `admin@attendance.com` | `AdminPassword123!` | System-wide visibility, all users, manager assignments |
| **Manager** | `manager@attendance.com` | `ManagerPassword123!` | Assigned team members, team verification, team OT review |
| **Employee** | `employee@attendance.com` | `EmployeePassword123!` | Personal biometric attendance, live timer, submit OT claims |

> **Security Note:** Public registration via `/signup` is strictly restricted to **Employee** accounts to prevent unauthorized privilege escalation.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 19 with Vite
- **State Management & Data Fetching:** Redux Toolkit & RTK Query
- **Styling:** Tailwind CSS with custom dark SaaS aesthetics & responsive dialogs
- **Icons:** Lucide React
- **Client Routing:** React Router v7 with role-based Route Guards

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB Atlas via Mongoose
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **Testing:** Node.js native test runner (`node --test`)
- **Logging & Security:** Morgan, Helmet, CORS, and centralized error handling

---

## 4. Project Directory Structure

```text
├── backend/
│   ├── src/
│   │   ├── config/           # MongoDB Atlas connection (db.js)
│   │   ├── controllers/      # auth, attendance, overtime, report, user controllers
│   │   ├── middleware/       # JWT auth guard, RBAC authorizeRoles, errorHandler
│   │   ├── models/           # User, Attendance, Overtime Mongoose models
│   │   ├── routes/           # Express API route modules
│   │   ├── utils/            # Image storage & JWT token helpers
│   │   ├── app.js            # Express app configuration & middleware
│   │   └── server.js         # HTTP server entry point
│   ├── tests/
│   │   └── api.test.js       # 15/15 comprehensive integration test suite
│   ├── package.json          # Backend dependencies & test scripts
│   └── .env.example          # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── components/       # CameraCapture (WebRTC), LocationDisplay, Navbar, ProtectedRoute
│   │   ├── hooks/            # useElapsedTime, useBodyScrollLock
│   │   ├── pages/            # EmployeeDashboard, ManagerDashboard, AdminDashboard, DailyReport, Login, Signup
│   │   ├── store/            # Redux store, RTK Query API slice & authSlice
│   │   ├── utils/            # formatters (coordinates, dates, durations)
│   │   ├── App.jsx           # Application routing & role redirects
│   │   ├── index.css         # Tailwind directives & sleek scrollbars
│   │   └── main.jsx          # React DOM root
│   ├── package.json          # Frontend dependencies & scripts
│   └── vite.config.js        # Vite build & server proxy configuration
├── docs/                     # Assessment brief and planning specs (gitignored)
├── README.md                 # Project documentation
└── .gitignore                # Comprehensive ignore rules (.env, node_modules, uploads)
```

---

## 5. Getting Started Locally

### Prerequisites
- Node.js >= 18.x
- Active MongoDB Atlas cluster URI

### Step 1: Backend Setup
```bash
cd backend
npm install

# Copy environment template and configure MONGODB_URI and JWT_SECRET
cp .env.example .env

# Start API server in development mode (port 5000)
npm run dev
```

### Step 2: Frontend Setup
```bash
cd frontend
npm install

# Start Vite development client (port 5173)
npm run dev
```

The frontend will run at `http://localhost:5173` and automatically proxy API calls to `http://localhost:5000`.

---

## 6. API Reference

### Authentication & Users
- `POST /api/auth/signup` - Register a new employee (public registration forced to Employee role)
- `POST /api/auth/login` - Authenticate user and receive JWT bearer token
- `GET /api/users/all` - List all users with manager assignments (Admin only)
- `GET /api/users/managers` - List all registered managers (Admin only)
- `PATCH /api/users/:userId/assign-manager` - Assign reporting manager to employee (Admin only)

### Attendance
- `POST /api/attendance/punch-in` - Record biometric punch-in with live selfie and GPS (Employee only)
- `POST /api/attendance/punch-out` - Record punch-out, calculate shift hours and threshold (Employee only)
- `GET /api/attendance/status` - Current shift state and today's accumulated duration (Employee only)
- `GET /api/attendance/history` - Employee's own historical attendance logs (Employee only)
- `GET /api/attendance/team` - Team attendance logs (Manager only, scoped to assigned reports)
- `GET /api/attendance/all` - Organization-wide attendance records (Admin only)
- `PATCH /api/attendance/:id/verify` - Certify or reject selfie/GPS authenticity (Manager / Admin)

### Overtime
- `POST /api/overtime/request` - Submit overtime hours with justification (Employee only)
- `GET /api/overtime/my-requests` - View personal overtime claim history (Employee only)
- `GET /api/overtime/team-requests` - View team overtime claims (Manager only)
- `PATCH /api/overtime/:id/review` - Approve or reject claim with manager notes (Manager only)

### Reports & Analytics
- `GET /api/reports/dashboard-stats` - Real-time role-scoped KPI metrics and stats
- `GET /api/reports/daily?date=YYYY-MM-DD` - Aggregated daily attendance report with overtime data

---

## 7. Verification & Automated Test Suite

### Running Backend Integration Tests
Execute the native Node.js test runner against MongoDB Atlas:
```bash
cd backend
npm test
```

**Results: 15/15 Tests Passing (0 Failures):**
1. Health Check Endpoint
2. Authentication & Public Signup (Force Employee Role)
3. Login with Seed Accounts (Admin, Manager, Employee)
4. Attendance Punch-In Workflow & Duplicate Prevention
5. Attendance Punch-Out Workflow & Immediate Duration Calculation
6. Working Hours Math: Exact 8.0 hrs and > 8.0 hrs Threshold Logic
7. Validation Errors: Missing Selfie, Missing Location, Invalid Punch-Out
8. Overtime Submission & Manager Approval Workflow
9. Attendance Verification Workflow (Biometric Certification)
10. Daily Attendance Reports with Overtime Status & RBAC Scoping
11. Role-Scoped Real Dashboard Metrics API
12. Role Restriction: Manager & Admin Forbidden from Punching In/Out
13. Client-Supplied Duration Tampering Protection
14. RBAC & Cross-Tenant Data Isolation Checks
15. Cross-Manager Team Scoping & Isolation Enforcement

### Running Frontend Quality Checks
```bash
cd frontend
npm run lint   # ESLint audit (0 errors, 0 warnings)
npm run build  # Production Vite bundle compilation
```

---

## 8. Security & Compliance Standards

- **Server-Authoritative Timing:** Client timestamps and durations are ignored. All shift start, end, and duration values are generated by server clocks.
- **Biometric Integrity:** File-picker uploads are forbidden. Only live canvas snapshots from WebRTC media streams are accepted.
- **Hardware Track Teardown:** All camera tracks are terminated immediately upon frame capture or modal close.
- **Secrets Protection:** Environment credentials (`.env`, MongoDB Atlas connection strings) are strictly gitignored and excluded from version control.
- **Data Scoping:** Managers can only access records and claims of employees explicitly assigned to them.
