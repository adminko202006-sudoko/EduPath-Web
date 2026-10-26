import { addressInputClass } from './SearchableLocation';

import { studentTypes } from '../../services/studentTypes';

export default function StudentIdentityFields({ value, onChange, disabled = false, lockedLrn = false }) {
  const change = (event) => onChange({ ...value, [event.target.name]: event.target.value });
  return <fieldset disabled={disabled} className="min-w-0 space-y-4">
    <legend className="mb-3 text-lg font-bold text-[#123B5D] dark:text-white">Student identity</legend>
    <label className="block text-sm font-semibold">Student type *
      <select name="student_type" required value={value.student_type || ''} className={`${addressInputClass} mt-2`} onChange={(event) => onChange({ ...value, student_type: event.target.value, tmc_student_number: '', previous_school: event.target.value === 'old' ? 'Trinidad Municipal College' : '' })}>
        <option value="">Select student type</option>{Object.entries(studentTypes).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select>
    </label>
    <p className="text-sm text-slate-600 dark:text-slate-300">{value.student_type === 'old'
      ? 'Your administrator will confirm your existing TMC program from college records. You will use that program for scholarships without selecting a new program.'
      : value.student_type === 'transferee'
        ? 'Provide the ID from your previous college. After verification, choose your intended TMC program through admission. The college will review your transfer documents separately.'
        : 'Provide your school ID and LRN. After verification, choose a program through admission and apply for scholarships when eligible.'}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold">Learner Reference Number (LRN) *<input name="lrn" required inputMode="numeric" pattern="[0-9]{12}" maxLength={12} readOnly={lockedLrn} value={value.lrn || ''} onChange={change} className={`${addressInputClass} mt-2`} /><span className="mt-1 block text-xs font-normal">Your 12-digit LRN. One account per student. {lockedLrn && 'Contact the college to correct your LRN.'}</span></label>
      {value.student_type === 'old' && <label className="block text-sm font-semibold">TMC student number *<input name="tmc_student_number" required maxLength={50} value={value.tmc_student_number || ''} onChange={change} className={`${addressInputClass} mt-2`} /></label>}
      <label className="block text-sm font-semibold">{value.student_type === 'transferee' ? 'Previous college / university' : value.student_type === 'old' ? 'School' : 'School issuing your ID'} *<input name="previous_school" required maxLength={255} value={value.previous_school || ''} readOnly={value.student_type === 'old'} onChange={change} className={`${addressInputClass} mt-2`} /></label>
      <label className="block text-sm font-semibold">School-ID image *<input name="school_id" type="file" required accept="image/jpeg,image/png,image/webp" className={`${addressInputClass} mt-2`} onChange={(event) => {
        const file = event.target.files?.[0] || null;
        event.target.setCustomValidity(file && file.size > 5 * 1024 * 1024 ? 'Use an image no larger than 5 MB.' : '');
        onChange({ ...value, school_id: file });
      }} /><span className="mt-1 block text-xs font-normal">A readable JPG, PNG or WebP, up to 5 MB. Only you and authorized administrators can access this file.</span></label>
    </div>
    <p className="text-xs text-slate-600 dark:text-slate-300">Use your existing account if you have registered before. An administrator checks your school identity against official records; an uploaded image alone does not approve your account.</p>
  </fieldset>;
}
