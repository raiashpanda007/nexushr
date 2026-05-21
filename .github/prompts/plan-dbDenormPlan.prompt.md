## Plan: Denormalize MongoDB schema + optimize queries

Denormalize common read paths across all models (moderate embedding), replace costly populate/$lookup calls with snapshots, and add targeted compound indexes. Update backend controllers/types and frontend hooks/pages to consume the new shapes, and document all changes in a single change log file.

**Steps**
1. Define reusable snapshot shapes used across models: UserSummary, DeptSummary, SkillSummary, LeaveTypeSummary, RoundSummary, OpeningSummary, SalarySnapshot; decide which lists need embedded names vs ids only (*depends on alignment with frontend tables and filters*).
2. Update schemas to embed snapshots and add indexes: Users (deptSummary, skills with skillName), Attendance (userSnapshot), LeaveBalances/LeaveRequests (userSnapshot + leaveTypeSnapshot), Payroll (userSnapshot + salarySnapshot), Hiring models (Openings/Applicants/Interviews snapshots), and secondary modules (Assets, Events, Training) where lists currently populate Users/Departments.
3. Add snapshot builder helpers in backend utils and use them in create/update flows; update canonical doc edits (department rename, skill rename, user profile updates, leave type changes, round updates) to fan out snapshot changes via updateMany.
4. Replace populate/$lookup in hot list/detail endpoints with snapshot fields; add lean + projection; simplify aggregation pipelines where lookups become unnecessary; add/adjust compound indexes for frequent filters and date range queries. Also please add indexes on snapshot fields used for filtering (e.g. deptName, skillName) to speed up queries that would have previously required a $lookup.
5. Update backend Zod types and frontend types to reflect new response shapes; adjust API response mapping to be consistent.
6. Update frontend hooks/pages to read snapshot fields instead of populated subdocs (Leaves, Attendance, Payroll, Salaries, Employee, Hiring, Search); keep filtering and table renderers aligned with new shapes.
7. Create docs/db-denorm-changes.md to document every schema/query/UI change and why it was made.

**Relevant files**
- backend/src/modules/Users/models/users.models.js — add dept/skill snapshots and indexes
- backend/src/modules/Attendance/Models/attendance.model.js — add userSnapshot and query adjustments
- backend/src/modules/Leaves/LeavesBalances/Models/leavesBalances.model.js — embed leaveTypeSnapshot
- backend/src/modules/Leaves/LeaveRequests/Models/leaveRequests.model.js — embed user/leave snapshots
- backend/src/modules/Payroll/Models/payroll.model.js — embed salarySnapshot and userSnapshot
- backend/src/modules/Salaries/Models/salaries.model.js — keep userId, add denorm fields if needed
- backend/src/modules/Hiring/Models/openings.model.js — embed department/hiringManager/round/skill summaries
- backend/src/modules/Hiring/Models/applicants.model.js — embed opening/round summaries
- backend/src/modules/Hiring/Models/interview.model.js — embed applicant/round/reviewer summaries
- backend/src/modules/Search/Controller/search.controller.js — refactor to use snapshot fields
- client/src/hooks/Leaves/useLeaves.ts — consume leave snapshots
- client/src/hooks/Attendance/useAttendance.ts — consume userSnapshot + deptName
- client/src/hooks/Payroll/usePayroll.ts — consume salarySnapshot + userSnapshot
- client/src/hooks/Salaries/useSalaries.ts — consume userSnapshot + deptName
- client/src/hooks/Employee/useEmployee.ts — normalize dept/skills shapes
- client/src/pages/dashboard/Leaves.tsx — table rendering changes
- client/src/pages/dashboard/Attendance.tsx — table/filter changes
- client/src/pages/dashboard/Payroll.tsx — table and detail rendering
- client/src/pages/dashboard/Salaries.tsx — table rendering
- client/src/pages/dashboard/Employees.tsx — table rendering
- client/src/pages/dashboard/Hiring.tsx and related hiring pages — list/detail rendering

**Verification**
1. Run backend locally and hit key endpoints: hiring interview list, leaves balance list, attendance list, payroll list, search.
2. Run frontend and verify tables/filters render correctly for Leaves, Attendance, Payroll, Salaries, Hiring, Employees.
3. Check MongoDB explain plans for key list endpoints to confirm index usage; validate no unexpected $lookup or populate remains.

**Decisions**
- Scope is all models with moderate denormalization (embed only display + filter fields).
- No migration/backfill scripts needed since this is not deployed; use seed data or fresh DB after schema change.
- Change log file location: docs/db-denorm-changes.md.
