import { useEffect, useState } from 'react';

import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  PhilippinePeso,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Scholarships = () => {
  const { token } = useAuth();

  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [applyingId, setApplyingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [appliedScholarships, setAppliedScholarships] = useState([]);

  useEffect(() => {
    const loadScholarships = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/applicant/scholarships', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;

        setScholarships(
          Array.isArray(data) ? data : data?.data || []
        );
      } catch (error) {
        console.error('Failed to load scholarships:', error);

        setError(
          error.response?.data?.message ||
            'Failed to load available scholarships.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadScholarships();
    }
  }, [token]);

  const formatAmount = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      amount === ''
    ) {
      return 'Amount not specified';
    }

    return `₱${Number(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) {
      return 'Not specified';
    }

    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isApplicationOpen = (scholarship) => {
    const today = new Date();

    const start = scholarship.application_start
      ? new Date(scholarship.application_start)
      : null;

    const end = scholarship.application_end
      ? new Date(scholarship.application_end)
      : null;

    if (start && today < start) {
      return false;
    }

    if (end && today > end) {
      return false;
    }

    return true;
  };

  const hasApplied = (scholarshipId) => {
    return appliedScholarships.includes(scholarshipId);
  };

  const applyForScholarship = async (scholarship) => {
    if (!token || !scholarship?.id) {
      return;
    }

    if (!isApplicationOpen(scholarship)) {
      return;
    }

    if (hasApplied(scholarship.id)) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to apply for "${scholarship.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setApplyingId(scholarship.id);
      setError('');
      setSuccessMessage('');

      await api.post(
        `/applicant/scholarships/${scholarship.id}/apply`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAppliedScholarships((previous) => [
        ...previous,
        scholarship.id,
      ]);

      setSuccessMessage(
        `Your application for "${scholarship.name}" has been submitted successfully.`
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      console.error('Failed to apply for scholarship:', error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Unable to submit your scholarship application. Please try again.';

      setError(message);
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#123B5D]/10">
            <Loader2
              size={28}
              className="animate-spin text-[#123B5D]"
            />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading scholarships...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition min-h-screen bg-[#f4f7fa] px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Hero */}
        <section className="ep-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="ep-brand-gradient p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Award size={30} />
              </div>

              <div>
                <p className="text-sm text-white/75">
                  Applicant Portal
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Scholarships
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-white/80">
                  Explore scholarship opportunities available at
                  Trinidad Municipal College and apply for programs
                  that match your eligibility.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Success Message */}
        {successMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-semibold">
                Application Submitted
              </p>

              <p className="mt-1">
                {successMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="rounded-lg p-1 transition hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
              aria-label="Close success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-semibold">
                Unable to complete request
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError('')}
              className="rounded-lg p-1 transition hover:bg-red-100 dark:hover:bg-red-500/20"
              aria-label="Close error message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && scholarships.length === 0 && (
          <div className="ep-card rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Award
              size={50}
              className="mx-auto text-slate-300 dark:text-slate-700"
            />

            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              No Scholarships Available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              There are currently no active scholarship programs
              available.
            </p>
          </div>
        )}

        {/* Scholarship Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {scholarships.map((scholarship, index) => {
            const applicationOpen =
              isApplicationOpen(scholarship);

            const alreadyApplied = hasApplied(scholarship.id);

            const isApplying =
              applyingId === scholarship.id;

            return (
              <article
                key={scholarship.id}
                className="ep-card ep-hover-lift animate-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                style={{
                  animationDelay: `${index * 60}ms`,
                }}
              >
                {/* Card Header */}
                <div className="ep-brand-gradient px-6 py-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <Award
                          size={20}
                          className="text-[#F4B400]"
                        />

                        <span className="text-sm text-blue-100">
                          TMC Scholarship Program
                        </span>
                      </div>

                      <h2 className="text-xl font-bold">
                        {scholarship.name}
                      </h2>

                      {scholarship.provider && (
                        <p className="mt-1 text-sm text-white/70">
                          {scholarship.provider}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        alreadyApplied
                          ? 'bg-blue-500 text-white'
                          : applicationOpen
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-500 text-white'
                      }`}
                    >
                      {alreadyApplied
                        ? 'Applied'
                        : applicationOpen
                          ? 'Open'
                          : 'Closed'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">

                  {/* Amount */}
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-500/10">
                      <PhilippinePeso
                        size={20}
                        className="text-[#D9A900] dark:text-yellow-300"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Scholarship Amount
                      </p>

                      <p className="font-bold text-[#123B5D] dark:text-blue-300">
                        {formatAmount(scholarship.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {scholarship.description && (
                    <div className="mb-5">
                      <h3 className="mb-2 font-semibold text-slate-800 dark:text-white">
                        About this Scholarship
                      </h3>

                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {scholarship.description}
                      </p>
                    </div>
                  )}

                  {/* Application Period */}
                  <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="mb-3 flex items-center gap-2">
                      <Calendar
                        size={18}
                        className="text-[#123B5D] dark:text-blue-300"
                      />

                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        Application Period
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">
                          Start Date
                        </p>

                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {formatDate(
                            scholarship.application_start
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400">
                          End Date
                        </p>

                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {formatDate(
                            scholarship.application_end
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Eligibility */}
                  {scholarship.eligibility && (
                    <div className="mb-5">
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle
                          size={18}
                          className="text-emerald-600 dark:text-emerald-400"
                        />

                        <h3 className="font-semibold text-slate-800 dark:text-white">
                          Eligibility
                        </h3>
                      </div>

                      <p className="whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {scholarship.eligibility}
                      </p>
                    </div>
                  )}

                  {/* Requirements */}
                  {scholarship.requirements && (
                    <div className="mb-6">
                      <div className="mb-2 flex items-center gap-2">
                        <FileText
                          size={18}
                          className="text-[#123B5D] dark:text-blue-300"
                        />

                        <h3 className="font-semibold text-slate-800 dark:text-white">
                          Requirements
                        </h3>
                      </div>

                      <p className="whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {scholarship.requirements}
                      </p>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className="mb-6 grid gap-3 sm:grid-cols-2">
                    {scholarship.available_slots !== null &&
                      scholarship.available_slots !== undefined && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Available Slots
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                            {scholarship.available_slots}
                          </p>
                        </div>
                      )}

                    {scholarship.program_type && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Program Type
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                          {scholarship.program_type}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Apply Button */}
                  <button
                    type="button"
                    onClick={() =>
                      applyForScholarship(scholarship)
                    }
                    disabled={
                      !applicationOpen ||
                      alreadyApplied ||
                      isApplying
                    }
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition ${
                      alreadyApplied
                        ? 'cursor-not-allowed bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                        : applicationOpen
                          ? 'bg-[#D9A900] text-white hover:bg-[#b88f00] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60'
                          : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                  >
                    {isApplying ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Submitting Application...
                      </>
                    ) : alreadyApplied ? (
                      <>
                        <CheckCircle size={18} />
                        Already Applied
                      </>
                    ) : applicationOpen ? (
                      <>
                        <Award size={18} />
                        Apply for Scholarship
                      </>
                    ) : (
                      <>
                        <Clock size={18} />
                        Applications Closed
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Information */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="flex items-start gap-3">
            <Clock
              size={20}
              className="mt-0.5 shrink-0 text-[#123B5D] dark:text-blue-300"
            />

            <div>
              <h3 className="font-semibold text-[#123B5D] dark:text-blue-300">
                Scholarship Application
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Make sure you meet the eligibility requirements
                and prepare all required documents before applying.
                You can monitor the status of your scholarship
                application through your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scholarships;

