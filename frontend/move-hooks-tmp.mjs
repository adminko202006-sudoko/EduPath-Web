/* One-shot: move each `useAutoRefresh(...)` block to after its fetcher
   declarations so react-hooks (compiler) sees declaration-before-access. */
import fs from 'fs';

const TARGETS = [
  ['src/pages/admin/AdmissionApplicationDetails.jsx', ['loadApplication']],
  ['src/pages/admin/AdmissionApplications.jsx', ['loadApplications']],
  ['src/pages/admin/Announcements.jsx', ['loadAnnouncements']],
  ['src/pages/admin/ApplicantDetails.jsx', ['loadApplicant']],
  ['src/pages/admin/Applicants.jsx', ['loadApplicants', 'loadPrograms']],
  ['src/pages/admin/ArchivedApplicants.jsx', ['loadArchivedApplicants']],
  ['src/pages/admin/Dashboard.jsx', ['loadDashboard']],
  ['src/pages/admin/Documents.jsx', ['loadDocuments']],
  ['src/pages/admin/EntranceExams.jsx', ['loadExams']],
  ['src/pages/admin/Profile.jsx', ['loadProfile']],
  ['src/pages/admin/Programs.jsx', ['fetchPrograms']],
  ['src/pages/admin/Requirements.jsx', ['loadRequirements', 'loadPrograms']],
  ['src/pages/admin/ScholarshipApplications.jsx', ['fetchApplications']],
  ['src/pages/admin/Scholarships.jsx', ['loadScholarships']],
  ['src/pages/admin/StaffManagement.jsx', ['fetchStaff', 'fetchPrograms']],
  ['src/pages/applicant/AdmissionApplication.jsx', ['loadApplication', 'loadPrograms', 'loadCurrentAdmissionPeriod']],
  ['src/pages/applicant/Announcements.jsx', ['loadAnnouncements']],
  ['src/pages/applicant/Dashboard.jsx', ['fetchDashboardData']],
  ['src/pages/applicant/Documents.jsx', ['loadAdmissionApplication', 'loadDocuments', 'loadRequirements']],
  ['src/pages/applicant/EntranceExam.jsx', ['loadExams']],
  ['src/pages/applicant/Notifications.jsx', ['loadNotifications']],
  ['src/pages/applicant/Programs.jsx', ['loadPrograms']],
  ['src/pages/applicant/ScholarshipApplication.jsx', ['loadApplications']],
  ['src/pages/staff/AdmissionApplications.jsx', ['fetchApplications']],
  ['src/pages/staff/Announcements.jsx', ['fetchAnnouncements']],
  ['src/pages/staff/Dashboard.jsx', ['fetchDashboard']],
  ['src/pages/staff/Documents.jsx', ['fetchDocuments']],
  ['src/pages/staff/EntranceExams.jsx', ['fetchExams']],
  ['src/pages/staff/Exams.jsx', ['loadExams']],
  ['src/pages/staff/Notifications.jsx', ['fetchNotifications']],
  ['src/pages/staff/Profile.jsx', ['fetchProfile']],
  ['src/pages/staff/Reports.jsx', ['fetchReports']],
  ['src/pages/staff/ScholarshipApplications.jsx', ['loadApplications']],
];

const stripStrings = (line) =>
  line
    .replace(/'[^']*'/g, "''")
    .replace(/"[^"]*"/g, '""')
    .replace(/`[^`]*`/g, '``');

let failures = 0;

for (const [file, names] of TARGETS) {
  const raw = fs.readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);

  // 1. Locate the useAutoRefresh block.
  const start = lines.findIndex((l) => /^  useAutoRefresh\(/.test(l));
  if (start === -1) {
    console.log(`SKIP ${file}: hook block not found`);
    failures++;
    continue;
  }
  let end = -1;
  for (let i = start; i < lines.length; i++) {    if (/^ {2}\}\);$/ .test(lines[i]) || /^ {2}\);$/ .test(lines[i])) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    console.log(`SKIP ${file}: hook block end not found`);
    failures++;
    continue;
  }
  const block = lines.slice(start, end + 1);
  let afterBlock = end + 1;
  if (lines[afterBlock] === '') afterBlock++;

  // 2. Find each referenced fetcher declaration and its closing line.
  let insertAt = -1;
  let allOk = true;
  for (const name of names) {
    const decl = lines.findIndex((l) =>
      new RegExp(`^  const ${name} = `).test(l)
    );
    if (decl === -1) {
      console.log(`SKIP ${file}: decl for ${name} not found`);
      failures++;
      allOk = false;
      break;
    }
    let bal = 0;
    let close = -1;
    for (let i = decl; i < lines.length; i++) {
      const clean = stripStrings(lines[i]);
      for (const ch of clean) {
        if (ch === '{' || ch === '(') bal++;
        else if (ch === '}' || ch === ')') bal--;
      }
      if (bal === 0 && i > decl) {
        close = i;
        break;
      }
    }
    if (close === -1) {
      console.log(`SKIP ${file}: close for ${name} not found`);
      failures++;
      allOk = false;
      break;
    }
    insertAt = Math.max(insertAt, close);
  }
  if (!allOk || insertAt === -1 || insertAt < start) {
    continue;
  }

  // 3. Remove the block, then re-insert it after the last fetcher close.
  lines.splice(start, afterBlock - start);

  // Adjust insertAt for removal if the block sat before it (it always does).
  const removed = afterBlock - start;
  let target = insertAt - removed;
  if (insertAt < start) target = insertAt; // block was after target (unexpected)

  const insertLines = [];
  // Keep exactly one blank line before the block.
  if (lines[target + 1] !== '') insertLines.push('');
  insertLines.push(...block);

  lines.splice(target + 1, 0, ...insertLines);

  fs.writeFileSync(file, lines.join(eol), 'utf8');
  console.log(
    `OK   ${file}: moved after line ${target + 1} -> "${lines[target + 2] || ''}"`
  );
}

console.log(failures ? `FAILURES: ${failures}` : 'ALL MOVED');
