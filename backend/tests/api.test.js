const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');
const Overtime = require('../src/models/Overtime');

let server;
let port;
let employeeToken = '';
let managerToken = '';
let adminToken = '';
let employeeId = '';
let attendanceId = '';
let overtimeId = '';

// Helper to make HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = {};
        try { json = JSON.parse(data); } catch (e) { json = { raw: data }; }
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test.before(async () => {
  await connectDB();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  port = server.address().port;
});

test.after(async () => {
  // Safe test hygiene: Clean up only ephemeral test records created by this test suite run
  try {
    if (employeeId) {
      await Attendance.deleteMany({ user: employeeId });
      await Overtime.deleteMany({ user: employeeId });
      await User.findByIdAndDelete(employeeId);
    }
    await User.deleteMany({ email: /^manager2\./ });
  } catch (err) {
    console.warn('Test cleanup notice:', err.message);
  }
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  const mongoose = require('mongoose');
  await mongoose.connection.close();
});

test('1. Health Check Endpoint', async () => {
  const res = await request('GET', '/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'OK');
});

test('2. Authentication & Public Signup (Force Employee Role)', async () => {
  const email = `test.emp.${Date.now()}@test.com`;
  const res = await request('POST', '/api/auth/signup', {
    name: 'Test Candidate',
    email,
    password: 'Password123!',
    role: 'Admin' // Attempting to escalate to Admin
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  // Must be strictly Employee despite 'Admin' requested in body
  assert.strictEqual(res.body.user.role, 'Employee');
  employeeToken = res.body.token;
  employeeId = res.body.user._id;
});

test('3. Login with Seed Accounts', async () => {
  // Login Manager
  const mRes = await request('POST', '/api/auth/login', {
    email: process.env.MANAGER_EMAIL || 'manager@attendance.com',
    password: process.env.MANAGER_PASSWORD || 'ManagerPassword123!'
  });
  assert.strictEqual(mRes.status, 200);
  assert.strictEqual(mRes.body.user.role, 'Manager');
  managerToken = mRes.body.token;

  // Login Admin
  const aRes = await request('POST', '/api/auth/login', {
    email: process.env.ADMIN_EMAIL || 'admin@attendance.com',
    password: process.env.ADMIN_PASSWORD || 'AdminPassword123!'
  });
  assert.strictEqual(aRes.status, 200);
  assert.strictEqual(aRes.body.user.role, 'Admin');
  adminToken = aRes.body.token;

  // Assign employee to this manager for team tests
  await User.findByIdAndUpdate(employeeId, { managerId: mRes.body.user._id });
});

test('4. Attendance Punch-In Workflow', async () => {
  const dummySelfie = 'data:image/jpeg;base64,' + Buffer.from('test-image-content').toString('base64');
  
  const res = await request('POST', '/api/attendance/punch-in', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, employeeToken);

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.attendance.workStatus, 'IN_PROGRESS');
  attendanceId = res.body.attendance._id;

  // Negative test: Duplicate Punch In must fail
  const dupRes = await request('POST', '/api/attendance/punch-in', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, employeeToken);

  assert.strictEqual(dupRes.status, 400);
  assert.strictEqual(dupRes.body.success, false);
});

test('5. Attendance Punch-Out Workflow and Immediate Duration Calculation', async () => {
  const dummySelfie = 'data:image/jpeg;base64,' + Buffer.from('test-image-content-out').toString('base64');

  const res = await request('POST', '/api/attendance/punch-out', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, employeeToken);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  // Since punch out is immediate, hours < 8 -> INCOMPLETE
  assert.strictEqual(res.body.attendance.workStatus, 'INCOMPLETE');

  // Negative test: Duplicate Punch Out must fail
  const dupRes = await request('POST', '/api/attendance/punch-out', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, employeeToken);

  assert.strictEqual(dupRes.status, 400);
});

test('6. Working Hours Math: Exact 8.0 hrs and > 8.0 hrs Threshold Logic', async () => {
  const dummySelfie = 'data:image/jpeg;base64,' + Buffer.from('threshold-test-image').toString('base64');

  // Case A: Exactly 8 hours (8 * 60 * 60 * 1000 ms)
  const eightHoursAgo = new Date(Date.now() - (8 * 60 * 60 * 1000));
  const session8h = await Attendance.create({
    user: employeeId,
    date: '2026-10-20',
    punchInTime: eightHoursAgo,
    punchInLocation: { latitude: 28.6139, longitude: 77.2090, accuracy: 5 },
    punchInSelfie: '/uploads/dummy.jpg',
    workStatus: 'IN_PROGRESS'
  });

  const res8h = await request('POST', '/api/attendance/punch-out', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, employeeToken);

  assert.strictEqual(res8h.status, 200);
  assert.strictEqual(res8h.body.attendance.workStatus, 'COMPLETED');
  assert.ok(res8h.body.attendance.totalHours >= 8.0);

  // Case B: More than 8 hours (9.5 hours ago)
  const nineHoursAgo = new Date(Date.now() - (9.5 * 60 * 60 * 1000));
  await Attendance.create({
    user: employeeId,
    date: '2026-10-19',
    punchInTime: nineHoursAgo,
    punchInLocation: { latitude: 28.6139, longitude: 77.2090, accuracy: 5 },
    punchInSelfie: '/uploads/dummy.jpg',
    workStatus: 'IN_PROGRESS'
  });

  const res9h = await request('POST', '/api/attendance/punch-out', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, employeeToken);

  assert.strictEqual(res9h.status, 200);
  assert.strictEqual(res9h.body.attendance.workStatus, 'COMPLETED');
  assert.ok(res9h.body.attendance.totalHours >= 9.0);
});

test('7. Validation Errors: Missing Selfie, Missing Location, Invalid Punch-Out', async () => {
  // Missing location on punch in
  const noLocRes = await request('POST', '/api/attendance/punch-in', {
    selfie: 'data:image/jpeg;base64,abc'
  }, employeeToken);
  assert.strictEqual(noLocRes.status, 400);

  // Missing selfie on punch in
  const noSelfieRes = await request('POST', '/api/attendance/punch-in', {
    latitude: 28.6139,
    longitude: 77.2090
  }, employeeToken);
  assert.strictEqual(noSelfieRes.status, 400);

  // Punch out without active session
  const noSessionRes = await request('POST', '/api/attendance/punch-out', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: 'data:image/jpeg;base64,abc'
  }, employeeToken);
  assert.strictEqual(noSessionRes.status, 400);
});

test('8. Overtime Submission & Manager Approval Workflow', async () => {
  // Employee submits OT
  const otRes = await request('POST', '/api/overtime/request', {
    date: new Date().toISOString().split('T')[0],
    requestedHours: 2.5,
    reason: 'Critical server deployment support',
    attendanceId: attendanceId
  }, employeeToken);

  assert.strictEqual(otRes.status, 201);
  assert.strictEqual(otRes.body.overtime.status, 'PENDING');
  overtimeId = otRes.body.overtime._id;

  // Negative test: Employee cannot review/approve own OT
  const unauthRes = await request('PATCH', `/api/overtime/${overtimeId}/review`, {
    status: 'APPROVED',
    reviewerNotes: 'Self-approval attempt'
  }, employeeToken);
  assert.strictEqual(unauthRes.status, 403);

  // Manager approves OT
  const mApproveRes = await request('PATCH', `/api/overtime/${overtimeId}/review`, {
    status: 'APPROVED',
    reviewerNotes: 'Approved by project manager'
  }, managerToken);

  assert.strictEqual(mApproveRes.status, 200);
  assert.strictEqual(mApproveRes.body.overtime.status, 'APPROVED');
});

test('9. Attendance Verification Workflow', async () => {
  // Negative test: Employee cannot verify attendance
  const unauthRes = await request('PATCH', `/api/attendance/${attendanceId}/verify`, {
    status: 'VALID',
    remarks: 'Self-verification attempt'
  }, employeeToken);
  assert.strictEqual(unauthRes.status, 403);

  // Manager verifies attendance
  const verifyRes = await request('PATCH', `/api/attendance/${attendanceId}/verify`, {
    status: 'VALID',
    remarks: 'Live selfie matches registered employee.'
  }, managerToken);

  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyRes.body.attendance.verificationStatus, 'VALID');
});

