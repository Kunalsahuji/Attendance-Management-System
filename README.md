# 🕒 AttendSphere - Full-Stack MERN Attendance Management System

**AttendSphere** is an enterprise-grade, high-fidelity, and secure employee attendance tracking platform built for **D-Table Analytics**. It guarantees proof of physical presence, eliminates buddy punching, and automates shift duration tracking through real-time WebRTC camera selfie verification, browser GPS geolocation tracking, and server-authoritative 8-hour shift evaluation logic.

---

## 📌 Project Details
- **Organization**: D-Table Analytics (Full-Stack MERN Assessment)
- **Objective**: Build a production-ready, tamper-resistant attendance management system with role-based access control (Employee, Manager, Admin), live biometric photo verification (strictly forbidding file uploads), geolocation tracking, server-side duration math, and an overtime approval workflow.
- **Key Modules**:
  - **Biometric Terminal**: Live WebRTC camera selfie capture and GPS location acquisition with automatic hardware release.
  - **Employee Hub**: Real-time ticking shift timer, 8-hour threshold progress bar, attendance history, and overtime claim filing.
  - **Manager Portal**: Team attendance dashboard, side-by-side punch-in/out biometric authenticity audit, and overtime adjudication.
  - **Executive Admin Console**: Organizational analytics, employee-to-manager designated reporting assignments, and company-wide audit certifications.
  - **Daily Aggregated Reports**: Comprehensive daily attendance logs with overtime details, status filters, and instant CSV export.
- **Design Philosophy**: Strict adherence to modern SaaS aesthetics — curated HSL dark mode palette, smooth gradients, responsive modal architecture with background scroll freezing (`useBodyScrollLock`), and micro-interactions across desktop and mobile viewports.
- **Tech Stack**:
  - **Frontend**: React 19 + Vite (JavaScript)
  - **State Management & Caching**: Redux Toolkit & RTK Query
  - **Styling**: Tailwind CSS v4 (Custom Dark Design System & Sleek Scrollbars)
  - **Icons**: Lucide React
  - **Backend**: Node.js + Express.js (REST API Architecture)
  - **Database**: MongoDB Atlas (Cloud Cluster via Mongoose ODM)
  - **Security & Logging**: JWT (JSON Web Tokens), bcryptjs, Helmet, Morgan, and CORS

---

## ✨ Features
- **Live Camera Selfie Verification**: Real-time WebRTC camera feed via HTML5 MediaDevices API (`<video>` / `<canvas>`). **Strictly forbids file-picker uploads**. Hardware tracks are immediately terminated upon frame capture, modal close, or unmount to protect user privacy.
- **GPS Geolocation Tracking**: Captures real-time latitude, longitude, and accuracy upon Punch-In and Punch-Out. Integrates direct Google Maps links for physical audit verification.
- **Server-Authoritative Shift Duration**: Shift hours and threshold statuses are computed strictly on the backend upon Punch-Out using server clocks, preventing client-side duration tampering:
  - $\ge 8.0\text{ hours} \rightarrow$ **Completed**
  - $< 8.0\text{ hours} \rightarrow$ **Incomplete**
  - Active shift $\rightarrow$ **In Progress**
- **Strict Role-Based Access Control (RBAC)**:
  - **Employee**: Biometric Punch In/Out, personal historical logs, and overtime claim submissions.
  - **Manager**: Scoped team visibility, biometric authenticity review (side-by-side selfie inspection), certifying attendance as **Valid** or flagging **Invalid**, and approving/rejecting overtime.
  - **Admin**: Full organization-wide visibility, all-user management, manager assignments, executive biometric certification, and aggregated daily report extraction.
- **Overtime Claim Management Workflow**: Employees can log overtime hours with business justifications; Managers review, approve, or reject claims, tracking approved overtime separately from base shift hours.
- **Biometric Authenticity Review**: Authorized Managers and Admins audit punch-in and punch-out selfies side by side, verify GPS coordinates, and certify status as **VALID** or flag as **INVALID (suspicious)** with audit remarks.
- **Role-Scoped Daily Reports with CSV Export**: Aggregated daily attendance logs filterable by date, shift status, verification status, and overtime claims, with one-click CSV export generated entirely in the browser.
- **Modal Scroll-Lock & Responsive Architecture**: Two-level scroll architecture with background scroll freezing (`useBodyScrollLock`) and `overscroll-contain` prevention across all screen resolutions and laptop viewports.

