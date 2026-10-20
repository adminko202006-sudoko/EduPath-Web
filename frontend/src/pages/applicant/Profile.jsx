import { useEffect, useRef, useState } from 'react';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { Camera, UserRound, Upload, Mail, Save, CheckCircle2, GraduationCap, Phone, Pencil, ChevronRight, Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { educationFields, normalizeProfile, profileCompletion, formatProfileBirthDate } from '../../services/applicantProfile';
import './profile.css';

const personalFields = [['first_name', 'First name'], ['middle_name', 'Middle name'], ['last_name', 'Last name'], ['birth_date', 'Date of birth'], ['gender', 'Gender']];
const contactFields = [['phone', 'Mobile number'], ['address', 'Complete address']];
const emptyProfile = normalizeProfile(null);
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:opacity-60 dark:border-slate-600 dark:bg-[#0b1c2a] dark:text-slate-100';

function ProfileCard({ title, icon: Icon, children, hint }) {
  return <section className="ep-card rounded-2xl p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
      <Icon size={21} className="shrink-0 text-[#123B5D] dark:text-teal-300" />
      <h2 className="text-base font-bold text-[#123B5D] dark:text-white sm:text-lg">{title}</h2>
    </div>
    {hint && <p className="mb-4 text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p>}
    {children}
  </section>;
}

function ProfileField({ field, value, editing, onChange, disabled }) {
  const [key, label, max = 255] = field;
  const id = `profile-${key}`;
  const type = key === 'birth_date' ? 'date' : key === 'phone' ? 'tel' : 'text';
  return <div className={(key === 'address' && editing) || key === 'previous_college_university' ? 'sm:col-span-2' : ''}>
    <label htmlFor={editing ? id : undefined} className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}{editing && ['first_name', 'last_name'].includes(key) && ' *'}</label>
    {!editing ? <p className="break-words text-sm font-medium leading-6 text-slate-800 dark:text-slate-100">{key === 'birth_date' ? formatProfileBirthDate(value) : value || 'Not provided'}</p>
      : key === 'gender' ? <select id={id} name={key} value={value} onChange={onChange} disabled={disabled} className={inputClass}><option value="">Select gender</option>{['Male', 'Female', 'Other'].map(item => <option key={item}>{item}</option>)}</select>
      : key === 'address' ? <textarea id={id} name={key} value={value} onChange={onChange} maxLength={500} rows={3} disabled={disabled} className={inputClass} />
      : <input id={id} name={key} type={type} value={value} onChange={onChange} required={['first_name', 'last_name'].includes(key)} maxLength={key === 'phone' ? 30 : max} pattern={key === 'lrn' ? '[0-9]{12}' : key === 'primary_school_year' ? '[0-9]{4}' : undefined} inputMode={['lrn', 'primary_school_year'].includes(key) ? 'numeric' : undefined} disabled={disabled} className={inputClass} />}
  </div>;
}

export default function Profile() {
  const { token, user, updateUser } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [saved, setSaved] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [failedPhoto, setFailedPhoto] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const dirtyRef = useRef(false);
  const mutationRef = useRef(false);
  const loadSequence = useRef(0);
  const fileInputRef = useRef(null);
  const editButtonRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}` };
  const busy = saving || uploadingPhoto;

  useAutoRefresh(() => { if (!dirtyRef.current && !mutationRef.current && !editing) setReloadKey(key => key + 1); });
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);
  useEffect(() => {
    let active = true;
    const sequence = ++loadSequence.current;
    if (!token) return;
    api.get('/applicant/profile', { headers: { Authorization: `Bearer ${token}` } }).then(response => {
      if (!active || sequence !== loadSequence.current || dirtyRef.current || mutationRef.current) return;
      if (response.data?.success !== true || !response.data?.data?.applicant || !response.data?.data?.user) throw new Error('Invalid profile response');
      const next = normalizeProfile(response.data.data);
      setProfile(next); setSaved(next);
    }).catch(() => {
      if (active && sequence === loadSequence.current && !dirtyRef.current && !mutationRef.current) setFeedback({ error: true, text: 'Unable to load your latest profile. Please try Refresh.' });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, reloadKey]);

  function editProfile(key = 'first_name') {
    setEditing(true);
    requestAnimationFrame(() => {
      const input = document.getElementById(`profile-${key}`);
      input?.focus({ preventScroll: true });
      input?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    });
  }
  function cancelPhoto() {
    setSelectedPhoto(null); setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
  function cancelEdit() {
    setProfile(saved); dirtyRef.current = false; cancelPhoto(); setEditing(false); setFeedback(null);
    requestAnimationFrame(() => editButtonRef.current?.focus());
  }
  function handleChange(event) {
    dirtyRef.current = true;
    setProfile(current => ({ ...current, [event.target.name]: event.target.value }));
    setFeedback(null);
  }
  function selectPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedback({ error: true, text: 'Choose a JPG, PNG, or WEBP image no larger than 2 MB.' });
      event.target.value = ''; return;
    }
    setSelectedPhoto(file); setPhotoPreview(URL.createObjectURL(file)); setFeedback(null);
  }
  async function uploadPhoto() {
    if (!selectedPhoto || mutationRef.current) return;
    mutationRef.current = true; loadSequence.current++; setUploadingPhoto(true); setFeedback(null);
    try {
      const body = new FormData(); body.append('profile_photo', selectedPhoto);
      const response = await api.post('/applicant/profile', body, { headers });
      const data = response.data?.data;
      if (response.data?.success !== true || !data?.profile_photo_url) throw new Error('Upload not confirmed');
      setProfile(current => ({ ...current, profilePhoto: data.profile_photo_url }));
      setSaved(current => ({ ...current, profilePhoto: data.profile_photo_url }));
      updateUser({ profile_photo_url: data.profile_photo_url }); cancelPhoto();
      setFeedback({ text: 'Profile picture updated successfully.' });
    } catch (error) {
      setFeedback({ error: true, text: error.response?.status === 422 ? (Object.values(error.response.data.errors ?? {})[0]?.[0] || 'Please check your image.') : 'Unable to upload your picture. Please try again.' });
    } finally { mutationRef.current = false; setUploadingPhoto(false); }
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (mutationRef.current) return;
    mutationRef.current = true; loadSequence.current++; setSaving(true); setFeedback(null);
    try {
      const body = Object.fromEntries([...personalFields, ...contactFields, ...educationFields].map(([key]) => [key, profile[key]]));
      const response = await api.put('/applicant/profile', body, { headers });
      const data = response.data?.data;
      if (response.data?.success !== true || !data?.applicant || !data?.user) throw new Error('Save not confirmed');
      const next = normalizeProfile(data);
      setProfile(next); setSaved(next); dirtyRef.current = false; setEditing(Boolean(selectedPhoto));
      updateUser({ name: data.user.name, applicant: data.applicant, profile_photo_url: data.profile_photo_url });
      setFeedback({ text: selectedPhoto ? 'Profile details saved. Upload your selected picture separately.' : 'Profile updated successfully.' });
      requestAnimationFrame(() => editButtonRef.current?.focus());
    } catch (error) {
      setFeedback({ error: true, text: error.response?.status === 422 ? (Object.values(error.response.data.errors ?? {})[0]?.[0] || 'Please check the information you entered.') : 'Unable to save your profile. Your changes are still available; please try again.' });
    } finally { mutationRef.current = false; setSaving(false); }
  }

  if (loading) return <div aria-busy="true" aria-label="Loading profile" className="mx-auto max-w-6xl space-y-6">
    <div className="ep-card overflow-hidden rounded-2xl"><div className="ep-page-banner h-36" /><div className="animate-pulse space-y-3 p-6"><div className="ep-skeleton h-8 w-48" /><div className="ep-skeleton h-4 w-64 max-w-full" /></div></div>
    {[1, 2, 3].map(item => <div key={item} className="ep-card space-y-4 p-6"><div className="ep-skeleton h-5 w-44" /><div className="ep-skeleton h-14 w-full" /></div>)}
    <p className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-300"><Loader2 size={18} className="animate-spin" />Loading your profile...</p>
  </div>;

  const fullName = [saved.first_name, saved.middle_name, saved.last_name].filter(Boolean).join(' ') || user?.name || 'Applicant';
  const photo = photoPreview || profile.profilePhoto;
  const completion = profileCompletion(saved);
  const loaded = Boolean(saved.email);
  return <div className="ep-profile mx-auto max-w-6xl space-y-5 pb-8 page-transition">
    <section className="ep-card overflow-hidden rounded-2xl shadow-sm">
      <div className="ep-page-banner ep-profile-cover flex items-start px-6 py-6 sm:px-8">
        <div><p className="text-xs font-semibold uppercase tracking-[.18em]">EduPath Applicant Portal</p><h1 data-tutorial-target="applicant-profile-intro" className="mt-2 text-xl font-bold sm:text-2xl">Trinidad Municipal College</h1><p className="mt-1 text-xs">My Profile</p></div>
      </div>
      <div className="ep-profile-identity px-5 pb-6 sm:px-8">
        <div className="ep-profile-avatar border-[5px] border-white bg-slate-100 shadow-md dark:border-[#102333] dark:bg-slate-800">
          {photo && failedPhoto !== photo ? <img src={photo} alt={`${fullName}'s profile`} onError={() => setFailedPhoto(photo)} className="h-full w-full rounded-full object-cover" /> : <span aria-label="Profile initials" className="text-4xl font-bold text-[#123B5D] dark:text-sky-200">{fullName.trim().charAt(0).toUpperCase()}</span>}
          {editing && <button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} aria-label="Choose profile picture" className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#123B5D] p-2 text-white shadow-sm disabled:opacity-50"><Camera size={17} /></button>}
        </div>
        <div className="min-w-0 flex-1 sm:pt-3 sm:pb-1"><div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start"><h2 className="break-words text-2xl font-extrabold text-[#123B5D] dark:text-white">{fullName}</h2><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-900/50 dark:text-teal-200">Applicant</span></div><p className="mt-2 flex items-center justify-center gap-2 break-all text-sm text-slate-500 dark:text-slate-300 sm:justify-start"><Mail size={16} className="shrink-0" />{saved.email || 'Email unavailable'}</p></div>
        {!editing && <button ref={editButtonRef} type="button" disabled={!loaded} onClick={() => editProfile()} className="ep-profile-edit"><Pencil size={17} />Edit Profile</button>}
      </div>
    </section>
    {feedback?.error && <ErrorMessage message={feedback.text}><p>{feedback.text}</p>{!editing && <button type="button" onClick={() => setReloadKey(key => key + 1)} className="mt-3 font-bold underline">Refresh</button>}</ErrorMessage>}
    {feedback && !feedback.error && <div role="status" className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200">
      <CheckCircle2 size={19} className="shrink-0" /><span className="flex-1">{feedback.text}</span>
    </div>}
    <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="ep-card rounded-2xl p-5 shadow-sm lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-[#123B5D] dark:text-white">Profile completion</h2><span className="text-lg font-bold text-[#123B5D] dark:text-white lg:hidden">{completion.percent}%</span></div>
        <div className="ep-profile-ring mx-auto my-6 hidden lg:grid" style={{ '--completion': `${completion.percent}%` }} aria-hidden="true"><span>{completion.percent}%</span></div>
        <div role="progressbar" aria-label="Required profile details completed" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${completion.completed} of ${completion.total} required details complete`} className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full rounded-full bg-teal-500 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${completion.percent}%` }} /></div>
        <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">{completion.percent === 100 ? 'Required details complete' : 'A few details to go'}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{completion.completed} of {completion.total} required registration details saved. Education and profile photo are optional.</p>
        {completion.missing.length > 0 && loaded && <button type="button" onClick={() => editProfile(completion.missing[0][0])} className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl bg-teal-50 p-3 text-left text-xs font-semibold text-teal-800 dark:bg-teal-900/40 dark:text-teal-100">Add {completion.missing[0][1].toLowerCase()}<ChevronRight size={16} /></button>}
        {editing && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Completion updates after saving.</p>}
      </aside>
      <form onSubmit={handleSubmit} className="min-w-0 space-y-5">
        {editing && <section className="ep-card space-y-4 rounded-2xl p-5"><div className="flex items-center gap-2 text-sm font-bold text-[#123B5D] dark:text-white"><Camera size={19} />Profile picture</div><p className="break-all text-xs text-slate-500 dark:text-slate-400">{selectedPhoto?.name || 'JPG, PNG, or WEBP · Maximum 2 MB'}</p><div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} className="ep-profile-secondary"><Camera size={16} />Choose picture</button>{selectedPhoto && <><button type="button" disabled={busy} onClick={uploadPhoto} className="ep-profile-secondary"><Upload size={16} />{uploadingPhoto ? 'Uploading...' : 'Upload picture'}</button><button type="button" disabled={busy} onClick={cancelPhoto} className="ep-profile-secondary"><X size={16} />Cancel picture</button></>}</div></section>}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="hidden" aria-label="Profile picture file" />
        <ProfileCard title="Personal Information" icon={UserRound}><div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{(editing ? personalFields : [['full_name', 'Full name'], ['birth_date', 'Date of birth'], ['gender', 'Gender']]).map(field => <ProfileField key={field[0]} field={field} value={field[0] === 'full_name' ? fullName : profile[field[0]]} editing={editing} onChange={handleChange} disabled={busy} />)}</div></ProfileCard>
        <ProfileCard title="Contact & Address" icon={Phone}><div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{editing && <div className="sm:col-span-2"><p className="text-xs text-slate-500 dark:text-slate-400">Email address</p><p className="mt-1 break-all text-sm font-medium text-slate-800 dark:text-slate-100">{saved.email || 'Not provided'}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your email address cannot be changed here.</p></div>}{contactFields.map(field => <ProfileField key={field[0]} field={field} value={profile[field[0]]} editing={editing} onChange={handleChange} disabled={busy} />)}</div></ProfileCard>
        <ProfileCard title="Educational Background" icon={GraduationCap} hint="Optional education details for your applicant record."><div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{educationFields.map(field => <ProfileField key={field[0]} field={field} value={profile[field[0]]} editing={editing} onChange={handleChange} disabled={busy} />)}</div></ProfileCard>
        {editing && <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={cancelEdit} className="ep-profile-secondary">Cancel</button><button type="submit" disabled={busy} className="ep-profile-edit">{saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}{saving ? 'Saving...' : 'Save changes'}</button></div>}
      </form>
    </div>
  </div>;
}