test('10. Daily Attendance Reports with Overtime Status & RBAC Scoping', async () => {
  const today = new Date().toISOString().split('T')[0];

  // Employee report: contains only own record
  const empRep = await request('GET', `/api/reports/daily?date=${today}`, null, employeeToken);
  assert.strictEqual(empRep.status, 200);
  assert.ok(empRep.body.report.every(r => r.employeeEmail.includes('test.emp')));

  // Manager report: contains assigned team records
  const mgrRep = await request('GET', `/api/reports/daily?date=${today}`, null, managerToken);
  assert.strictEqual(mgrRep.status, 200);
  assert.ok(Array.isArray(mgrRep.body.report));

  // Admin report: contains system-wide records
  const admRep = await request('GET', `/api/reports/daily?date=${today}`, null, adminToken);
  assert.strictEqual(admRep.status, 200);
  assert.ok(admRep.body.count >= 1);
});

test('11. Role-Scoped Real Dashboard Metrics API', async () => {
  // Employee stats
  const empStats = await request('GET', '/api/reports/dashboard-stats', null, employeeToken);
  assert.strictEqual(empStats.status, 200);
  assert.strictEqual(empStats.body.role, 'Employee');
  assert.strictEqual(empStats.body.stats.standardShiftTarget, 8.0);
  assert.ok(typeof empStats.body.stats.completedShifts === 'number');

  // Manager stats
  const mgrStats = await request('GET', '/api/reports/dashboard-stats', null, managerToken);
  assert.strictEqual(mgrStats.status, 200);
  assert.strictEqual(mgrStats.body.role, 'Manager');
  assert.ok(typeof mgrStats.body.stats.teamSize === 'number');
  assert.ok(typeof mgrStats.body.stats.attendanceRate === 'number');

  // Admin stats
  const admStats = await request('GET', '/api/reports/dashboard-stats', null, adminToken);
  assert.strictEqual(admStats.status, 200);
  assert.strictEqual(admStats.body.role, 'Admin');
  assert.ok(typeof admStats.body.stats.totalEmployees === 'number');
});

