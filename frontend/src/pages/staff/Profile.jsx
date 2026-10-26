import ErrorMessage from '../../components/ui/ErrorMessage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  UserRound,
  Mail,
  BriefcaseBusiness,
  BadgeCheck,
  ShieldCheck,
  GraduationCap,
  Pencil,
  Save,
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import api, { getServerBaseUrl } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const Profile = () => {
  const { updateUser } = useAuth();
  const editingRef = useRef(false);
  const savingRef = useRef(false);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [failedPhoto, setFailedPhoto] = useState(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');

      const response = await api.get('/staff/profile');
      const data = response.data?.data;

      if (editingRef.current || savingRef.current) return;
      setProfile(data);

      setForm({
        first_name: data?.first_name || '',
        middle_name: data?.middle_name || '',
        last_name: data?.last_name || '',
        email: data?.user?.email || '',
      });
    } catch (err) {
      console.error('Failed to load staff profile:', err);

      setError(
        err.response?.data?.message ||
          'Unable to load your profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  useAutoRefresh(async () => {
    if (!editingRef.current && !savingRef.current) await fetchProfile(true);
  });

  useEffect(() => {
    queueMicrotask(() => {
      fetchProfile();
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setSuccess('');
    setError('');

    setForm({
      first_name: profile?.first_name || '',
      middle_name: profile?.middle_name || '',
      last_name: profile?.last_name || '',
      email: profile?.user?.email || '',
    });

    editingRef.current = true;
    setEditing(true);
  };

  const handleCancel = () => {
    if (savingRef.current) return;
    editingRef.current = false;
    setPhoto(null);
    setPreview(null);
    setEditing(false);
    setError('');
    setSuccess('');

    setForm({
      first_name: profile?.first_name || '',
      middle_name: profile?.middle_name || '',
      last_name: profile?.last_name || '',
      email: profile?.user?.email || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = { first_name: form.first_name.trim(), middle_name: form.middle_name.trim(), last_name: form.last_name.trim(), email: form.email.trim() };
      let response;
      if (photo) {
        const body = new FormData();
        body.append('_method', 'PUT');
        Object.entries(payload).forEach(([key, value]) => body.append(key, value));
        body.append('profile_photo', photo);
        response = await api.post('/staff/profile', body);
      } else {
        response = await api.put('/staff/profile', payload);
      }

      const updatedProfile = response.data?.data;

      setProfile(updatedProfile);
      updateUser({ name: updatedProfile.user.name, email: updatedProfile.user.email, profile_photo_url: updatedProfile.user.profile_photo ? `${getServerBaseUrl()}/storage/${updatedProfile.user.profile_photo}` : null });
      editingRef.current = false;
      setPhoto(null);
      setPreview(null);

      setForm({
        first_name: updatedProfile?.first_name || '',
        middle_name: updatedProfile?.middle_name || '',
        last_name: updatedProfile?.last_name || '',
        email: updatedProfile?.user?.email || '',
      });

      setEditing(false);
      setSuccess('Your profile has been updated successfully.');

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      console.error('Failed to update staff profile:', err);

      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)?.[0]?.[0];

        setError(
          firstError ||
            err.response?.data?.message ||
            'Please check the information you entered.'
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to update your profile. Please try again.'
        );
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const permissions = useMemo(() => {
    return profile?.permissions || {};
  }, [profile]);

  const permissionItems = [
    {
      key: 'manage_admissions',
      label: 'Manage Admissions',
      description: 'Review and process admission applications.',
    },
    {
      key: 'verify_documents',
      label: 'Verify Documents',
      description: 'Review and verify applicant documents.',
    },
    {
      key: 'manage_exams',
      label: 'Manage Entrance Exams',
      description: 'Manage examination schedules and assignments.',
    },
    {
      key: 'manage_scholarships',
      label: 'Manage Scholarships',
      description: 'Process scholarship applications.',
    },
    {
      key: 'manage_announcements',
      label: 'Manage Announcements',
      description: 'Create and manage portal announcements.',
    },
    {
      key: 'send_notifications',
      label: 'Send Notifications',
      description: 'Send notifications to applicants.',
    },
    {
      key: 'view_reports',
      label: 'View Reports',
      description: 'Access staff reporting information.',
    },
  ];

  const enabledPermissions = permissionItems.filter(
    (permission) => permissions[permission.key] === true
  );

  const assignedPrograms =
    profile?.academic_programs ||
    profile?.academicPrograms ||
    [];

  const fullName =
    [
      profile?.first_name,
      profile?.middle_name,
      profile?.last_name,
    ]
      .filter(Boolean)
      .join(' ') ||
    profile?.user?.name ||
    'Staff Member';

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="skeleton h-52 rounded-3xl" />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 skeleton h-96 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="ep-card rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={28} />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Profile unavailable
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {error || 'We could not load your staff profile.'}
        </p>

        <button
          type="button"
          onClick={fetchProfile}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 text-sm font-semibold text-white transition  hover:bg-[#0d2f4a]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Hero */}
      <section className="ep-page-banner ep-brand-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
              {(preview || profile.user?.profile_photo) && failedPhoto !== (preview || profile.user?.profile_photo) ? <img src={preview || `${getServerBaseUrl()}/storage/${profile.user.profile_photo}`} alt="Your profile" onError={() => setFailedPhoto(preview || profile.user?.profile_photo)} className="h-full w-full rounded-3xl object-cover" /> : <UserRound size={38} />}
            </div>

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/90 ring-1 ring-white/15">
                <BriefcaseBusiness size={13} />
                STAFF PROFILE
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {fullName}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/75">
                <span>{profile.position || 'Staff Member'}</span>
                <span>•</span>
                <span>{profile.department || 'Department'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                Employee ID
              </p>
              <p className="mt-1 font-bold">
                {profile.employee_id || '—'}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                Status
              </p>

              <div className="mt-1 flex items-center gap-2 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                {profile.status
                  ? profile.status.charAt(0).toUpperCase() +
                    profile.status.slice(1)
                  : 'Active'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold">Profile updated</p>
            <p className="mt-1 text-sm">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <ErrorMessage message={error}><div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div></ErrorMessage>
      )}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Personal Information */}
        <section className="ep-card overflow-hidden rounded-2xl lg:col-span-2">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-400/10 dark:text-blue-300">
                  <UserRound size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    Personal Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage your basic account information.
                  </p>
                </div>
              </div>
            </div>

            {!editing && (
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition  hover:border-[#123B5D] hover:text-[#123B5D] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6">
            {editing && <div className="mb-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <label htmlFor="staff-profile-photo" className="mb-2 block text-sm font-semibold">Profile picture</label>
              <input id="staff-profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
                  setError('Choose a JPG, PNG, or WEBP image up to 2 MB.');
                  event.target.value = '';
                  return;
                }
                setError(''); setPhoto(file); setPreview(URL.createObjectURL(file));
              }} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#123B5D] file:px-4 file:py-2 file:text-white" />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">JPG, PNG, or WEBP, up to 2 MB. Save Changes to upload your picture.</p>
            </div>}
            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  First Name
                </label>

                {editing ? (
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 dark:bg-slate-800/70 dark:text-slate-200">
                    {profile.first_name || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Middle Name
                </label>

                {editing ? (
                  <input
                    type="text"
                    name="middle_name"
                    value={form.middle_name}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 dark:bg-slate-800/70 dark:text-slate-200">
                    {profile.middle_name || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Last Name
                </label>

                {editing ? (
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 dark:bg-slate-800/70 dark:text-slate-200">
                    {profile.last_name || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Email Address
                </label>

                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    maxLength={255}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 dark:bg-slate-800/70 dark:text-slate-200">
                    <Mail size={16} className="text-slate-400" />
                    <span className="truncate">
                      {profile.user?.email || '—'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {editing && (
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <X size={17} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition  hover:bg-[#0d2f4a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </section>

        {/* Account Summary */}
        <section className="ep-card overflow-hidden rounded-2xl">
          <div className="border-b border-slate-200 p-5 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300">
                <BadgeCheck size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Account Summary
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your staff account details.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Role
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                Staff
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Employee ID
              </span>
              <span className="text-right text-sm font-bold text-slate-800 dark:text-slate-200">
                {profile.employee_id || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Department
              </span>
              <span className="text-right text-sm font-bold text-slate-800 dark:text-slate-200">
                {profile.department || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Position
              </span>
              <span className="text-right text-sm font-bold text-slate-800 dark:text-slate-200">
                {profile.position || '—'}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <ShieldCheck size={17} className="text-teal-600 dark:text-teal-400" />
                {enabledPermissions.length} active permissions
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Assigned Programs */}
      <section className="ep-card overflow-hidden rounded-2xl">
        <div className="border-b border-slate-200 p-5 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <GraduationCap size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Assigned Academic Programs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Programs currently assigned to your staff account.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {assignedPrograms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <GraduationCap
                size={28}
                className="mx-auto text-slate-400"
              />

              <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                No programs assigned
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Contact an administrator if you need a program assignment.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assignedPrograms.map((program) => (
                <div
                  key={program.id}
                  className="ep-hover-lift rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-400/10 dark:text-blue-300">
                      <GraduationCap size={22} />
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        program.is_active
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {program.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
                    {program.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-[#123B5D] dark:text-blue-300">
                    {program.code}
                  </p>

                  {program.description && (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {program.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Permissions */}
      <section className="ep-card overflow-hidden rounded-2xl">
        <div className="border-b border-slate-200 p-5 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Staff Permissions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access permissions assigned by an administrator.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {permissionItems.map((permission) => {
            const enabled = permissions[permission.key] === true;

            return (
              <div
                key={permission.key}
                className={`rounded-2xl border p-4 transition ${
                  enabled
                    ? 'border-teal-200 bg-teal-50/70 dark:border-teal-900/50 dark:bg-teal-950/20'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      enabled
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {enabled ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <X size={18} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {permission.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {permission.description}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        enabled
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security Notice */}
      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <KeyRound
            size={20}
            className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300"
          />

          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-200">
              Account security
            </h3>

            <p className="mt-1 text-sm leading-6 text-blue-800/80 dark:text-blue-300/80">
              Your role, permissions, employee ID, department, position, and
              assigned programs are managed by an administrator. If any of
              these details need to be changed, contact your administrator.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;