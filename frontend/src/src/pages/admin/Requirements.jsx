import { useEffect, useState } from 'react';

import { useConfirmDialog, ConfirmDialogHost } from '../../components/ui/ConfirmDialog';

import { useAuth } from '../../context/AuthContext';

import api from '../../services/api';

import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  X,
  Save,
  ClipboardList,
  AlertCircle,
  Upload,
  Download,
  FileUp,
  ShieldCheck,
  Loader2,
  MoreHorizontal,
  GraduationCap,
  Check,
} from 'lucide-react';

const Requirements = ({ confirm }) => {
  const { token } = useAuth();

  const [requirements, setRequirements] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [programsLoading, setProgramsLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_required: true,
    is_active: true,
    program_ids: [],
  });

  /* =========================================================
     LOAD REQUIREMENTS
  ========================================================= */

  const loadRequirements = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/admin/requirements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setRequirements(
        Array.isArray(data)
          ? data
          : data.data || []
      );
    } catch (err) {
      console.error(
        'Failed to load requirements:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load admission requirements.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD PROGRAMS
  ========================================================= */

  const loadPrograms = async () => {
    try {
      setProgramsLoading(true);

      const response = await api.get('/admin/programs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const programData =
        Array.isArray(data)
          ? data
          : data.data || [];

      setPrograms(programData);
    } catch (err) {
      console.error(
        'Failed to load academic programs:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load academic programs.'
      );
    } finally {
      setProgramsLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadPageData = async () => {
      await Promise.all([
        loadRequirements(),
        loadPrograms(),
      ]);
    };

    loadPageData();
  }, [token]);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));
  };

  /* =========================================================
     PROGRAM SELECTION
  ========================================================= */

  const toggleProgram = (programId) => {
    setFormData((previous) => {
      const exists =
        previous.program_ids.includes(programId);

      return {
        ...previous,
        program_ids: exists
          ? previous.program_ids.filter(
              (id) => id !== programId
            )
          : [
              ...previous.program_ids,
              programId,
            ],
      };
    });
  };

  const selectAllPrograms = () => {
    setFormData((previous) => ({
      ...previous,
      program_ids: programs
        .filter(
          (program) =>
            program.is_active !== false
        )
        .map((program) => program.id),
    }));
  };

  const clearAllPrograms = () => {
    setFormData((previous) => ({
      ...previous,
      program_ids: [],
    }));
  };

  /* =========================================================
     FILE CHANGE
  ========================================================= */

  const handleFileChange = (e) => {
    const file =
      e.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      setError(
        'Only PDF files are allowed.'
      );

      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'The PDF file must not exceed 5 MB.'
      );

      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  /* =========================================================
     CREATE FORM
  ========================================================= */

  const openCreateForm = () => {
    setShowForm(true);
    setEditingId(null);

    setFormData({
      name: '',
      description: '',
      is_required: true,
      is_active: true,
      program_ids: [],
    });

    setSelectedFile(null);
    setError('');
    setSuccess('');

    if (programs.length === 0) {
      loadPrograms();
    }
  };

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_required: true,
      is_active: true,
      program_ids: [],
    });

    setSelectedFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setSuccess('');
      setSubmitting(true);

      const data = new FormData();

      data.append(
        'name',
        formData.name
      );

      data.append(
        'description',
        formData.description || ''
      );

      data.append(
        'is_required',
        formData.is_required
          ? '1'
          : '0'
      );

      data.append(
        'is_active',
        formData.is_active
          ? '1'
          : '0'
      );

      /*
       * Send each program ID as:
       *
       * program_ids[]
       *
       * Laravel will receive this as an array.
       */
      formData.program_ids.forEach(
        (programId) => {
          data.append(
            'program_ids[]',
            programId
          );
        }
      );

      if (selectedFile) {
        data.append(
          'file',
          selectedFile
        );
      }

      let response;

      if (editingId) {
        /*
         * Laravel PUT requests do not reliably
         * process multipart FormData files.
         *
         * POST + _method=PUT allows Laravel to
         * process the uploaded file correctly.
         */
        data.append('_method', 'PUT');

        response = await api.post(
          `/admin/requirements/${editingId}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(
          response.data?.message ||
            'Admission requirement updated successfully.'
        );
      } else {
        response = await api.post(
          '/admin/requirements',
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(
          response.data?.message ||
            'Admission requirement created successfully.'
        );
      }

      resetForm();

      await loadRequirements();
    } catch (err) {
      console.error(
        'Failed to save admission requirement:',
        err
      );

      if (err.response?.data?.errors) {
        const validationErrors =
          Object.values(
            err.response.data.errors
          )
            .flat()
            .join(' ');

        setError(validationErrors);
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to save admission requirement.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEdit = (requirement) => {
    setEditingId(requirement.id);

    const assignedProgramIds = Array.isArray(
      requirement.academic_programs
    )
      ? requirement.academic_programs.map(
          (program) => program.id
        )
      : [];

    setFormData({
      name: requirement.name || '',
      description:
        requirement.description || '',
      is_required:
        Boolean(requirement.is_required),
      is_active:
        Boolean(requirement.is_active),
      program_ids: assignedProgramIds,
    });

    setSelectedFile(null);

    setShowForm(true);
    setError('');
    setSuccess('');

    if (programs.length === 0) {
      loadPrograms();
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Requirement',
      message: 'Are you sure you want to delete this admission requirement?',
      confirmLabel: 'Delete',
    });

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const response =
        await api.delete(
          `/admin/requirements/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setSuccess(
        response.data?.message ||
          'Admission requirement deleted successfully.'
      );

      await loadRequirements();
    } catch (err) {
      console.error(
        'Failed to delete admission requirement:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to delete admission requirement.'
      );
    }
  };

  /* =========================================================
     FILE URL
  ========================================================= */

  const getFileUrl = (filePath) => {
    if (!filePath) {
      return null;
    }

    return `http://127.0.0.1:8000/storage/${filePath}`;
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  /* =========================================================
     STATISTICS
  ========================================================= */

  const activeCount =
    requirements.filter(
      (requirement) =>
        requirement.is_active
    ).length;

  const assignedCount =
    requirements.filter(
      (requirement) =>
        Array.isArray(requirement.academic_programs) &&
        requirement.academic_programs.length > 0
    ).length;

  const inactiveCount =
    requirements.filter(
      (requirement) =>
        !requirement.is_active
    ).length;

  const requiredCount =
    requirements.filter(
      (requirement) =>
        requirement.is_required
    ).length;

  /* =========================================================
     HELPERS
  ========================================================= */

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="space-y-6 page-transition">

        {/* HERO SKELETON */}
        <section className="ep-skeleton relative overflow-hidden rounded-2xl p-6 shadow-lg sm:p-8">
          <div className="relative">
            <div className="h-6 w-36 rounded-full bg-gray-200 dark:bg-gray-700" />

            <div className="mt-4 h-9 w-72 rounded-lg bg-gray-200 dark:bg-gray-700" />

            <div className="mt-3 h-4 w-full max-w-2xl rounded bg-gray-200 dark:bg-gray-700" />

            <div className="mt-2 h-4 w-2/3 max-w-xl rounded bg-gray-200 dark:bg-gray-700" />
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
                  <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-9 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-36 rounded bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
              </div>

              <div className="mt-5 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </section>

        {/* LIST SKELETON */}
        <section className="ep-card overflow-hidden rounded-2xl">
          <div className="border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-64 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="p-5 sm:p-6"
              >
                <div className="flex gap-4">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700" />

                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-56 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-full max-w-lg rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-2/3 max-w-md rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />

          <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            Loading admission requirements...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition">

      {/* =====================================================
          HERO
      ====================================================== */}

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
              Admission Requirements
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Manage the documents and requirements applicants
              need to submit for admission.
            </p>

          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-white/20 transition-colors duration-200  hover:bg-white/20"
          >
            <Plus className="h-5 w-5" />

            <span>Add Requirement</span>
          </button>

        </div>
      </section>

      {/* =====================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div className="animate-fade-up flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/50">
            <AlertCircle className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1 text-sm leading-5">
              {error}
            </p>
          </div>

        </div>
      )}

      {success && (
        <div className="animate-fade-up flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
            <CheckCircle className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="font-semibold">
              Success
            </p>

            <p className="mt-1 text-sm leading-5">
              {success}
            </p>
          </div>

        </div>
      )}

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Total Requirements"
          value={requirements.length}
          icon={FileText}
          iconClass="bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
          description="All admission requirements"
          delay="0ms"
        />

        <StatCard
          label="Active"
          value={activeCount}
          icon={CheckCircle}
          iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          description="Currently available"
          delay="80ms"
        />

        <StatCard
          label="Required"
          value={requiredCount}
          icon={ClipboardList}
          iconClass="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
          description="Required from applicants"
          delay="160ms"
        />

        <StatCard
          label="Program Assigned"
          value={assignedCount}
          icon={GraduationCap}
          iconClass="bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
          description="Requirements linked to programs"
          delay="240ms"
        />

      </section>

      {/* =====================================================
          FORM
      ====================================================== */}

      {showForm && (
        <section className="ep-card animate-scale-in overflow-hidden rounded-2xl">

          <div className="relative overflow-hidden bg-gradient-to-r from-[#123B5D] to-[#0F766E] px-6 py-5 text-white sm:px-8">

            <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-xl" />

            <div className="relative flex items-center justify-between gap-4">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">

                  {editingId ? (
                    <Pencil className="h-5 w-5" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}

                </div>

                <div className="min-w-0">

                  <h2 className="text-lg font-bold sm:text-xl">
                    {editingId
                      ? 'Edit Admission Requirement'
                      : 'Add Admission Requirement'}
                  </h2>

                  <p className="mt-1 text-sm text-blue-100">
                    {editingId
                      ? 'Update the information, program assignments, or downloadable form.'
                      : 'Create a new requirement and assign it to applicable programs.'}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="shrink-0 rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>

            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8"
          >

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* REQUIREMENT NAME */}

              <div className="lg:col-span-2">

                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">

                  Requirement Name

                  <span className="ml-1 text-red-500">
                    *
                  </span>

                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. PSA Birth Certificate"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />

              </div>

              {/* DESCRIPTION */}

              <div className="lg:col-span-2">

                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe what the applicant needs to submit."
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />

              </div>

              {/* PROGRAM ASSIGNMENT */}

              <div className="lg:col-span-2">

                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">

                      Applicable Academic Programs

                    </label>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Select the programs where this requirement applies.
                    </p>

                  </div>

                  {programs.length > 0 && (
                    <div className="flex items-center gap-2">

                      <button
                        type="button"
                        onClick={selectAllPrograms}
                        disabled={submitting}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#123B5D] transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"
                      >
                        Select All
                      </button>

                      <button
                        type="button"
                        onClick={clearAllPrograms}
                        disabled={submitting}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        Clear
                      </button>

                    </div>
                  )}

                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/40">

                  {programsLoading ? (

                    <div className="flex items-center justify-center py-8">

                      <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />

                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        Loading academic programs...
                      </span>

                    </div>

                  ) : programs.length === 0 ? (

                    <div className="py-8 text-center">

                      <GraduationCap className="mx-auto h-8 w-8 text-gray-400" />

                      <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                        No academic programs found.
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        Create an academic program first.
                      </p>

                    </div>

                  ) : (

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                      {programs.map((program) => {

                        const selected =
                          formData.program_ids.includes(
                            program.id
                          );

                        const isInactive =
                          program.is_active === false;

                        return (
                          <button
                            key={program.id}
                            type="button"
                            onClick={() =>
                              toggleProgram(program.id)
                            }
                            disabled={
                              submitting ||
                              isInactive
                            }
                            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors duration-200 ${
                              selected
                                ? 'border-[#0F766E] bg-teal-50 shadow-sm dark:border-teal-700 dark:bg-teal-950/30'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-750'
                            } ${
                              isInactive
                                ? 'cursor-not-allowed opacity-50'
                                : ''
                            }`}
                          >

                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                selected
                                  ? 'border-[#0F766E] bg-[#0F766E] text-white'
                                  : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'
                              }`}
                            >

                              {selected && (
                                <Check className="h-3.5 w-3.5" />
                              )}

                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                  {program.name}
                                </p>

                                {program.code && (
                                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                    {program.code}
                                  </span>
                                )}

                              </div>

                              {isInactive && (
                                <p className="mt-0.5 text-xs text-gray-400">
                                  Inactive program
                                </p>
                              )}

                            </div>

                          </button>
                        );
                      })}

                    </div>

                  )}

                  <div className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">

                    <GraduationCap className="h-4 w-4 text-[#0F766E]" />

                    <p className="text-xs text-gray-500 dark:text-gray-400">

                      {formData.program_ids.length === 0
                        ? 'No programs selected. This requirement will not be assigned to a specific program.'
                        : `${formData.program_ids.length} program${
                            formData.program_ids.length === 1
                              ? ''
                              : 's'
                          } selected.`}

                    </p>

                  </div>

                </div>

              </div>

              {/* FILE UPLOAD */}

              <div className="lg:col-span-2">

                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Admission Form PDF
                </label>

                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/70 p-6 transition hover:border-[#0F766E]/40 hover:bg-teal-50/30 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-teal-700 dark:hover:bg-teal-950/10">

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300">

                      <FileUp className="h-6 w-6" />

                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate font-semibold text-gray-900 dark:text-white">

                        {selectedFile
                          ? selectedFile.name
                          : editingId
                            ? 'Replace existing admission form'
                            : 'Upload a downloadable admission form'}

                      </p>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        PDF only • Maximum file size: 5 MB
                      </p>

                      {editingId &&
                        !selectedFile && (
                          <p className="mt-2 text-xs text-gray-400">
                            Leave empty to keep the existing file.
                          </p>
                        )}

                    </div>

                    <label className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition  hover:bg-[#123B5D] hover:text-white dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-[#123B5D]">

                      <Upload className="h-4 w-4" />

                      {selectedFile
                        ? 'Change PDF'
                        : 'Choose PDF'}

                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                    </label>

                  </div>

                </div>

              </div>

              {/* OPTIONS */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">

                <label
                  className={`group flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition-colors duration-200 ${
                    formData.is_required
                      ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">

                      <ClipboardList className="h-5 w-5" />

                    </div>

                    <div>

                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Required
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Applicant must submit this requirement
                      </p>

                    </div>

                  </div>

                  <input
                    type="checkbox"
                    name="is_required"
                    checked={formData.is_required}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />

                </label>

                <label
                  className={`group flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition-colors duration-200 ${
                    formData.is_active
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">

                      <CheckCircle className="h-5 w-5" />

                    </div>

                    <div>

                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Active
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Make this requirement available
                      </p>

                    </div>

                  </div>

                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />

                </label>

              </div>

            </div>

            {/* FORM BUTTONS */}

            <div className="mt-7 flex flex-col gap-3 border-t border-gray-200 pt-6 dark:border-gray-700 sm:flex-row">

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 font-semibold text-white shadow-md transition-colors duration-200  hover:bg-[#0F3553] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />

                    {editingId
                      ? 'Update Requirement'
                      : 'Save Requirement'}
                  </>
                )}

              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >

                <X className="h-4 w-4" />

                Cancel

              </button>

            </div>

          </form>

        </section>
      )}

      {/* =====================================================
          REQUIREMENTS LIST
      ====================================================== */}

      {requirements.length === 0 ? (

        <section className="ep-card rounded-2xl p-10 text-center sm:p-12">

          <div className="animate-float mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300">

            <FileText className="h-8 w-8" />

          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
            No Admission Requirements
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
            There are currently no admission requirements.
            Add a requirement to get started.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 font-semibold text-white shadow-md transition-colors duration-200  hover:bg-[#0F3553]"
          >

            <Plus className="h-4 w-4" />

            Add Requirement

          </button>

        </section>

      ) : (

        <section className="ep-card overflow-hidden rounded-2xl">

          {/* LIST HEADER */}

          <div className="border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">

                  <ClipboardList className="h-5 w-5" />

                </div>

                <div>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Requirement List
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Review and manage admission requirements.
                  </p>

                </div>

              </div>

              <div className="flex flex-wrap items-center gap-2">

                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">

                  <FileText className="h-3.5 w-3.5" />

                  {requirements.length} Total

                </span>

                {assignedCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">

                    <GraduationCap className="h-3.5 w-3.5" />

                    {assignedCount} Assigned

                  </span>
                )}

                {inactiveCount > 0 && (
                  <span className="hidden items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400 sm:inline-flex">

                    <MoreHorizontal className="h-3.5 w-3.5" />

                    {inactiveCount} Inactive

                  </span>
                )}

              </div>

            </div>

          </div>

          {/* LIST ITEMS */}

          <div className="divide-y divide-gray-100 dark:divide-gray-800">

            {requirements.map(
              (requirement) => {

                const assignedPrograms =
                  Array.isArray(
                    requirement.academic_programs
                  )
                    ? requirement.academic_programs
                    : [];

                return (
                  <div
                    key={requirement.id}
                    className="group p-5 transition-colors duration-200 hover:bg-gray-50/70 dark:hover:bg-gray-800/30 sm:p-6"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      <div className="flex min-w-0 gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#123B5D] transition-transform duration-200  dark:bg-blue-950/50 dark:text-blue-300">

                          <FileText className="h-5 w-5" />

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="break-words text-lg font-bold text-gray-900 dark:text-white">
                              {requirement.name}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                requirement.is_active
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                            >

                              {requirement.is_active ? (
                                <CheckCircle className="h-3.5 w-3.5" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}

                              {requirement.is_active
                                ? 'Active'
                                : 'Inactive'}

                            </span>

                            {requirement.is_required && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">

                                <ClipboardList className="h-3.5 w-3.5" />

                                Required

                              </span>
                            )}

                          </div>

                          {requirement.description ? (

                            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                              {requirement.description}
                            </p>

                          ) : (

                            <p className="mt-3 text-sm italic text-gray-400 dark:text-gray-500">
                              No description provided.
                            </p>

                          )}

                          {/* PROGRAM ASSIGNMENTS */}

                          <div className="mt-4">

                            <div className="mb-2 flex items-center gap-2">

                              <GraduationCap className="h-4 w-4 text-[#0F766E]" />

                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Applicable Programs
                              </span>

                            </div>

                            {assignedPrograms.length > 0 ? (

                              <div className="flex flex-wrap gap-2">

                                {assignedPrograms.map(
                                  (program) => (
                                    <span
                                      key={program.id}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-100 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-300"
                                    >

                                      <Check className="h-3 w-3" />

                                      <span>
                                        {program.name}
                                      </span>

                                      {program.code && (
                                        <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:bg-black/10">
                                          {program.code}
                                        </span>
                                      )}

                                    </span>
                                  )
                                )}

                              </div>

                            ) : (

                              <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">

                                <MoreHorizontal className="h-3.5 w-3.5" />

                                No specific program assigned

                              </div>

                            )}

                          </div>

                          {/* DOWNLOADABLE FILE */}

                          {requirement.file_path ? (

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">

                              <div className="inline-flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-300">

                                <FileText className="h-4 w-4" />

                                PDF Form Attached

                              </div>

                              <a
                                href={getFileUrl(
                                  requirement.file_path
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200  hover:bg-[#0F3553]"
                              >

                                <Download className="h-4 w-4" />

                                Download Form

                              </a>

                            </div>

                          ) : (

                            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">

                              <FileText className="h-4 w-4" />

                              No downloadable form attached

                            </div>

                          )}

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 pt-4 lg:border-0 lg:pt-0">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(requirement)
                          }
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors duration-200  hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-teal-700 dark:hover:bg-teal-950/30 dark:hover:text-teal-300 sm:flex-none"
                        >

                          <Pencil className="h-4 w-4" />

                          Edit

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              requirement.id
                            )
                          }
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors duration-200  hover:bg-red-600 hover:text-white dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white sm:flex-none"
                        >

                          <Trash2 className="h-4 w-4" />

                          Delete

                        </button>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>

      )}

    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

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

        <div className="min-w-0">

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
          className={`shrink-0 rounded-xl p-3 ${iconClass}`}
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

const RequirementsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <Requirements confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default RequirementsWrapper;