import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const Profile = () => {
  const { user, token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/auth/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data?.data || response.data;

      setProfile(data);

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
  };

  useEffect(() => {
    loadProfile();
  }, [token]);

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

      const response = await api.put(
        "/auth/profile",
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
    <div className="min-h-screen bg-[#f4f7fa] dark:bg-slate-950 page-transition">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* =========================================================
            HERO
        ========================================================= */}
        <div className="relative overflow-hidden rounded-2xl ep-brand-gradient shadow-lg">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-blue-100 text-xs font-bold mb-4">
              <ShieldCheck size={18} />
              Administration
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <User size={27} className="text-white" />
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Admin Profile
                  </h1>

                  <p className="text-blue-100 text-sm mt-1">
                    Manage your administrator account information and profile
                    details.
                  </p>
                </div>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-sm transition"
                >
                  <Pencil size={17} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            ALERTS
        ========================================================= */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
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
          </div>
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
          <div className="relative h-32 ep-brand-gradient overflow-hidden">
            <div className="absolute -top-12 right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 left-20 w-48 h-48 rounded-full bg-white/5" />
          </div>

          <div className="relative px-6 sm:px-8 pb-7">
            {/* Avatar */}
            <div className="-mt-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="w-28 h-28 rounded-2xl bg-[#123B5D] dark:bg-slate-700 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-white">
                    {getInitials(profile?.name || user?.name)}
                  </span>
                </div>

                <div className="pb-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#123B5D] dark:text-white">
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
                </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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