---

## 🔗 Live Implementation
🚀 **Live Web Application**: [https://attendance-management-system-gray-five.vercel.app/](https://attendance-management-system-gray-five.vercel.app/)  
⚡ **Production Backend API**: [https://attendance-management-system-k7wg.onrender.com](https://attendance-management-system-k7wg.onrender.com)  
📂 **GitHub Repository**: [https://github.com/Kunalsahuji/Attendance-Management-System](https://github.com/Kunalsahuji/Attendance-Management-System)  

| Detail | Value |
|---|---|
| **Frontend Deployed URL** | https://attendance-management-system-gray-five.vercel.app/ |
| **Backend API URL** | https://attendance-management-system-k7wg.onrender.com |
| **Git Repository** | https://github.com/Kunalsahuji/Attendance-Management-System |
| **Frontend Hosting** | Vercel (Auto-deployed from `main` branch with SPA rewrites) |
| **Backend Hosting** | Render (Web Service running Node.js 24) |
| **Database** | MongoDB Atlas (`kunalcluster.beakm07.mongodb.net`) |

---

## 🔑 Authorized Evaluation Credentials

The application uses standard secure credential-based authentication. Test credentials for evaluation:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `admin@attendance.com` | `AdminPassword123!` | System-wide visibility, user management, manager assignments, executive audit |
| **Manager** | `manager@attendance.com` | `ManagerPassword123!` | Assigned team members, biometric verification, overtime review |
| **Employee** | `employee@attendance.com` | `EmployeePassword123!` | Personal biometric attendance, live shift timer, submit OT claims |

> **Security Note:** Public registration via `/signup` is strictly restricted to **Employee** accounts to prevent unauthorized privilege escalation.

---

## 📦 Project Setup

### Prerequisites
- Node.js >= 18.x
- Active MongoDB Atlas cluster URI

```bash
# Clone the repository
git clone https://github.com/Kunalsahuji/Attendance-Management-System.git
cd Attendance-Management-System

# 1. Backend Setup
cd backend
npm install
# Configure backend/.env with MONGODB_URI and JWT_SECRET
npm run seed     # Seeds Admin, Manager, and Employee accounts in MongoDB Atlas
npm run dev      # Starts Express server on http://localhost:5000

# 2. Frontend Setup (in a separate terminal)
cd ../frontend
npm install
npm run dev      # Starts Vite client on http://localhost:5173
```

---

## 🧪 Automated Test Suite (15/15 Tests Passing)

Execute the native Node.js test runner against MongoDB Atlas:
```bash
cd backend
npm test
```

**Results: 15/15 Integration Tests Passed (0 Failures):**
1. Health Check Endpoint (`GET /api/health`)
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
12. Role Restriction: Manager & Admin Forbidden from Punching In/Out (HTTP 403)
13. Client-Supplied Duration Tampering Protection
14. RBAC & Cross-Tenant Data Isolation Checks
15. Cross-Manager Team Scoping & Isolation Enforcement

```bash
# Frontend Quality Audits
cd frontend
npm run lint   # ESLint audit (0 errors, 0 warnings)
npm run build  # Production Vite bundle compilation (clean build in <1s)
```

---

## 🤝 Connect with Me
I'm **Kunal Sahu** — a full-stack developer (MERN) who loves turning complex business workflows and briefs into clean, fast, and production-ready products. If you'd like to discuss this project, ask for a walkthrough, or collaborate on something, reach out any time:

📦 **GitHub**: [github.com/Kunalsahuji](https://github.com/Kunalsahuji)  
🔗 **LinkedIn**: [kunalsahuji](https://www.linkedin.com/in/kunalsahuji/)  
📌 **Notion**: [Watch my content](https://www.notion.so/1dff7c6ce1bb803787fbddd34e422ab4?v=1e0f7c6ce1bb8052b14c000cb57448ee&pvs=4)  
📧 **Email**: [ksahu0103@gmail.com](mailto:ksahu0103@gmail.com)  
🗂️ **This project**: [Attendance-Management-System](https://github.com/Kunalsahuji/Attendance-Management-System) · [Live demo](https://attendance-management-system-gray-five.vercel.app/)

> Feedback, feature requests, and code reviews are all welcome — open an issue on the repo or drop me an email.

---

## 🙌 Acknowledgements
Developed with ❤️ by [Kunal Sahu](https://github.com/Kunalsahuji) for the **D-Table Analytics** assessment.
