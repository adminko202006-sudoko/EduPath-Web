import { useEffect, useMemo, useState } from 'react';

import { useConfirmDialog, ConfirmDialogHost } from '../../components/ui/ConfirmDialog';

import {
  UserPlus,
  UserRound,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Mail,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
  RefreshCw,
  BriefcaseBusiness,
  ClipboardList,
  UserCog,
} from 'lucide-react';
import api from '../../services/api';

/* ============================================================================
   STAFF ROLES
============================================================================ */

const staffRoles = [
  'Admission Staff',
  'Scholarship Staff',
  'Registrar Staff',
  'Student Affairs Staff',
  'Clinic Staff',
];

/* ============================================================================
   EMPTY FORM
============================================================================ */

const emptyForm = {
  name: '',
  email: '',
  password: '',
  employee_id: '',
  staff_role: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  position: '',
  status: 'active',
  program_ids: [],
  manage_admissions: false,
  verify_documents: false,
  manage_exams: false,
  manage_scholarships: false,
  manage_announcements: false,
  send_notifications: false,
  view_reports: false,
};

/* ============================================================================
   PERMISSIONS
============================================================================ */

const permissionItems = [
  {
    key: 'manage_admissions',
    label: 'Manage Admissions',
    description:
      'Review and process admission applications.',
  },
  {
    key: 'verify_documents',
    label: 'Verify Documents',
    description:
      'Review and verify applicant documents.',
  },
  {
    key: 'manage_exams',
    label: 'Manage Entrance Exams',
    description:
      'Manage examination schedules and assignments.',
  },
  {
    key: 'manage_scholarships',
    label: 'Manage Scholarships',
    description:
      'Process scholarship applications.',
  },
  {
    key: 'manage_announcements',
    label: 'Manage Announcements',
    description:
      'Create and manage announcements.',
  },
  {
    key: 'send_notifications',
    label: 'Send Notifications',
    description:
      'Send notifications to applicants.',
  },
  {
    key: 'view_reports',
    label: 'View Reports',
    description:
      'Access staff reports and statistics.',
  },
];

/* ============================================================================
   COMPONENT
============================================================================ */