test('12. Role Restriction: Manager & Admin Forbidden from Punching In/Out', async () => {
  const dummySelfie = 'data:image/jpeg;base64,' + Buffer.from('unauth-punch-selfie').toString('base64');
  
  // Admin punch-in attempt
  const adminInRes = await request('POST', '/api/attendance/punch-in', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, adminToken);
  assert.strictEqual(adminInRes.status, 403);

  // Admin punch-out attempt
  const adminOutRes = await request('POST', '/api/attendance/punch-out', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, adminToken);
  assert.strictEqual(adminOutRes.status, 403);

  // Manager punch-in attempt
  const mgrInRes = await request('POST', '/api/attendance/punch-in', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, managerToken);
  assert.strictEqual(mgrInRes.status, 403);

  // Manager punch-out attempt
  const mgrOutRes = await request('POST', '/api/attendance/punch-out', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, managerToken);
  assert.strictEqual(mgrOutRes.status, 403);
});

test('13. Client-Supplied Duration Tampering Protection', async () => {
  const dummySelfie = 'data:image/jpeg;base64,' + Buffer.from('tamper-test').toString('base64');

  // Employee punches in legitimately
  const inRes = await request('POST', '/api/attendance/punch-in', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie
  }, employeeToken);
  assert.strictEqual(inRes.status, 201);

  // Client attempts to punch out while injecting 14 hours and COMPLETED status
  const outRes = await request('POST', '/api/attendance/punch-out', {
    latitude: 28.6139,
    longitude: 77.2090,
    selfie: dummySelfie,
    totalHours: 14.0, // Client tries to spoof hours
    workStatus: 'COMPLETED' // Client tries to spoof status
  }, employeeToken);

  assert.strictEqual(outRes.status, 200);
  // Must be calculated by server (near 0 hours, therefore INCOMPLETE)
  assert.strictEqual(outRes.body.attendance.workStatus, 'INCOMPLETE');
  assert.strictEqual(outRes.body.attendance.totalHours < 1.0, true);
});

test('14. RBAC & Cross-Tenant Data Isolation Checks', async () => {
  // Employee cannot access /api/attendance/team
  const teamRes = await request('GET', '/api/attendance/team', null, employeeToken);
  assert.strictEqual(teamRes.status, 403);

  // Employee cannot access /api/attendance/all
  const allRes = await request('GET', '/api/attendance/all', null, employeeToken);
  assert.strictEqual(allRes.status, 403);

  // Unauthenticated requests must receive 401
  const unauthStatus = await request('GET', '/api/attendance/status');
  assert.strictEqual(unauthStatus.status, 401);

  const unauthReport = await request('GET', '/api/reports/daily');
  assert.strictEqual(unauthReport.status, 401);
});

test('15. Cross-Manager Team Scoping & Isolation Enforcement', async () => {
  // Create Manager 2 (Unassigned to the employee)
  const m2Email = `manager2.${Date.now()}@attendance.com`;
  const m2User = await User.create({
    name: 'Manager Two',
    email: m2Email,
    password: 'Password123!',
    role: 'Manager',
    department: 'Operations'
  });
  
  const m2Login = await request('POST', '/api/auth/login', {
    email: m2Email,
    password: 'Password123!'
  });
  const manager2Token = m2Login.body.token;

  // Manager 2 attempts to review Manager 1 employee's overtime request
  const unauthOtReview = await request('PATCH', `/api/overtime/${overtimeId}/review`, {
    status: 'REJECTED',
    reviewerNotes: 'Attempted review by unauthorized manager'
  }, manager2Token);

  assert.strictEqual(unauthOtReview.status, 403);
  assert.strictEqual(unauthOtReview.body.success, false);

  // Manager 2 attempts to verify Manager 1 employee's attendance record
  const unauthVerify = await request('PATCH', `/api/attendance/${attendanceId}/verify`, {
    status: 'INVALID',
    remarks: 'Attempted verification by unauthorized manager'
  }, manager2Token);

  assert.strictEqual(unauthVerify.status, 403);
  assert.strictEqual(unauthVerify.body.success, false);
});
