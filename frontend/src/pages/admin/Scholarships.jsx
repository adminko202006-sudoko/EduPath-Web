import { useEffect, useState } from 'react';

import { useConfirmDialog, ConfirmDialogHost } from '../../components/ui/ConfirmDialog';

import {
  Award,
  Plus,
  X,
  Trash2,
  Pencil,
  CalendarDays,
  PhilippinePeso,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Loader2,
  ShieldCheck,
  Building2,
  Target,
  Users,
  ClipboardCheck,
  Gift,
  ExternalLink,
  Save,
  Layers3,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const emptyForm = {
  name: '',
  provider: '',
  program_type: '',
  description: '',
  objectives: '',
  goals: '',
  target_beneficiaries: '',
  eligibility: '',
  requirements: '',
  amount: '',
  benefits: '',
  covered_expenses: '',
  application_start: '',
  application_end: '',
  available_slots: '',
  renewal_requirements: '',
  official_reference: '',
  is_active: true,
};

const Scholarships = ({ confirm }) => {
  const { token } = useAuth();

  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadScholarships = async (showRefresh = false) => {
    try {
      setError('');

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get('/admin/scholarships', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setScholarships(
        Array.isArray(data) ? data : data.data || []
      );
    } catch (err) {
      console.error('Failed to load scholarships:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load scholarships.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadScholarships();
    }
  }, [token]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreateForm = () => {
    resetForm();
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const openEditForm = (scholarship) => {
    setError('');
    setSuccess('');

    setEditingId(scholarship.id);

    setForm({
      name: scholarship.name || '',
      provider: scholarship.provider || '',
      program_type: scholarship.program_type || '',
      description: scholarship.description || '',
      objectives: scholarship.objectives || '',
      goals: scholarship.goals || '',
      target_beneficiaries:
        scholarship.target_beneficiaries || '',
      eligibility: scholarship.eligibility || '',
      requirements: scholarship.requirements || '',
      amount:
        scholarship.amount !== null &&
        scholarship.amount !== undefined
          ? scholarship.amount
          : '',
      benefits: scholarship.benefits || '',
      covered_expenses:
        scholarship.covered_expenses || '',
      application_start: formatDateForInput(
        scholarship.application_start
      ),
      application_end: formatDateForInput(
        scholarship.application_end
      ),
      available_slots:
        scholarship.available_slots !== null &&
        scholarship.available_slots !== undefined
          ? scholarship.available_slots
          : '',
      renewal_requirements:
        scholarship.renewal_requirements || '',
      official_reference:
        scholarship.official_reference || '',
      is_active:
        scholarship.is_active !== undefined
          ? Boolean(scholarship.is_active)
          : true,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        name: form.name.trim(),
        provider: form.provider.trim() || null,
        program_type: form.program_type.trim() || null,
        description: form.description.trim() || null,
        objectives: form.objectives.trim() || null,
        goals: form.goals.trim() || null,
        target_beneficiaries:
          form.target_beneficiaries.trim() || null,
        eligibility: form.eligibility.trim() || null,
        requirements: form.requirements.trim() || null,
        amount:
          form.amount !== ''
            ? Number(form.amount)
            : null,
        benefits: form.benefits.trim() || null,
        covered_expenses:
          form.covered_expenses.trim() || null,
        application_start:
          form.application_start || null,
        application_end:
          form.application_end || null,
        available_slots:
          form.available_slots !== ''
            ? Number(form.available_slots)
            : null,
        renewal_requirements:
          form.renewal_requirements.trim() || null,
        official_reference:
          form.official_reference.trim() || null,
        is_active: Boolean(form.is_active),
      };

      let response;

      if (editingId) {
        response = await api.put(
          `/admin/scholarships/${editingId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await api.post(
          '/admin/scholarships',
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setSuccess(
        response.data?.message ||
          (editingId
            ? 'Scholarship updated successfully.'
            : 'Scholarship created successfully.')
      );

      setShowForm(false);
      resetForm();

      await loadScholarships();
    } catch (err) {
      console.error(
        editingId
          ? 'Failed to update scholarship:'
          : 'Failed to create scholarship:',
        err
      );

      const validationErrors =
        err.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(
          validationErrors
        )[0];

        if (Array.isArray(firstError)) {
          setError(firstError[0]);
        } else {
          setError(
            err.response?.data?.message ||
              'Please check the scholarship information.'
          );
        }
      } else {
        setError(
          err.response?.data?.message ||
            (editingId
              ? 'Failed to update scholarship.'
              : 'Failed to create scholarship.')
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Scholarship',
      message: 'Are you sure you want to delete this scholarship?',
      confirmLabel: 'Delete',
    });

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await api.delete(`/admin/scholarships/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess('Scholarship deleted successfully.');

      await loadScholarships();
    } catch (err) {
      console.error(
        'Failed to delete scholarship:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to delete scholarship.'
      );
    }
  };

  const activeCount = scholarships.filter(
    (scholarship) => Boolean(scholarship.is_active)
  ).length;

  const inactiveCount = scholarships.filter(
    (scholarship) => !scholarship.is_active
  ).length;

  const withDeadlineCount = scholarships.filter(
    (scholarship) => scholarship.application_end
  ).length;

  const providerCount = new Set(
    scholarships
      .map((scholarship) => scholarship.provider)
      .filter(Boolean)
      .map((provider) => provider.trim().toLowerCase())
  ).size;

  const formatAmount = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      amount === ''
    ) {
      return 'Not specified';
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount)) {
      return amount;
    }

    return `₱${numericAmount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) {
      return 'Not specified';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateForInput = (date) => {
    if (!date) {
      return '';
    }

    if (
      typeof date === 'string' &&
      /^\d{4}-\d{2}-\d{2}/.test(date)
    ) {
      return date.substring(0, 10);
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    const year = parsedDate.getFullYear();
    const month = String(
      parsedDate.getMonth() + 1
    ).padStart(2, '0');
    const day = String(
      parsedDate.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    return deadlineDate < today;
  };

  const isApplicationOpen = (scholarship) => {
    if (!scholarship.is_active) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = scholarship.application_start
      ? new Date(scholarship.application_start)
      : null;

    const end = scholarship.application_end
      ? new Date(scholarship.application_end)
      : null;

    if (start) {
      start.setHours(0, 0, 0, 0);
    }

    if (end) {
      end.setHours(0, 0, 0, 0);
    }

    if (start && today < start) {
      return false;
    }

    if (end && today > end) {
      return false;
    }

    return true;
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8 page-transition">
        <div className="relative overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-800 p-6 sm:p-8 animate-pulse">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-300 dark:bg-gray-700 shrink-0" />

              <div className="space-y-3">
                <div className="h-3 w-32 rounded bg-gray-300 dark:bg-gray-700" />
                <div className="h-8 w-64 rounded-lg bg-gray-300 dark:bg-gray-700" />
                <div className="h-4 w-80 max-w-full rounded bg-gray-300 dark:bg-gray-700" />
              </div>
            </div>

            <div className="h-11 w-40 rounded-xl bg-gray-300 dark:bg-gray-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="ep-card rounded-2xl p-5 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-8 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-700" />
              </div>

              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 mt-5" />
            </div>
          ))}
        </div>

        <div className="ep-card rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-2">
                <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-64 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />

                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-44 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>

                  <div className="h-7 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="space-y-2 mt-5">
                  <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800" />
                  <div className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          <Loader2
            size={28}
            className="text-[#123B5D] dark:text-blue-400 animate-spin mb-3"
          />

          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Loading scholarships...
          </p>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 page-transition">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl ep-brand-gradient shadow-lg animate-fade-up">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-12 w-52 h-52 rounded-full bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <Award
                  size={28}
                  className="text-[#F4B400]"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-xs font-semibold mb-2">
                  <ShieldCheck size={13} />
                  Scholarship Management
                </div>

                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  Scholarships
                </h1>

                <p className="text-blue-100 text-sm mt-1">
                  Create and manage scholarship opportunities
                  available to Trinidad Municipal College applicants.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loadScholarships(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 disabled:opacity-60 transition-colors"
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing ? 'animate-spin' : ''
                  }
                />

                {refreshing
                  ? 'Refreshing...'
                  : 'Refresh'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (showForm) {
                    closeForm();
                  } else {
                    openCreateForm();
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#123B5D] font-semibold hover:bg-blue-50 transition-colors shadow-sm"
              >
                {showForm ? (
                  <>
                    <X size={18} />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Scholarship
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="relative px-6 lg:px-8 py-3.5 bg-black/10 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Award size={15} />
              {scholarships.length}{' '}
              {scholarships.length === 1
                ? 'scholarship'
                : 'scholarships'}{' '}
              managed
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle size={15} />
              {activeCount} active opportunities
            </div>

            <div className="flex items-center gap-2">
              <Building2 size={15} />
              {providerCount} providers
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 animate-fade-up">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-red-600 dark:text-red-400 mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">
                Something went wrong
              </p>

              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-4 animate-fade-up">
          <div className="flex items-start gap-3">
            <CheckCircle
              size={20}
              className="text-green-600 dark:text-green-400 mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">
                Success
              </p>

              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {success}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Award}
          label="Total Scholarships"
          value={scholarships.length}
          description="All scholarship opportunities"
          iconClass="bg-blue-50 text-[#123B5D] dark:bg-blue-500/10 dark:text-blue-400"
          barClass="from-[#123B5D] to-[#2563EB]"
        />

        <StatCard
          icon={CheckCircle}
          label="Active"
          value={activeCount}
          description="Currently available"
          iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          barClass="from-green-500 to-emerald-400"
        />

        <StatCard
          icon={XCircle}
          label="Inactive"
          value={inactiveCount}
          description="Not currently available"
          iconClass="bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          barClass="from-gray-400 to-gray-300"
        />

        <StatCard
          icon={CalendarDays}
          label="With Deadlines"
          value={withDeadlineCount}
          description="Scholarships with deadlines"
          iconClass="bg-yellow-50 text-[#C99A00] dark:bg-yellow-500/10 dark:text-yellow-400"
          barClass="from-yellow-500 to-amber-400"
        />
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="ep-card rounded-2xl overflow-hidden animate-scale-in">

          <div className="ep-brand-gradient px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                {editingId ? (
                  <Pencil
                    size={20}
                    className="text-[#F4B400]"
                  />
                ) : (
                  <Sparkles
                    size={20}
                    className="text-[#F4B400]"
                  />
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingId
                    ? 'Edit Scholarship'
                    : 'Create Scholarship'}
                </h2>

                <p className="text-sm text-blue-100 mt-0.5">
                  {editingId
                    ? 'Update scholarship information and availability.'
                    : 'Add a complete scholarship opportunity for applicants.'}
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-8"
          >

            {/* Basic Information */}
            <FormSection
              icon={Layers3}
              title="Basic Information"
              description="General information about the scholarship program."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput
                  label="Scholarship Name"
                  value={form.name}
                  onChange={(value) =>
                    updateField('name', value)
                  }
                  placeholder="e.g. Tertiary Education Subsidy"
                  required
                />

                <FormInput
                  label="Provider / Agency"
                  value={form.provider}
                  onChange={(value) =>
                    updateField('provider', value)
                  }
                  placeholder="e.g. UniFAST / CHED"
                  icon={Building2}
                />
              </div>

              <FormInput
                label="Program Type"
                value={form.program_type}
                onChange={(value) =>
                  updateField('program_type', value)
                }
                placeholder="e.g. Government Financial Assistance"
              />

              <FormTextarea
                label="Description"
                value={form.description}
                onChange={(value) =>
                  updateField('description', value)
                }
                placeholder="Describe the scholarship program."
                rows={4}
              />
            </FormSection>

            {/* Program Purpose */}
            <FormSection
              icon={Target}
              title="Program Purpose"
              description="Explain why the scholarship exists and who it is intended to support."
            >
              <FormTextarea
                label="Objectives"
                value={form.objectives}
                onChange={(value) =>
                  updateField('objectives', value)
                }
                placeholder="What are the main objectives of this scholarship?"
                rows={4}
              />

              <FormTextarea
                label="Goals"
                value={form.goals}
                onChange={(value) =>
                  updateField('goals', value)
                }
                placeholder="What goals does this scholarship program aim to achieve?"
                rows={4}
              />

              <FormTextarea
                label="Target Beneficiaries"
                value={form.target_beneficiaries}
                onChange={(value) =>
                  updateField(
                    'target_beneficiaries',
                    value
                  )
                }
                placeholder="Who are the intended beneficiaries?"
                rows={4}
              />
            </FormSection>

            {/* Eligibility */}
            <FormSection
              icon={ClipboardCheck}
              title="Eligibility & Requirements"
              description="Define who can apply and what documents or conditions are required."
            >
              <FormTextarea
                label="Eligibility"
                value={form.eligibility}
                onChange={(value) =>
                  updateField('eligibility', value)
                }
                placeholder="Enter eligibility conditions."
                rows={5}
              />

              <FormTextarea
                label="Requirements"
                value={form.requirements}
                onChange={(value) =>
                  updateField('requirements', value)
                }
                placeholder="List the documents and requirements applicants must provide."
                rows={5}
              />
            </FormSection>

            {/* Benefits */}
            <FormSection
              icon={Gift}
              title="Benefits & Financial Assistance"
              description="Describe the financial support and expenses covered by the program."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput
                  label="Financial Amount"
                  value={form.amount}
                  onChange={(value) =>
                    updateField('amount', value)
                  }
                  placeholder="e.g. 20000"
                  type="number"
                  min="0"
                  step="0.01"
                  icon={PhilippinePeso}
                />

                <FormInput
                  label="Available Slots"
                  value={form.available_slots}
                  onChange={(value) =>
                    updateField(
                      'available_slots',
                      value
                    )
                  }
                  placeholder="e.g. 50"
                  type="number"
                  min="0"
                  step="1"
                  icon={Users}
                />
              </div>

              <FormTextarea
                label="Benefits"
                value={form.benefits}
                onChange={(value) =>
                  updateField('benefits', value)
                }
                placeholder="Describe what the applicant receives from the scholarship."
                rows={4}
              />

              <FormTextarea
                label="Covered Expenses"
                value={form.covered_expenses}
                onChange={(value) =>
                  updateField(
                    'covered_expenses',
                    value
                  )
                }
                placeholder="Describe the expenses covered by the scholarship."
                rows={4}
              />
            </FormSection>

            {/* Application Details */}
            <FormSection
              icon={CalendarDays}
              title="Application Details"
              description="Set the application period and renewal conditions."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput
                  label="Application Start"
                  value={form.application_start}
                  onChange={(value) =>
                    updateField(
                      'application_start',
                      value
                    )
                  }
                  type="date"
                  icon={CalendarDays}
                />

                <FormInput
                  label="Application End"
                  value={form.application_end}
                  onChange={(value) =>
                    updateField(
                      'application_end',
                      value
                    )
                  }
                  type="date"
                  icon={CalendarDays}
                />
              </div>

              <FormTextarea
                label="Renewal Requirements"
                value={form.renewal_requirements}
                onChange={(value) =>
                  updateField(
                    'renewal_requirements',
                    value
                  )
                }
                placeholder="Describe the requirements for renewing the scholarship."
                rows={4}
              />
            </FormSection>

            {/* Reference */}
            <FormSection
              icon={ExternalLink}
              title="Official Reference"
              description="Provide the official website or reference for this scholarship."
            >
              <FormInput
                label="Official Reference URL"
                value={form.official_reference}
                onChange={(value) =>
                  updateField(
                    'official_reference',
                    value
                  )
                }
                placeholder="https://example.gov.ph/"
                type="url"
                icon={ExternalLink}
              />
            </FormSection>

            {/* Status */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/70 dark:bg-gray-800/50">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    Scholarship Status
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Make this scholarship available to applicants.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      'is_active',
                      !form.is_active
                    )
                  }
                  className={`relative w-12 h-7 rounded-full transition ${
                    form.is_active
                      ? 'bg-[#123B5D]'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label="Toggle scholarship status"
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition ${
                      form.is_active
                        ? 'left-6'
                        : 'left-1'
                    }`}
                  />
                </button>
              </label>

              <div className="mt-3 flex items-center gap-2">
                {form.is_active ? (
                  <>
                    <CheckCircle
                      size={16}
                      className="text-green-600 dark:text-green-400"
                    />

                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Active
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle
                      size={16}
                      className="text-gray-500"
                    />

                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Inactive
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />
                    {editingId
                      ? 'Updating...'
                      : 'Creating...'}
                  </>
                ) : (
                  <>
                    {editingId ? (
                      <Save size={18} />
                    ) : (
                      <Plus size={18} />
                    )}

                    {editingId
                      ? 'Save Changes'
                      : 'Create Scholarship'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scholarship List */}
      <div className="ep-card rounded-2xl overflow-hidden animate-fade-up">

        <div className="relative overflow-hidden ep-brand-gradient">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-20 -left-12 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <Award
                    size={20}
                    className="text-white"
                  />
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    Available Scholarships
                  </h2>

                  <p className="text-xs text-blue-100 mt-0.5">
                    Manage scholarship opportunities offered by the college and partner providers.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-blue-100 text-xs font-semibold">
                <FileText size={13} />

                {scholarships.length}{' '}

                {scholarships.length === 1
                  ? 'Scholarship'
                  : 'Scholarships'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {scholarships.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-float">
                <Award
                  size={30}
                  className="text-gray-400"
                />
              </div>

              <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
                No Scholarships Found
              </h2>

              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                There are currently no scholarships available.
                Create your first scholarship to make an opportunity
                available to applicants.
              </p>

              {!showForm && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 mt-6 bg-[#123B5D] hover:bg-[#0F3553] text-white px-5 py-3 rounded-xl font-semibold transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  Add Scholarship
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {scholarships.map((scholarship) => {
                const deadlinePassed =
                  isDeadlinePassed(
                    scholarship.application_end
                  );

                const applicationOpen =
                  isApplicationOpen(scholarship);

                return (
                  <div
                    key={scholarship.id}
                    className="group rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/30 hover:border-[#123B5D]/20 dark:hover:border-blue-400/20 hover:shadow-md transition-colors overflow-hidden ep-hover-lift"
                  >

                    {/* Card Header */}
                    <div className="px-6 pt-6">
                      <div className="flex items-start justify-between gap-4">

                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-11 h-11 shrink-0 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center">
                            <Award
                              size={22}
                              className="text-[#123B5D] dark:text-blue-400"
                            />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-lg font-bold text-[#123B5D] dark:text-white break-words">
                              {scholarship.name ||
                                'Scholarship'}
                            </h3>

                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Scholarship #{scholarship.id}
                            </p>

                            {scholarship.provider && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                <Building2 size={13} />
                                {scholarship.provider}
                              </div>
                            )}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            scholarship.is_active
                              ? 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                              : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                          }`}
                        >
                          {scholarship.is_active ? (
                            <CheckCircle size={13} />
                          ) : (
                            <XCircle size={13} />
                          )}

                          {scholarship.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-6 py-5">

                      {scholarship.program_type && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#123B5D] dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 text-xs font-semibold mb-4">
                          <Layers3 size={13} />
                          {scholarship.program_type}
                        </div>
                      )}

                      {scholarship.description ? (
                        <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                          {scholarship.description}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                          No description provided.
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">

                        <InfoBox
                          icon={PhilippinePeso}
                          label="Financial Assistance"
                          value={formatAmount(
                            scholarship.amount
                          )}
                        />

                        <InfoBox
                          icon={Users}
                          label="Available Slots"
                          value={
                            scholarship.available_slots !==
                              null &&
                            scholarship.available_slots !==
                              undefined
                              ? scholarship.available_slots
                              : 'Not specified'
                          }
                        />

                        <InfoBox
                          icon={CalendarDays}
                          label="Application Start"
                          value={formatDate(
                            scholarship.application_start
                          )}
                        />

                        <InfoBox
                          icon={CalendarDays}
                          label="Application End"
                          value={formatDate(
                            scholarship.application_end
                          )}
                        />
                      </div>

                      {/* Application Status */}
                      <div className="mt-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                        <div className="flex items-center justify-between gap-3">

                          <div className="flex items-center gap-2">
                            <Clock
                              size={16}
                              className="text-gray-500 dark:text-gray-400"
                            />

                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Application Status
                            </span>
                          </div>

                          {applicationOpen ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                              <CheckCircle size={13} />
                              Open
                            </span>
                          ) : scholarship.is_active &&
                            deadlinePassed ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                              <XCircle size={13} />
                              Closed
                            </span>
                          ) : scholarship.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                              <Clock size={13} />
                              Not Yet Open
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                              <XCircle size={13} />
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Additional Information */}
                      {(scholarship.objectives ||
                        scholarship.benefits ||
                        scholarship.covered_expenses ||
                        scholarship.eligibility) && (
                        <div className="mt-5 space-y-4">

                          {scholarship.objectives && (
                            <DetailBlock
                              icon={Target}
                              title="Objectives"
                              value={scholarship.objectives}
                            />
                          )}

                          {scholarship.benefits && (
                            <DetailBlock
                              icon={Gift}
                              title="Benefits"
                              value={scholarship.benefits}
                            />
                          )}

                          {scholarship.covered_expenses && (
                            <DetailBlock
                              icon={PhilippinePeso}
                              title="Covered Expenses"
                              value={
                                scholarship.covered_expenses
                              }
                            />
                          )}

                          {scholarship.eligibility && (
                            <DetailBlock
                              icon={ClipboardCheck}
                              title="Eligibility"
                              value={
                                scholarship.eligibility
                              }
                            />
                          )}
                        </div>
                      )}

                      {scholarship.official_reference && (
                        <a
                          href={
                            scholarship.official_reference
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-[#123B5D] dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink size={15} />
                          View Official Reference
                        </a>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {scholarship.is_active
                          ? 'Visible to applicants'
                          : 'Not currently available'}
                      </div>

                      <div className="flex items-center gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(scholarship)
                          }
                          className="inline-flex items-center gap-2 text-[#123B5D] dark:text-blue-400 hover:text-white hover:bg-[#123B5D] dark:hover:bg-blue-600 border border-blue-200 dark:border-blue-500/20 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              scholarship.id
                            )
                          }
                          className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-500/20 hover:border-red-600 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Form Components                                                            */
/* -------------------------------------------------------------------------- */

const FormSection = ({
  icon: Icon,
  title,
  description,
  children,
}) => {
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
          <Icon
            size={19}
            className="text-[#123B5D] dark:text-blue-400"
          />
        </div>

        <div>
          <h3 className="text-base font-bold text-[#123B5D] dark:text-white">
            {title}
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 p-5 space-y-5">
        {children}
      </div>
    </section>
  );
};

const FormInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  min,
  step,
  icon: Icon,
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {label}

        {required && (
          <span className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}

        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          required={required}
          min={min}
          step={step}
          className={`w-full border border-gray-200 dark:border-gray-700 rounded-xl ${
            Icon ? 'pl-11' : 'px-4'
          } pr-4 py-3 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] dark:focus:border-blue-500 transition-colors`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

const FormTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {label}

        {required && (
          <span className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        rows={rows}
        required={required}
        className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] dark:focus:border-blue-500 transition-colors resize-none"
        placeholder={placeholder}
      />
    </div>
  );
};

const InfoBox = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
        <Icon size={16} />

        <span className="text-xs font-medium">
          {label}
        </span>
      </div>

      <p className="text-sm font-bold text-[#123B5D] dark:text-white break-words">
        {value}
      </p>
    </div>
  );
};

const DetailBlock = ({
  icon: Icon,
  title,
  value,
}) => {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon
          size={15}
          className="text-[#123B5D] dark:text-blue-400"
        />

        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
          {title}
        </span>
      </div>

      <p className="text-sm leading-6 text-gray-600 dark:text-gray-400 whitespace-pre-line">
        {value}
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Reusable Stat Card                                                         */
/* -------------------------------------------------------------------------- */

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  barClass,
}) => {
  return (
    <div className="ep-card ep-hover-lift rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="text-3xl font-extrabold text-[#123B5D] dark:text-white mt-2">
            {value}
          </p>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {description}
          </p>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-5 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={`h-full w-2/3 rounded-full bg-gradient-to-r ${barClass}`}
        />
      </div>
    </div>
  );
};

const ScholarshipsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <Scholarships confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default ScholarshipsWrapper;