import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Save,
  X,
  Loader2,
  AlertCircle,
  BriefcaseBusiness,
  GraduationCap,
  Camera,
  Upload,
  LockKeyhole,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import api, { getServerBaseUrl } from "../../services/api";
import { resolveAccountPhoto } from '../../services/profilePhoto';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import './profile.css';

const Profile = () => {
  const { user, token, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [failedPhoto, setFailedPhoto] = useState(null);
  const savedPhotoUrl = resolveAccountPhoto(profile, getServerBaseUrl());
  const displayedPhotoUrl = photoPreview || savedPhotoUrl;
  const [photoSaving, setPhotoSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const loadProfile = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError("");

      const response = await api.get("/admin/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data?.data || response.data;

      setProfile(data);
      updateUser?.(data);

      setForm({
        name: data?.name || "",
        email: data?.email || "",
      });
    } catch (err) {
      console.error("Failed to load profile:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your profile information."
      );
    } finally {
      setLoading(false);
    }
  }, [token, updateUser]);
  useAutoRefresh(() => {
    loadProfile(true);
  });

  useEffect(() => {
    queueMicrotask(() => {
      loadProfile();
    });
  }, [loadProfile]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setSuccess("");
    setError("");

    setForm({
      name: profile?.name || "",
      email: profile?.email || "",
    });

    setEditing(true);
  };

  const handleCancel = () => {
    setForm({
      name: profile?.name || "",
      email: profile?.email || "",
    });

    setEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        "/admin/profile",
        {
          name: form.name.trim(),
          email: form.email.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedProfile =
        response.data?.data || response.data?.user || response.data;

      setProfile((prev) => ({
        ...prev,
        ...updatedProfile,
      }));
      updateUser?.(updatedProfile);

      setForm({
        name: updatedProfile?.name || form.name.trim(),
        email: updatedProfile?.email || form.email.trim(),
      });

      setEditing(false);
      setSuccess("Your profile has been updated successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      console.error("Failed to update profile:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          err.response?.data?.errors?.name?.[0] ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('The profile photo must be 2 MB or smaller.');
      event.target.value = '';
      return;
    }
    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || photoSaving) return;
    const payload = new FormData();
    payload.append('profile_photo', photoFile);
    try {
      setPhotoSaving(true);
      setError('');
      const response = await api.post('/admin/profile', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = response.data?.data || response.data;
      setProfile(updated);
      updateUser?.(updated);
      setPhotoFile(null);
      setPhotoPreview('');
      setSuccess('Profile photo updated successfully.');
    } catch (err) {
      setError(err.response?.data?.errors?.profile_photo?.[0] || err.response?.data?.message || 'Unable to upload the profile photo.');
    } finally {
      setPhotoSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwordForm.next.length < 8) {
      setPasswordError('Your new password must be at least 8 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('The new password and confirmation do not match.');
      return;
    }
    try {
      setPasswordSaving(true);
      const response = await api.put('/auth/change-password', {
        current_password: passwordForm.current,
        new_password: passwordForm.next,
        new_password_confirmation: passwordForm.confirm,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPasswordMessage(response.data?.message || 'Password updated successfully.');
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.errors?.current_password?.[0] || err.response?.data?.errors?.new_password?.[0] || err.response?.data?.message || 'Unable to change your password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "A";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleLabel = () => {
    if (profile?.role === "admin") {
      return "Administrator";
    }

    return profile?.role
      ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
      : "Administrator";
  };

  const getStatusLabel = () => {
    if (profile?.status) {
      return profile.status.charAt(0).toUpperCase() + profile.status.slice(1);
    }

    return "Active";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fa] dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero skeleton */}
          <div className="rounded-2xl bg-gray-200 dark:bg-slate-800 h-56 animate-pulse" />

          {/* Profile skeleton */}
          <div className="ep-card bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden animate-pulse">
            <div className="h-28 bg-gray-100 dark:bg-slate-800" />

            <div className="px-6 pb-6">
              <div className="-mt-12 flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gray-200 dark:bg-slate-700 border-4 border-white dark:border-slate-900" />

                <div className="pb-2 space-y-2">
                  <div className="h-5 w-48 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Content skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ep-card bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-5">
              <div className="h-6 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>

            <div className="ep-card bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-5">
              <div className="h-6 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500 dark:text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            Loading administrator profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ep-admin-profile min-h-screen bg-[#f4f7fa] dark:bg-slate-950 page-transition">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* =========================================================
            ALERTS
        ========================================================= */}
        {error && (
          <ErrorMessage message={error}><div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />

            <div>
              <p className="font-semibold text-sm">Something went wrong</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Close error message"
              className="ml-auto p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition"
            >
              <X size={17} />
            </button>
          </div></ErrorMessage>
        )}

        {success && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />

            <div>
              <p className="font-semibold text-sm">Success</p>
              <p className="text-sm mt-0.5">{success}</p>
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Close success message"
              className="ml-auto p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* =========================================================
            PROFILE CARD
        ========================================================= */}
        <div className="ep-card ep-hover-lift bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden animate-fade-up">
          {/* Profile banner */}
          <div className="ep-admin-profile-cover ep-page-banner relative overflow-hidden">
            <div className="relative px-6 pt-6 pb-14 sm:px-8">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-white/90"><ShieldCheck size={15} /> Administration</span>
              <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">Admin Profile</h1>
              <p className="mt-1 max-w-lg text-sm text-white/90">Manage your administrator account information and profile details.</p>
            </div>
          </div>

          <div className="relative px-6 sm:px-8 pb-7">
            {/* Avatar */}
            <div className="ep-admin-profile-identity -mt-12 flex flex-wrap items-end gap-4">
              <div className="ep-admin-profile-person flex min-w-0 flex-1 items-end gap-4">
                <div className="ep-admin-profile-avatar w-28 h-28 shrink-0 overflow-hidden rounded-full bg-[#123B5D] dark:bg-slate-700 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center">
                  {displayedPhotoUrl && failedPhoto !== displayedPhotoUrl ? (
                    <img src={displayedPhotoUrl} onError={() => setFailedPhoto(displayedPhotoUrl)} alt="Administrator profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-extrabold text-white">{getInitials(profile?.name || user?.name)}</span>
                  )}
                </div>

                <div className="ep-admin-profile-name min-w-0 pb-1">
                  <h2 className="break-words text-xl sm:text-2xl font-extrabold text-[#123B5D] dark:text-white">
                    {profile?.name || user?.name || "Administrator"}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                      <ShieldCheck size={13} />
                      {getRoleLabel()}
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-semibold">
                      <CheckCircle2 size={13} />
                      {getStatusLabel()}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Mail size={15} className="shrink-0" /><span className="break-all">{profile?.email || user?.email}</span></p>
                </div>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="ep-admin-profile-edit inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition"
                >
                  <Pencil size={17} />
                  Edit Profile
                </button>
              )}

              <div className="ep-admin-profile-photo-tools flex w-full flex-wrap items-center gap-2">
                {displayedPhotoUrl && failedPhoto === displayedPhotoUrl && <p role="alert" className="w-full text-sm text-red-700 dark:text-red-300">The profile photo could not be loaded. Choose a photo and save it to try again.</p>}
                <label htmlFor="admin-profile-photo" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Camera size={16} /> Choose photo
                </label>
                <input id="admin-profile-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="sr-only" />
                {photoFile && <button type="button" onClick={handlePhotoUpload} disabled={photoSaving} className="inline-flex items-center gap-2 rounded-lg bg-[#123B5D] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {photoSaving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{photoSaving ? 'Uploading…' : 'Save photo'}
                </button>}
                <span className="text-xs text-gray-500 dark:text-slate-400">JPG, PNG or WebP · max 2 MB</span>
              </div>

              {editing && (
                <div className="flex items-center gap-2 pb-1">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold text-sm transition disabled:opacity-50"
                  >
                    <X size={16} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="profile-form"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0e2f4a] text-white font-semibold text-sm transition disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* =========================================================
            MAIN CONTENT
        ========================================================= */}
        <div className="ep-admin-profile-details grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Personal Information */}
          <div className="ep-card ep-hover-lift bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden animate-fade-up">
            <div className="relative overflow-hidden ep-brand-gradient">
              <div className="absolute -top-12 -right-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

              <div className="relative px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <User size={19} className="text-white" />
                  </div>

                  <div>
                    <h2 className="font-bold text-white">
                      Personal Information
                    </h2>

                    <p className="text-xs text-blue-100 mt-0.5">
                      Your basic administrator account information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form
              id="profile-form"
              onSubmit={handleSave}
              className="p-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  Full Name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                  />

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-70 transition"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                  />

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-70 transition"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                  />

                  <input
                    type="text"
                    value={profile?.phone || "Not provided"}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800/70 text-gray-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>

                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                  Phone number editing can be added when the backend profile
                  field is available.
                </p>
              </div>
            </form>
          </div>

          {/* Account Information */}
          <div className="ep-card ep-hover-lift bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden animate-fade-up">
            <div className="relative overflow-hidden ep-brand-gradient">
              <div className="absolute -top-12 -right-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

              <div className="relative px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <ShieldCheck size={19} className="text-white" />
                  </div>

                  <div>
                    <h2 className="font-bold text-white">
                      Account Information
                    </h2>

                    <p className="text-xs text-blue-100 mt-0.5">
                      Details about your EduPath administrator account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Role */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <ShieldCheck
                    size={19}
                    className="text-blue-700 dark:text-blue-400"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Account Role
                  </p>

                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 mt-0.5">
                    {getRoleLabel()}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2
                    size={19}
                    className="text-green-600 dark:text-green-400"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Account Status
                  </p>

                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 mt-0.5">
                    {getStatusLabel()}
                  </p>
                </div>
              </div>

              {/* Created */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-[#F4B400]/10 flex items-center justify-center shrink-0">
                  <CalendarDays
                    size={19}
                    className="text-[#C99A00] dark:text-yellow-400"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    Account Created
                  </p>

                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 mt-0.5">
                    {formatDate(profile?.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="ep-card rounded-2xl bg-white p-6 shadow-md dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><LockKeyhole size={19} /></div>
            <div><h2 className="font-bold text-gray-900 dark:text-white">Account security</h2><p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Change your password using your current password.</p></div>
          </div>
          {passwordError && <ErrorMessage message={passwordError}><p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{passwordError}</p></ErrorMessage>}
          {passwordMessage && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-300">{passwordMessage}</p>}
          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[['current', 'Current password'], ['next', 'New password'], ['confirm', 'Confirm new password']].map(([key, label]) => <label key={key} className="text-sm font-semibold text-gray-700 dark:text-slate-200">{label}<input required type="password" autoComplete={key === 'current' ? 'current-password' : 'new-password'} minLength={key === 'current' ? undefined : 8} value={passwordForm[key]} onChange={(event) => setPasswordForm((prev) => ({ ...prev, [key]: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>)}
            <div className="md:col-span-3"><button type="submit" disabled={passwordSaving} className="inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0e2f4a] disabled:opacity-60">{passwordSaving && <Loader2 size={16} className="animate-spin" />}{passwordSaving ? 'Updating…' : 'Update password'}</button></div>
          </form>
        </section>

        {/* =========================================================
            ADMINISTRATOR ROLE CARD
        ========================================================= */}
        <div className="ep-card bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden animate-fade-up">
          <div className="relative overflow-hidden ep-brand-gradient">
            <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-20 -left-12 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <GraduationCap size={23} className="text-white" />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-white">
                    Trinidad Municipal College
                  </h2>

                  <p className="text-blue-100 text-sm mt-1">
                    EduPath Administration Portal
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-blue-100 text-xs font-semibold">
                      <BriefcaseBusiness size={13} />
                      Administrator Access
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-blue-100 text-xs font-semibold">
                      <ShieldCheck size={13} />
                      Authorized Account
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
              Your administrator account provides access to EduPath management
              features, including applicant records, admission applications,
              scholarships, entrance examinations, requirements, documents,
              and announcements.
            </p>
          </div>
        </div>

        {/* =========================================================
            FOOTER NOTE
        ========================================================= */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-slate-500 py-2">
          <ShieldCheck size={14} />
          EduPath Administrator Profile
        </div>
      </div>
    </div>
  );
};

export default Profile;