const StaffManagement = ({ confirm }) => {
  const [staff, setStaff] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [programsLoading, setProgramsLoading] =
    useState(true);

  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [form, setForm] = useState({
    ...emptyForm,
    program_ids: [],
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* ==========================================================================
     FETCH STAFF
  ========================================================================== */

  const fetchStaff = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get('/admin/staff');

      setStaff(response.data?.data || []);
    } catch (err) {
      console.error(
        'Unable to load staff members:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Unable to load staff members.'
      );
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  /* ==========================================================================
     FETCH ACADEMIC PROGRAMS
  ========================================================================== */

  const fetchPrograms = async () => {
    try {
      setProgramsLoading(true);

      const response = await api.get('/admin/programs');

      setPrograms(response.data?.data || []);
    } catch (err) {
      console.error(
        'Unable to load academic programs:',
        err
      );

      setPrograms([]);
    } finally {
      setProgramsLoading(false);
    }
  };

  /* ==========================================================================
     INITIAL LOAD
  ========================================================================== */

  useEffect(() => {
    fetchStaff();
    fetchPrograms();
  }, []);

  /* ==========================================================================
     REFRESH
  ========================================================================== */

  const handleRefresh = async () => {
    setSuccess('');

    await Promise.all([
      fetchStaff(true),
      fetchPrograms(),
    ]);
  };

  /* ==========================================================================
     FILTER STAFF
  ========================================================================== */

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return staff;
    }

    return staff.filter((member) => {
      const values = [
        member.user?.name,
        member.user?.email,
        member.employee_id,
        member.staff_role,
        member.first_name,
        member.middle_name,
        member.last_name,
        member.position,

        ...(member.academic_programs || []).flatMap(
          (program) => [
            program.name,
            program.code,
          ]
        ),
      ];

      return values.some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [staff, search]);

  /* ==========================================================================
     STATISTICS
  ========================================================================== */

  const activeCount = staff.filter(
    (member) => member.status === 'active'
  ).length;

  const inactiveCount = staff.filter(
    (member) => member.status === 'inactive'
  ).length;

  const assignedCount = staff.filter(
    (member) =>
      Array.isArray(member.academic_programs) &&
      member.academic_programs.length > 0
  ).length;

  /* ==========================================================================
     OPEN CREATE MODAL
  ========================================================================== */

  const openCreateModal = () => {
    setEditingStaff(null);

    setForm({
      ...emptyForm,
      program_ids: [],
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  };

  /* ==========================================================================
     OPEN EDIT MODAL
  ========================================================================== */

  const openEditModal = (member) => {
    setEditingStaff(member);

    const permissions = member.permissions || {};

    setForm({
      name: member.user?.name || '',
      email: member.user?.email || '',
      password: '',

      employee_id: member.employee_id || '',
      staff_role: member.staff_role || '',

      first_name: member.first_name || '',
      middle_name: member.middle_name || '',
      last_name: member.last_name || '',

      position: member.position || '',
      status: member.status || 'active',

      program_ids: (
        member.academic_programs || []
      ).map((program) => program.id),

      manage_admissions: Boolean(
        permissions.manage_admissions
      ),

      verify_documents: Boolean(
        permissions.verify_documents
      ),

      manage_exams: Boolean(
        permissions.manage_exams
      ),

      manage_scholarships: Boolean(
        permissions.manage_scholarships
      ),

      manage_announcements: Boolean(
        permissions.manage_announcements
      ),

      send_notifications: Boolean(
        permissions.send_notifications
      ),

      view_reports: Boolean(
        permissions.view_reports
      ),
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  };

  /* ==========================================================================
     CLOSE MODAL
  ========================================================================== */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingStaff(null);

    setForm({
      ...emptyForm,
      program_ids: [],
    });

    setError('');
    setSuccess('');
  };

  /* ==========================================================================
     FORM CHANGE
  ========================================================================== */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));
  };

  /* ==========================================================================
     TOGGLE ACADEMIC PROGRAM
  ========================================================================== */

  const toggleProgram = (programId) => {
    setForm((current) => {
      const exists =
        current.program_ids.includes(programId);

      return {
        ...current,

        program_ids: exists
          ? current.program_ids.filter(
              (id) => id !== programId
            )
          : [
              ...current.program_ids,
              programId,
            ],
      };
    });
  };

  /* ==========================================================================
     SELECT ALL PROGRAMS
  ========================================================================== */

  const selectAllPrograms = () => {
    setForm((current) => ({
      ...current,
      program_ids: programs.map(
        (program) => program.id
      ),
    }));
  };

  /* ==========================================================================
     CLEAR PROGRAM ASSIGNMENTS
  ========================================================================== */

  const clearProgramAssignments = () => {
    setForm((current) => ({
      ...current,
      program_ids: [],
    }));
  };

  /* ==========================================================================
     SUBMIT
  ========================================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingStaff) {
        const payload = {
          name: form.name,
          email: form.email,

          employee_id: form.employee_id,
          staff_role: form.staff_role,

          first_name: form.first_name,
          middle_name:
            form.middle_name || null,
          last_name: form.last_name,

          position:
            form.position || null,

          status: form.status,

          program_ids: form.program_ids,

          manage_admissions:
            form.manage_admissions,

          verify_documents:
            form.verify_documents,

          manage_exams:
            form.manage_exams,

          manage_scholarships:
            form.manage_scholarships,

          manage_announcements:
            form.manage_announcements,

          send_notifications:
            form.send_notifications,

          view_reports:
            form.view_reports,
        };

        if (form.password.trim()) {
          payload.password =
            form.password;
        }

        await api.put(
          `/admin/staff/${editingStaff.id}`,
          payload
        );

        setSuccess(
          'Staff account updated successfully.'
        );
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          password: form.password,

          employee_id: form.employee_id,
          staff_role: form.staff_role,

          first_name: form.first_name,
          middle_name:
            form.middle_name || null,
          last_name: form.last_name,

          position:
            form.position || null,

          status: form.status,

          program_ids: form.program_ids,
        };

        await api.post(
          '/admin/staff',
          payload
        );

        setSuccess(
          'Staff account created successfully.'
        );
      }

      await fetchStaff();

      setTimeout(() => {
        setShowModal(false);
        setEditingStaff(null);

        setForm({
          ...emptyForm,
          program_ids: [],
        });

        setSuccess('');
      }, 900);
    } catch (err) {
      console.error(
        'Unable to save staff account:',
        err
      );

      const validationErrors =
        err.response?.data?.errors;

      if (validationErrors) {
        const firstError =
          Object.values(
            validationErrors
          )[0];

        setError(
          Array.isArray(firstError)
            ? firstError[0]
            : String(firstError)
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to save staff account.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================================
     DELETE
  ========================================================================== */

  const handleDelete = async (member) => {
    const confirmed = await confirm({
      title: 'Delete Staff Member',
      message: `Are you sure you want to delete ${
        member.user?.name ||
        'this staff member'
      }? This will permanently remove the staff profile and associated account.`,
      confirmLabel: 'Delete',
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(member.id);
      setError('');
      setSuccess('');

      await api.delete(
        `/admin/staff/${member.id}`
      );

      setStaff((current) =>
        current.filter(
          (item) =>
            item.id !== member.id
        )
      );

      setSuccess(
        'Staff account deleted successfully.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(
        'Unable to delete staff account:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Unable to delete staff account.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ==========================================================================
     FULL PAGE LOADING
  ========================================================================== */

  if (loading) {
    return (
      <div className="space-y-6 page-transition">

        {/* HERO SKELETON */}

        <section className="relative overflow-hidden rounded-2xl bg-gray-200 p-6 shadow-lg dark:bg-gray-800 sm:p-8">

          <div className="space-y-4">

            <div className="ep-skeleton h-7 w-36 rounded-full" />

            <div className="ep-skeleton h-10 w-72 rounded-xl sm:w-96" />

            <div className="ep-skeleton h-5 w-full max-w-2xl rounded-lg" />

            <div className="ep-skeleton h-5 w-3/4 max-w-xl rounded-lg" />

          </div>

        </section>

        {/* STAT SKELETONS */}

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="ep-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">

                <div className="space-y-3">

                  <div className="ep-skeleton h-4 w-24 rounded" />

                  <div className="ep-skeleton h-9 w-16 rounded-lg" />

                  <div className="ep-skeleton h-3 w-32 rounded" />

                </div>

                <div className="ep-skeleton h-12 w-12 rounded-xl" />

              </div>

              <div className="ep-skeleton mt-5 h-1 rounded-full" />

            </div>
          ))}

        </section>

        {/* SEARCH / LIST SKELETON */}

        <section className="ep-card overflow-hidden rounded-2xl">

          <div className="border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-3">

                <div className="ep-skeleton h-11 w-11 rounded-xl" />

                <div className="space-y-2">

                  <div className="ep-skeleton h-5 w-36 rounded" />

                  <div className="ep-skeleton h-3 w-52 rounded" />

                </div>

              </div>

              <div className="ep-skeleton h-11 w-full rounded-xl lg:max-w-sm" />

            </div>

          </div>

          <div className="space-y-4 p-6">

            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="ep-skeleton h-20 rounded-xl"
              />
            ))}

          </div>

        </section>

        <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">

          <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />

          Loading staff management...

        </div>

      </div>
    );
  }

  /* ==========================================================================
     PAGE
  ========================================================================== */

  return (
    <div className="space-y-6 page-transition">

      {/* ======================================================================
          HERO
      ====================================================================== */}

      <section className="ep-brand-gradient relative overflow-hidden rounded-2xl p-6 shadow-lg sm:p-8">

        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-teal-300/10 blur-2xl" />

        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-amber-300/10 blur-2xl" />

        <div className="absolute right-1/4 top-1/2 h-24 w-24 rounded-full bg-white/5 blur-xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="animate-fade-up">

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90">

              <ShieldCheck className="h-4 w-4 text-amber-300" />

              Administration

            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Staff Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Create and manage TMC staff accounts,
              staff roles, academic program assignments,
              and operational access permissions.
            </p>

          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-semibold text-white ring-1 ring-white/20 transition-colors duration-200  hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <RefreshCw
                className={`h-5 w-5 ${
                  refreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />

              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}

            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-[#123B5D] shadow-lg transition-colors duration-200  hover:bg-gray-100"
            >

              <UserRound className="h-5 w-5" />

              <span>Add Staff</span>

            </button>

          </div>

        </div>

      </section>

      {/* ======================================================================
          ALERTS
      ====================================================================== */}

      {error && !showModal && (
        <div className="animate-fade-up flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">

            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>

          </div>

          <button
            type="button"
            onClick={() => setError('')}
            className="rounded-lg p-1 transition hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}

      {success && !showModal && (
        <div className="animate-fade-up flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">

          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>

            <p className="font-semibold">
              Success
            </p>

            <p className="mt-1 text-sm">
              {success}
            </p>

          </div>

        </div>
      )}

      {/* ======================================================================
          STATISTICS
      ====================================================================== */}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Total Staff"
          value={staff.length}
          icon={Users}
          iconClass="bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
          description="Registered staff accounts"
          delay="0ms"
        />

        <StatCard
          label="Active Staff"
          value={activeCount}
          icon={UserCheck}
          iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          description="Currently active accounts"
          delay="80ms"
        />

        <StatCard
          label="Inactive Staff"
          value={inactiveCount}
          icon={UserX}
          iconClass="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          description="Inactive staff accounts"
          delay="160ms"
        />

        <StatCard
          label="Program Assigned"
          value={assignedCount}
          icon={GraduationCap}
          iconClass="bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
          description="Staff with program assignments"
          delay="240ms"
        />

      </section>

      {/* ======================================================================
          STAFF LIST
      ====================================================================== */}

      <section className="ep-card animate-fade-up overflow-hidden rounded-2xl">

        <div className="ep-brand-gradient relative overflow-hidden px-5 py-5 sm:px-6">

          <div className="absolute -right-10 -top-14 h-32 w-32 rounded-full bg-white/10 blur-xl" />

          <div className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-amber-300/10 blur-xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">

                <Users className="h-5 w-5" />

              </div>

              <div>

                <h2 className="text-lg font-bold text-white">
                  Staff Accounts
                </h2>

                <p className="mt-1 text-sm text-blue-100">
                  Manage staff roles, access,
                  assignments, and account status.
                </p>

              </div>

            </div>

            <div className="relative w-full lg:max-w-sm">

              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search staff, role, or program..."
                className="w-full rounded-xl border border-white/20 bg-white/95 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-white/40 dark:bg-gray-900/90 dark:text-white"
              />

            </div>

          </div>

        </div>

        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700 sm:px-6">

          <p className="text-sm text-gray-500 dark:text-gray-400">

            Showing{' '}

            <span className="font-semibold text-gray-900 dark:text-white">
              {filteredStaff.length}
            </span>{' '}

            of{' '}

            <span className="font-semibold text-gray-900 dark:text-white">
              {staff.length}
            </span>{' '}

            staff accounts

          </p>

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-xs font-semibold text-[#0F766E] hover:underline dark:text-teal-400"
            >
              Clear search
            </button>
          )}

        </div>

        {filteredStaff.length === 0 ? (

          <div className="px-6 py-16 text-center">

            <div className="animate-float mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">

              <Users className="h-8 w-8" />

            </div>

            <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">

              {search
                ? 'No staff members found'
                : 'No staff accounts yet'}

            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">

              {search
                ? 'Try adjusting your search or clear the search field to view all staff accounts.'
                : 'Create the first staff account to begin managing TMC staff.'}

            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition  hover:bg-[#0F3553]"
              >

                <UserPlus className="h-4 w-4" />

                Add Staff

              </button>
            )}

          </div>

        ) : (

          <>

            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto lg:block">

              <table className="w-full min-w-[1100px]">

                <thead>

                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400">

                    <th className="px-6 py-4">
                      Staff Member
                    </th>

                    <th className="px-6 py-4">
                      Employee ID
                    </th>

                    <th className="px-6 py-4">
                      Role / Position
                    </th>

                    <th className="px-6 py-4">
                      Programs Served
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                  {filteredStaff.map(
                    (member) => {

                      const staffName =
                        member.user?.name ||
                        `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
                        'Unnamed Staff';

                      const initial =
                        staffName
                          .charAt(0)
                          .toUpperCase();

                      return (
                        <tr
                          key={member.id}
                          className="group transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#123B5D] to-[#0F766E] font-bold text-white shadow-sm transition-transform duration-200 ">

                                {initial}

                              </div>

                              <div>

                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {staffName}
                                </p>

                                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">

                                  <Mail className="h-3.5 w-3.5" />

                                  {member.user?.email ||
                                    '—'}

                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">

                              {member.employee_id ||
                                '—'}

                            </span>

                          </td>

                          <td className="px-6 py-5">

                            <div>

                              <div className="flex items-center gap-2">

                                <UserCog className="h-4 w-4 text-[#0F766E] dark:text-teal-400" />

                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {member.staff_role ||
                                    '—'}
                                </p>

                              </div>

                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {member.position ||
                                  'No position specified'}
                              </p>

                            </div>

                          </td>

                          <td className="px-6 py-5">

                            {member.academic_programs
                              ?.length ? (

                              <div className="flex max-w-[240px] flex-wrap gap-1.5">

                                {member.academic_programs.map(
                                  (program) => (
                                    <span
                                      key={
                                        program.id
                                      }
                                      title={
                                        program.name
                                      }
                                      className="rounded-lg bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                                    >
                                      {program.code ||
                                        program.name}
                                    </span>
                                  )
                                )}

                              </div>

                            ) : (

                              <span className="text-sm text-gray-400">
                                No assignment
                              </span>

                            )}

                          </td>

                          <td className="px-6 py-5">

                            <StatusBadge
                              status={member.status}
                            />

                          </td>

                          <td className="px-6 py-5">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    member
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition  hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-teal-700 dark:hover:bg-teal-950/30 dark:hover:text-teal-300"
                              >

                                <Pencil className="h-4 w-4" />

                                Edit

                              </button>

                              <DeleteButton
                                member={member}
                                deletingId={
                                  deletingId
                                }
                                onDelete={
                                  handleDelete
                                }
                              />

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

            {/* MOBILE / TABLET */}

            <div className="divide-y divide-gray-200 dark:divide-gray-700 lg:hidden">

              {filteredStaff.map(
                (member) => {

                  const staffName =
                    member.user?.name ||
                    `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
                    'Unnamed Staff';

                  const initial =
                    staffName
                      .charAt(0)
                      .toUpperCase();

                  return (
                    <div
                      key={member.id}
                      className="p-5 transition hover:bg-gray-50 dark:hover:bg-gray-800/40 sm:p-6"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#123B5D] to-[#0F766E] font-bold text-white shadow-sm">

                            {initial}

                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-bold text-gray-900 dark:text-white">
                              {staffName}
                            </p>

                            <p className="mt-1 flex items-center gap-1 truncate text-sm text-gray-500 dark:text-gray-400">

                              <Mail className="h-3.5 w-3.5 shrink-0" />

                              {member.user?.email ||
                                '—'}

                            </p>

                          </div>

                        </div>

                        <StatusBadge
                          status={
                            member.status
                          }
                        />

                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">

                        <InfoItem
                          icon={
                            BriefcaseBusiness
                          }
                          label="Employee ID"
                          value={
                            member.employee_id ||
                            '—'
                          }
                        />

                        <InfoItem
                          icon={UserCog}
                          label="Staff Role"
                          value={
                            member.staff_role ||
                            '—'
                          }
                        />

                        <InfoItem
                          icon={UserRound}
                          label="Position"
                          value={
                            member.position ||
                            '—'
                          }
                        />

                        <InfoItem
                          icon={GraduationCap}
                          label="Programs Served"
                          value={
                            member
                              .academic_programs
                              ?.length
                              ? `${member.academic_programs.length} assigned`
                              : 'No assignment'
                          }
                        />

                      </div>

                      {member.academic_programs
                        ?.length > 0 && (

                        <div className="mt-4 flex flex-wrap gap-1.5">

                          {member.academic_programs.map(
                            (program) => (
                              <span
                                key={
                                  program.id
                                }
                                title={
                                  program.name
                                }
                                className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                              >
                                {program.code ||
                                  program.name}
                              </span>
                            )
                          )}

                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              member
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-teal-700 dark:hover:bg-teal-950/30 dark:hover:text-teal-300"
                        >

                          <Pencil className="h-4 w-4" />

                          Edit Staff

                        </button>

                        <DeleteButton
                          member={member}
                          deletingId={
                            deletingId
                          }
                          onDelete={
                            handleDelete
                          }
                          mobile
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </>
        )}

      </section>

      {/* ======================================================================
          CREATE / EDIT MODAL
      ====================================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="animate-scale-in flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#102334]">

            {/* MODAL HEADER */}

            <div className="ep-brand-gradient relative overflow-hidden px-6 py-5 text-white sm:px-8">

              <div className="absolute -right-10 -top-16 h-36 w-36 rounded-full bg-white/10 blur-xl" />

              <div className="absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-amber-300/10 blur-xl" />

              <div className="relative flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">

                    {editingStaff ? (
                      <Pencil className="h-5 w-5" />
                    ) : (
                      <UserPlus className="h-5 w-5" />
                    )}

                  </div>

                  <div>

                    <h2 className="text-xl font-bold">

                      {editingStaff
                        ? 'Edit Staff Account'
                        : 'Create Staff Account'}

                    </h2>

                    <p className="mt-1 text-sm text-blue-100">

                      {editingStaff
                        ? 'Update staff information, role, academic programs served, and permissions.'
                        : 'Create an account for a TMC staff member, assign their role, and select the academic programs they serve.'}

                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <X className="h-6 w-6" />
                </button>

              </div>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="min-h-0 overflow-y-auto"
            >

              <div className="space-y-6 p-5 sm:p-8">

                {/* FORM ERROR */}

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>

                      <p className="font-semibold">
                        Unable to save
                      </p>

                      <p className="mt-1 text-sm">
                        {error}
                      </p>

                    </div>

                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">

                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                    <p className="text-sm font-semibold">
                      {success}
                    </p>

                  </div>
                )}

                {/* ==================================================================
                    PERSONAL INFORMATION
                ================================================================== */}

                <FormSection
                  icon={Users}
                  title="Personal Information"
                  description="Enter the staff member's official name."
                >

                  <div className="grid gap-4 sm:grid-cols-3">

                    <InputField
                      label="First Name"
                      name="first_name"
                      value={
                        form.first_name
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                    <InputField
                      label="Middle Name"
                      name="middle_name"
                      value={
                        form.middle_name
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <InputField
                      label="Last Name"
                      name="last_name"
                      value={
                        form.last_name
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                </FormSection>

                {/* ==================================================================
                    ACCOUNT INFORMATION
                ================================================================== */}

                <FormSection
                  icon={ShieldCheck}
                  title="Account Information"
                  description="Configure the credentials used to access the Staff Portal."
                >

                  <div className="grid gap-4 sm:grid-cols-2">

                    <InputField
                      label="Account Name"
                      name="name"
                      value={form.name}
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="Example: Juan Dela Cruz"
                    />

                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      value={
                        form.email
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                    <InputField
                      label={
                        editingStaff
                          ? 'New Password (optional)'
                          : 'Password'
                      }
                      name="password"
                      type="password"
                      value={
                        form.password
                      }
                      onChange={
                        handleChange
                      }
                      required={
                        !editingStaff
                      }
                      placeholder={
                        editingStaff
                          ? 'Leave blank to keep current password'
                          : 'Minimum 8 characters'
                      }
                    />

                    <InputField
                      label="Employee ID"
                      name="employee_id"
                      value={
                        form.employee_id
                      }
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="Example: EMP-002"
                    />

                  </div>

                </FormSection>

                {/* ==================================================================
                    STAFF ROLE & POSITION
                ================================================================== */}

                <FormSection
                  icon={UserCog}
                  title="Staff Role & Position"
                  description="Define the staff member's operational role and position."
                >

                  <div className="grid gap-4 sm:grid-cols-2">

                    {/* STAFF ROLE */}

                    <div>

                      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">

                        Staff Role

                        <span className="ml-1 text-red-500">
                          *
                        </span>

                      </label>

                      <select
                        name="staff_role"
                        value={
                          form.staff_role
                        }
                        onChange={
                          handleChange
                        }
                        required
                        className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      >

                        <option value="">
                          Select staff role
                        </option>

                        {staffRoles.map(
                          (role) => (
                            <option
                              key={role}
                              value={role}
                            >
                              {role}
                            </option>
                          )
                        )}

                      </select>

                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Select the primary operational role of this staff member.
                      </p>

                    </div>

                    {/* POSITION */}

                    <InputField
                      label="Position"
                      name="position"
                      value={
                        form.position
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Example: Admissions Officer"
                    />

                    {/* STATUS */}

                    <div>

                      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Account Status
                      </label>

                      <select
                        name="status"
                        value={
                          form.status
                        }
                        onChange={
                          handleChange
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      >

                        <option value="active">
                          Active
                        </option>

                        <option value="inactive">
                          Inactive
                        </option>

                      </select>

                    </div>

                  </div>

                </FormSection>

                {/* ==================================================================
                    ACADEMIC PROGRAMS SERVED
                ================================================================== */}

                <FormSection
                  icon={GraduationCap}
                  title="Academic Programs Served"
                  description="Select the academic programs this staff member is assigned to handle."
                >

                  <div className="mb-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-start gap-3">

                      <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />

                      <div>

                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                          Program assignment
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-300">
                          A staff member can serve one or multiple academic programs.
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center gap-2">

                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm dark:bg-gray-800 dark:text-blue-300">

                        {form.program_ids.length}{' '}

                        {form.program_ids.length === 1
                          ? 'program'
                          : 'programs'} selected

                      </span>

                    </div>

                  </div>

                  {programsLoading ? (

                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">

                      <Loader2 className="h-4 w-4 animate-spin" />

                      Loading academic programs...

                    </div>

                  ) : programs.length === 0 ? (

                    <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">

                      No academic programs are available.

                    </div>

                  ) : (

                    <>

                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Choose the program or programs this staff member will serve.
                        </p>

                        <div className="flex items-center gap-2">

                          <button
                            type="button"
                            onClick={
                              selectAllPrograms
                            }
                            disabled={
                              form.program_ids.length ===
                              programs.length
                            }
                            className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-950/30 dark:text-teal-300 dark:hover:bg-teal-950/50"
                          >
                            Select All
                          </button>

                          <button
                            type="button"
                            onClick={
                              clearProgramAssignments
                            }
                            disabled={
                              form.program_ids.length ===
                              0
                            }
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            Clear
                          </button>

                        </div>

                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">

                        {programs.map(
                          (program) => {

                            const selected =
                              form.program_ids.includes(
                                program.id
                              );

                            return (
                              <label
                                key={
                                  program.id
                                }
                                className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors duration-200 ${
                                  selected
                                    ? 'border-teal-400 bg-teal-50 shadow-sm dark:border-teal-700 dark:bg-teal-950/30'
                                    : 'border-gray-200  hover:border-teal-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-teal-700'
                                }`}
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    selected
                                  }
                                  onChange={() =>
                                    toggleProgram(
                                      program.id
                                    )
                                  }
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                />

                                <div className="min-w-0">

                                  <div className="flex flex-wrap items-center gap-2">

                                    <p className="font-semibold text-gray-900 dark:text-white">

                                      {
                                        program.name
                                      }

                                    </p>

                                    {program.is_active === false && (
                                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                        Inactive
                                      </span>
                                    )}

                                  </div>

                                  {program.code && (
                                    <p className="mt-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
                                      {
                                        program.code
                                      }
                                    </p>
                                  )}

                                  {program.description && (
                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                      {
                                        program.description
                                      }
                                    </p>
                                  )}

                                </div>

                              </label>
                            );
                          }
                        )}

                      </div>

                    </>
                  )}

                </FormSection>

                {/* ==================================================================
                    PERMISSIONS
                ================================================================== */}

                {editingStaff && (

                  <FormSection
                    icon={FileCheck}
                    title="Staff Permissions"
                    description="Control which operational features this staff member can access."
                  >

                    <div className="grid gap-3 sm:grid-cols-2">

                      {permissionItems.map(
                        (permission) => {

                          const enabled =
                            Boolean(
                              form[
                                permission.key
                              ]
                            );

                          return (
                            <label
                              key={
                                permission.key
                              }
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors duration-200 ${
                                enabled
                                  ? 'border-teal-300 bg-teal-50 shadow-sm dark:border-teal-700 dark:bg-teal-950/30'
                                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                              }`}
                            >

                              <input
                                type="checkbox"
                                name={
                                  permission.key
                                }
                                checked={
                                  enabled
                                }
                                onChange={
                                  handleChange
                                }
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />

                              <div>

                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {
                                    permission.label
                                  }
                                </p>

                                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                  {
                                    permission.description
                                  }
                                </p>

                              </div>

                            </label>
                          );
                        }
                      )}

                    </div>

                  </FormSection>

                )}

                {!editingStaff && (

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">

                    <div className="flex items-start gap-3">

                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />

                      <div>

                        <p className="font-semibold text-blue-900 dark:text-blue-200">
                          Default staff access
                        </p>

                        <p className="mt-1 text-sm leading-6 text-blue-700 dark:text-blue-300">

                          New staff accounts are created
                          with their assigned role and
                          academic programs. After creation,
                          edit the account to configure its
                          operational permissions.

                        </p>

                      </div>

                    </div>

                  </div>
                )}

              </div>

              {/* FOOTER */}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:justify-end sm:px-8">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !form.staff_role
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-200  hover:bg-[#0F3553] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />

                      {editingStaff
                        ? 'Save Changes'
                        : 'Create Staff'}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

/* ============================================================================
   STAT CARD
============================================================================ */

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconClass,
  description,
  delay,
}) => {
  return (
    <div
      className="ep-card ep-hover-lift animate-fade-up rounded-2xl p-5"
      style={{
        animationDelay: delay,
      }}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>

        </div>

        <div
          className={`rounded-xl p-3 ${iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </div>

      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#123B5D] to-[#0F766E]" />

      </div>

    </div>
  );
};

/* ============================================================================
   STATUS BADGE
============================================================================ */

const StatusBadge = ({ status }) => {
  const active = status === 'active';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >

      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? 'bg-emerald-500'
            : 'bg-gray-400'
        }`}
      />

      {active
        ? 'Active'
        : 'Inactive'}

    </span>
  );
};

/* ============================================================================
   DELETE BUTTON
============================================================================ */

const DeleteButton = ({
  member,
  deletingId,
  onDelete,
  mobile = false,
}) => {
  const deleting =
    deletingId === member.id;

  return (
    <button
      type="button"
      onClick={() =>
        onDelete(member)
      }
      disabled={deleting}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition  hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30 ${
        mobile
          ? 'sm:flex-1'
          : ''
      }`}
    >

      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}

      {deleting
        ? 'Deleting...'
        : mobile
          ? 'Delete Staff'
          : 'Delete'}

    </button>
  );
};

/* ============================================================================
   INFO ITEM
============================================================================ */

const InfoItem = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">

      <div className="flex items-center gap-2">

        <Icon className="h-4 w-4 text-[#0F766E] dark:text-teal-400" />

        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </span>

      </div>

      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </p>

    </div>
  );
};

/* ============================================================================
   FORM SECTION
============================================================================ */

const FormSection = ({
  icon: Icon,
  title,
  description,
  children,
}) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">

      <div className="ep-brand-gradient relative overflow-hidden px-5 py-4">

        <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/10 blur-xl" />

        <div className="relative flex items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">

            <Icon className="h-5 w-5" />

          </div>

          <div>

            <h3 className="font-bold text-white">
              {title}
            </h3>

            <p className="mt-0.5 text-xs text-blue-100">
              {description}
            </p>

          </div>

        </div>

      </div>

      <div className="bg-white p-5 dark:bg-[#102334] sm:p-6">

        {children}

      </div>

    </section>
  );
};

/* ============================================================================
   INPUT FIELD
============================================================================ */

const InputField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder = '',
}) => {
  return (
    <div>

      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
      />

    </div>
  );
};

const StaffManagementWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <StaffManagement confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default StaffManagementWrapper;

