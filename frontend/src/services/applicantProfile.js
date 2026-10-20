import { parseExamDate } from './examSchedule.js';

export function formatProfileBirthDate(value) {
  const date = parseExamDate(value);
  return date ? date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not provided';
}

// Matches the required, non-secret applicant details in AuthController::register.
export const requiredProfileFields = [
  ['first_name', 'First name'], ['last_name', 'Last name'],
  ['birth_date', 'Date of birth'], ['gender', 'Gender'],
  ['phone', 'Mobile number'], ['address', 'Address'], ['email', 'Email address'],
];

export const educationFields = [
  ['primary_school', 'Primary school', 255],
  ['primary_school_year', 'Primary school graduation year', 4],
  ['junior_high_school', 'Junior high school', 255],
  ['senior_high_school', 'Senior high school', 255],
  ['shs_strand', 'SHS strand', 100],
  ['lrn', 'Learner Reference Number (LRN)', 12],
  ['previous_college_university', 'Previous college / university', 255],
];

export function normalizeProfile(data) {
  const applicant = data?.applicant ?? {};
  const fields = ['first_name', 'middle_name', 'last_name', 'gender', 'phone', 'address', ...educationFields.map(([key]) => key)];
  return {
    ...Object.fromEntries(fields.map(key => [key, applicant[key] == null ? '' : String(applicant[key])])),
    birth_date: String(applicant.birth_date ?? '').slice(0, 10),
    email: data?.user?.email ?? '',
    profilePhoto: data?.profile_photo_url ?? null,
  };
}

export function profileCompletion(profile) {
  const missing = requiredProfileFields.filter(([key]) => !String(profile?.[key] ?? '').trim());
  const completed = requiredProfileFields.length - missing.length;
  return { missing, completed, total: requiredProfileFields.length, percent: Math.round(completed / requiredProfileFields.length * 100) };
}
