import ErrorMessage from '../../components/ui/ErrorMessage';
import { useEffect, useRef, useState } from 'react';

import { ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../components/ui/useConfirmDialog';
import ModalPortal from '../../components/ui/ModalPortal';

import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useAuth } from '../../context/useAuth';
import {
  Plus,
  BookOpen,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  GraduationCap,
  Search,
  X,
  Save,
  Power,
  RefreshCw,
  Users,
  Info,
} from 'lucide-react';

const Programs = ({ confirm }) => {
  const { token } = useAuth();

  const [programs, setPrograms] = useState([]);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [editingProgram, setEditingProgram] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const submittingRef = useRef(false);

  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);

  const [search, setSearch] = useState('');

  // ==========================================
  // FETCH PROGRAMS
  // ==========================================

  const fetchPrograms = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get('/admin/programs');

      setPrograms(response.data.data || []);
    } catch (err) {
      console.error('Failed to load academic programs:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load academic programs.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useAutoRefresh(async () => {
    await fetchPrograms(true);
  });

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    if (token) {
      queueMicrotask(() => {
        fetchPrograms();
      });
    }
  }, [token]);

  // ==========================================
  // EDIT PROGRAM
  // ==========================================

  const handleEdit = (program) => {
    if (submittingRef.current) return;
    setEditingProgram(program);
    setEditMode(true);

    setName(program.name || '');
    setCode(program.code || '');
    setDescription(program.description || '');

    setError('');
    setMessage('');

    setFormError('');
    setShowForm(true);
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {
    if (submittingRef.current) return;
    setShowForm(false);
    setFormError('');
    setEditingProgram(null);
    setEditMode(false);

    setName('');
    setCode('');
    setDescription('');

    setError('');
    setMessage('');
  };

  // ==========================================
  // SUBMIT PROGRAM
  // ==========================================


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    setFormError('');
    setMessage('');
    setAdding(true);

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        is_active: editMode && editingProgram
          ? editingProgram.is_active
          : true,
      };

      if (editMode && editingProgram) {
        await api.put(
          `/admin/programs/${editingProgram.id}`,
          payload
        );
      } else {
        await api.post('/admin/programs', payload);
      }

      setMessage(
        editMode
          ? 'Academic program updated successfully.'
          : 'Academic program added successfully.'
      );

      setName('');
      setCode('');
      setDescription('');
      setEditingProgram(null);
      setEditMode(false);
      setShowForm(false);

      await fetchPrograms(true);
    } catch (err) {
      console.error('Failed to save academic program:', err);

      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const firstError = Object.values(validationErrors)[0]?.[0];

        setFormError(firstError || 'Please check your input.');
      } else {
        setFormError(
          err.response?.data?.message ||
            (editMode
              ? 'Failed to update academic program.'
              : 'Failed to add academic program.')
        );
      }
    } finally {
      submittingRef.current = false;
      setAdding(false);
    }
  };


  // ==========================================
  // DELETE PROGRAM
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Program',
      message: 'Are you sure you want to delete this academic program?',
      confirmLabel: 'Delete',
    });

    if (!confirmed) {
      return;
    }

    setError('');
    setMessage('');
    setDeleting(id);

    try {
      await api.delete(`/admin/programs/${id}`);

      setMessage(
        'Academic program deleted successfully.'
      );

      await fetchPrograms();
    } catch (err) {
      console.error(
        'Failed to delete academic program:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to delete academic program.'
      );
    } finally {
      setDeleting(null);
    }
  };

  // ==========================================
  // TOGGLE PROGRAM STATUS
  // ==========================================

  const handleToggleStatus = async (program) => {
    const newStatus = !program.is_active;

    const action = newStatus
      ? 'activate'
      : 'deactivate';

    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase()}${action.slice(1)} Program`,
      message: `Are you sure you want to ${action} "${program.name}"?`,
      confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
      destructive: action === 'deactivate',
    });

    if (!confirmed) {
      return;
    }

    setError('');
    setMessage('');
    setToggling(program.id);

    try {
      await api.put(
        `/admin/programs/${program.id}`,
        {
          name: program.name,
          code: program.code,
          description: program.description || '',
          is_active: newStatus,
        }
      );

      setMessage(
        newStatus
          ? 'Academic program activated successfully.'
          : 'Academic program deactivated successfully.'
      );

      await fetchPrograms(true);
    } catch (err) {
      console.error(
        `Failed to ${action} academic program:`,
        err
      );

      if (err.response?.data?.errors) {
        const validationErrors =
          err.response.data.errors;

        const firstError =
          Object.values(validationErrors)[0]?.[0];

        setError(
          firstError ||
            `Failed to ${action} academic program.`
        );
      } else {
        setError(
          err.response?.data?.message ||
            `Failed to ${action} academic program.`
        );
      }
    } finally {
      setToggling(null);
    }
  };

  // ==========================================
  // FILTER PROGRAMS
  // ==========================================

  const filteredPrograms = programs.filter(
    (program) => {
      const searchTerm =
        search.toLowerCase().trim();

      if (!searchTerm) {
        return true;
      }

      return (
        program.name
          ?.toLowerCase()
          .includes(searchTerm) ||
        program.code
          ?.toLowerCase()
          .includes(searchTerm) ||
        program.description
          ?.toLowerCase()
          .includes(searchTerm)
      );
    }
  );

  // ==========================================
  // STATISTICS
  // ==========================================

  const activePrograms =
    programs.filter(
      (program) => program.is_active
    ).length;

  const inactivePrograms =
    programs.filter(
      (program) => !program.is_active
    ).length;

  const activePercentage =
    programs.length > 0
      ? Math.min(
          Math.max(
            (activePrograms / programs.length) * 100,
            8
          ),
          100
        )
      : 0;

  const inactivePercentage =
    programs.length > 0
      ? Math.min(
          Math.max(
            (inactivePrograms / programs.length) * 100,
            8
          ),
          100
        )
      : 0;

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-8 page-transition">

      {/* ==========================================
          HERO
      ========================================== */}

      <section
        className="ep-page-banner 
          relative
          overflow-hidden
          rounded-2xl
          ep-brand-gradient
          shadow-lg
          p-6
          sm:p-8
          animate-fade-up
        "
      >
        <div
          className="
            absolute
            -right-16
            -top-16
            w-48
            h-48
            rounded-full
            bg-white/5
            animate-float
          "
        />

        <div
          className="
            absolute
            right-20
            -bottom-20
            w-40
            h-40
            rounded-full
            bg-[#F4B400]/10
          "
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>
            <div className="flex items-center gap-2 mb-3">

              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  px-3
                  py-1
                  rounded-full
                  bg-white/10
                  border
                  border-white/10
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-blue-100
                "
              >
                <GraduationCap size={13} />
                Academic Management
              </span>

            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Academic Programs
            </h1>

            <p className="text-blue-100 mt-2 max-w-2xl text-sm sm:text-base">
              Create and manage the academic programs available
              to Trinidad Municipal College applicants and staff.
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center lg:shrink-0">
          
            <button
              type="button"
              disabled={adding}
              onClick={() => { handleCancelEdit(); setShowForm(true); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4B400] px-4 py-2.5 text-sm font-semibold text-[#0B2941] shadow-sm transition-colors hover:bg-[#DFA500] disabled:opacity-60"
            >
              <Plus size={18} /> Add Academic Program
            </button>
          </div>

        </div>
      </section>

      {/* ==========================================
          MESSAGES
      ========================================== */}

      {message && (
        <div
          className="
            flex
            items-center
            gap-3
            bg-emerald-50
            dark:bg-emerald-500/10
            border
            border-emerald-200
            dark:border-emerald-500/20
            text-emerald-700
            dark:text-emerald-300
            px-5
            py-4
            rounded-2xl
            animate-fade-up
          "
        >
          <CheckCircle2
            size={20}
            className="shrink-0"
          />

          <p className="text-sm font-medium">
            {message}
          </p>
        </div>
      )}

      {error && (
        <ErrorMessage message={error}><div
          className="
            flex
            items-center
            gap-3
            bg-red-50
            dark:bg-red-500/10
            border
            border-red-200
            dark:border-red-500/20
            text-red-700
            dark:text-red-300
            px-5
            py-4
            rounded-2xl
            animate-fade-up
          "
        >
          <XCircle
            size={20}
            className="shrink-0"
          />

          <p className="text-sm font-medium">
            {error}
          </p>
        </div></ErrorMessage>
      )}

      {/* ==========================================
          PROGRAM OVERVIEW
      ========================================== */}

      <section>

        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#123B5D] dark:text-sky-300">
            Program Overview
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Current academic program status in EduPath.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          {/* TOTAL */}

          <div
            className="
              ep-card
              ep-hover-lift
              p-5
              animate-fade-up
            "
          >
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Programs
                </p>

                <p className="text-3xl font-extrabold text-[#123B5D] dark:text-gray-100 mt-2">
                  {programs.length}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Registered academic programs
                </p>
              </div>

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-blue-50
                  dark:bg-blue-500/10
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <BookOpen
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  strokeWidth={2.2}
                />
              </div>

            </div>

            <div className="mt-5 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-[#123B5D] via-[#0F766E] to-[#F4B400]" />
            </div>
          </div>

          {/* ACTIVE */}

          <div
            className="
              ep-card
              ep-hover-lift
              p-5
              animate-fade-up
            "
            style={{
              animationDelay: '45ms',
            }}
          >
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Active Programs
                </p>

                <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                  {activePrograms}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Available to applicants and staff assignment
                </p>
              </div>

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-emerald-50
                  dark:bg-emerald-500/10
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <CheckCircle2
                  className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                  strokeWidth={2.2}
                />
              </div>

            </div>

            <div className="mt-5 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: `${activePercentage}%`,
                }}
              />
            </div>
          </div>

          {/* INACTIVE */}

          <div
            className="
              ep-card
              ep-hover-lift
              p-5
              animate-fade-up
            "
            style={{
              animationDelay: '90ms',
            }}
          >
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Inactive Programs
                </p>

                <p className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-2">
                  {inactivePrograms}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Currently unavailable for new assignments
                </p>
              </div>

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-red-50
                  dark:bg-red-500/10
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <XCircle
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  strokeWidth={2.2}
                />
              </div>

            </div>

            <div className="mt-5 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500"
                style={{
                  width: `${inactivePercentage}%`,
                }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
          STAFF PROGRAM ASSIGNMENT INFORMATION
      ========================================== */}

      <section
        className="
          ep-card
          overflow-hidden
          animate-fade-up
        "
        style={{
          animationDelay: '110ms',
        }}
      >
        <div className="p-5 sm:p-6">

          <div className="flex items-start gap-4">

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-[#F4B400]/10
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Users
                size={21}
                className="text-[#D9A000]"
              />
            </div>

            <div>

              <h3 className="font-bold text-[#123B5D] dark:text-sky-300">
                Programs Served by Staff
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Academic programs are used when assigning staff
                members to the programs they serve. Staff assignments
                are managed from the Staff Management page.
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
          ADD / EDIT PROGRAM
      ========================================== */}



      {showForm && (
        <ModalPortal onEscape={handleCancelEdit}>
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4"
            onMouseDown={(event) => { if (event.target === event.currentTarget) handleCancelEdit(); }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="program-form-title"
              aria-busy={adding}
              className="ep-card animate-scale-in w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
            >
        <div
          className="
            p-6
            border-b
            border-gray-100
            dark:border-gray-800
            flex
            items-center
            gap-4
          "
        >

          <div
            className="
              w-12
              h-12
              rounded-xl
              bg-[#123B5D]/10
              dark:bg-sky-400/10
              flex
              items-center
              justify-center
            "
          >
            {editMode ? (
              <Pencil
                size={21}
                className="text-[#123B5D] dark:text-sky-300"
              />
            ) : (
              <Plus
                size={23}
                className="text-[#123B5D] dark:text-sky-300"
              />
            )}
          </div>

          <div>

            <h2 id="program-form-title" className="text-xl font-bold text-[#123B5D] dark:text-sky-300">
              {editMode
                ? 'Edit Academic Program'
                : 'Add Academic Program'}
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {editMode
                ? 'Update the selected academic program information.'
                : 'Create a new academic program for applicants and staff assignments.'}
            </p>

          </div>

          <button type="button" onClick={handleCancelEdit} disabled={adding} aria-label="Close program form" className="ml-auto self-start rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6"
        >

          {formError && <ErrorMessage message={formError}><p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{formError}</p></ErrorMessage>}
          <fieldset disabled={adding}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* PROGRAM NAME */}

            <div>
              <label htmlFor="program-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Program Name
              </label>

              <input
                type="text"
                id="program-name"
                maxLength={255}
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="e.g. Bachelor of Science in Information Technology"
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  dark:border-gray-700
                  bg-gray-50
                  dark:bg-gray-800
                  px-4
                  py-3
                  text-sm
                  text-gray-800
                  dark:text-gray-100
                  placeholder:text-gray-400
                  outline-none
                  transition
                  focus:bg-white
                  dark:focus:bg-gray-900
                  focus:border-[#123B5D]
                  focus:ring-4
                  focus:ring-[#123B5D]/10
                "
              />
            </div>

            {/* PROGRAM CODE */}

            <div>
              <label htmlFor="program-code" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Program Code
              </label>

              <input
                type="text"
                id="program-code"
                maxLength={50}
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="e.g. BSIT"
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  dark:border-gray-700
                  bg-gray-50
                  dark:bg-gray-800
                  px-4
                  py-3
                  text-sm
                  uppercase
                  text-gray-800
                  dark:text-gray-100
                  placeholder:text-gray-400
                  outline-none
                  transition
                  focus:bg-white
                  dark:focus:bg-gray-900
                  focus:border-[#123B5D]
                  focus:ring-4
                  focus:ring-[#123B5D]/10
                "
              />

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                Example: BSIT, BSOA, BEED
              </p>
            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">

              <label htmlFor="program-description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>

              <textarea
                id="program-description"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Enter a description for this academic program"
                rows="4"
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-gray-200
                  dark:border-gray-700
                  bg-gray-50
                  dark:bg-gray-800
                  px-4
                  py-3
                  text-sm
                  text-gray-800
                  dark:text-gray-100
                  placeholder:text-gray-400
                  outline-none
                  transition
                  focus:bg-white
                  dark:focus:bg-gray-900
                  focus:border-[#123B5D]
                  focus:ring-4
                  focus:ring-[#123B5D]/10
                "
              />

            </div>

          </div>

          {/* FORM ACTIONS */}

          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">

              <button
                type="button"
                onClick={handleCancelEdit}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-5
                  py-3
                  rounded-xl
                  border
                  border-gray-200
                  dark:border-gray-700
                  bg-white
                  dark:bg-gray-800
                  text-gray-600
                  dark:text-gray-300
                  text-sm
                  font-semibold
                  hover:bg-gray-50
                  dark:hover:bg-gray-700
                  transition-colors
                "
              >
                <X size={17} />
                Cancel
              </button>

            <button
              type="submit"
              disabled={adding}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                px-5
                py-3
                rounded-xl
                bg-[#123B5D]
                hover:bg-[#0F3553]
                text-white
                text-sm
                font-semibold
                shadow-sm
                hover:shadow-md
                transition-colors
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {adding ? (
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
              ) : editMode ? (
                <Save size={17} />
              ) : (
                <Plus size={17} />
              )}

              {adding
                ? editMode
                  ? 'Updating...'
                  : 'Adding...'
                : editMode
                ? 'Update Program'
                : 'Add Program'}

            </button>

          </div>

          </fieldset>
        </form>
            </section>
          </div>
        </ModalPortal>
      )}

      {/* ==========================================
          REGISTERED PROGRAMS
      ========================================== */}

      <section
        className="
          ep-card
          overflow-hidden
          animate-fade-up
        "
        style={{
          animationDelay: '180ms',
        }}
      >

        {/* LIST HEADER */}

        <div
          className="
            p-6
            border-b
            border-gray-100
            dark:border-gray-800
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-4
          "
        >

          <div className="flex items-center gap-4">

            <div
              className="
                w-12
                h-12
                rounded-xl
                bg-[#123B5D]/10
                dark:bg-sky-400/10
                flex
                items-center
                justify-center
              "
            >
              <BookOpen
                size={22}
                className="text-[#123B5D] dark:text-sky-300"
              />
            </div>

            <div>

              <h2 className="text-xl font-bold text-[#123B5D] dark:text-sky-300">
                Registered Programs
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Academic programs currently registered in EduPath.
              </p>

            </div>

          </div>

          {/* SEARCH */}

          <div className="relative w-full lg:w-80">

            <Search
              size={18}
              className="
                absolute
                left-3.5
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search programs..."
              className="
                w-full
                rounded-xl
                border
                border-gray-200
                dark:border-gray-700
                bg-gray-50
                dark:bg-gray-800
                pl-10
                pr-4
                py-3
                text-sm
                text-gray-800
                dark:text-gray-100
                placeholder:text-gray-400
                outline-none
                transition
                focus:bg-white
                dark:focus:bg-gray-900
                focus:border-[#123B5D]
                focus:ring-4
                focus:ring-[#123B5D]/10
              "
            />

          </div>

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="p-6 space-y-4">

            {Array.from({
              length: 4,
            }).map((_, index) => (
              <div
                key={index}
                className="
                  ep-card
                  p-5
                  flex
                  items-center
                  gap-4
                "
              >

                <div className="ep-skeleton w-12 h-12 rounded-xl" />

                <div className="flex-1">

                  <div className="ep-skeleton h-4 w-56 mb-2" />

                  <div className="ep-skeleton h-3 w-32" />

                </div>

                <div className="hidden md:block">
                  <div className="ep-skeleton h-8 w-20 rounded-lg" />
                </div>

              </div>
            ))}

          </div>
        ) : filteredPrograms.length === 0 ? (

          /* EMPTY */

          <div className="p-10 sm:p-14 text-center">

            <div
              className="
                w-16
                h-16
                rounded-2xl
                bg-gray-100
                dark:bg-gray-800
                flex
                items-center
                justify-center
                mx-auto
                mb-4
                animate-float
              "
            >
              <BookOpen
                size={27}
                className="text-gray-400 dark:text-gray-500"
              />
            </div>

            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              {search
                ? 'No Matching Programs'
                : 'No Academic Programs'}
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              {search
                ? 'Try using a different search term.'
                : 'Add an academic program using the form above.'}
            </p>

          </div>

        ) : (

          /* PROGRAM ROWS */

          <div className="divide-y divide-gray-100 dark:divide-gray-800">

            {filteredPrograms.map(
              (program, index) => (
                <div
                  key={program.id}
                  className="
                    group
                    p-5
                    sm:p-6
                    hover:bg-gray-50/80
                    dark:hover:bg-white/[0.025]
                    transition-colors
                    duration-200
                    animate-fade-up
                  "
                  style={{
                    animationDelay: `${
                      220 + index * 45
                    }ms`,
                  }}
                >

                  <div
                    className="
                      flex
                      flex-col
                      xl:flex-row
                      xl:items-center
                      gap-5
                    "
                  >

                    {/* PROGRAM */}

                    <div className="flex items-center gap-4 min-w-0 xl:w-[27%]">

                      <div
                        className="
                          w-12
                          h-12
                          rounded-xl
                          bg-gradient-to-br
                          from-[#123B5D]
                          to-[#0F766E]
                          flex
                          items-center
                          justify-center
                          text-white
                          shadow-sm
                          shrink-0
                          transition-transform
                          duration-200

                        "
                      >
                        <GraduationCap
                          size={21}
                          strokeWidth={2.2}
                        />
                      </div>

                      <div className="min-w-0">

                        <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate">
                          {program.name}
                        </h3>



                      </div>

                    </div>

                    {/* CODE */}

                    <div className="xl:w-[12%]">

                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                        Code
                      </p>

                      <span
                        className="
                          inline-flex
                          items-center
                          px-3
                          py-1.5
                          rounded-lg
                          bg-[#123B5D]/10
                          dark:bg-sky-400/10
                          text-[#123B5D]
                          dark:text-sky-300
                          text-xs
                          font-bold
                          tracking-wide
                        "
                      >
                        {program.code}
                      </span>

                    </div>

                    {/* DESCRIPTION */}

                    <div className="flex-1 min-w-0">

                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                        Description
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">

                        {program.description || (
                          <span className="text-gray-400 italic">
                            No description provided
                          </span>
                        )}

                      </p>

                    </div>

                    {/* STATUS */}

                    <div className="xl:w-[12%]">

                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                        Status
                      </p>

                      {program.is_active ? (
                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            bg-emerald-50
                            dark:bg-emerald-500/10
                            px-3
                            py-1.5
                            text-xs
                            font-bold
                            text-emerald-700
                            dark:text-emerald-300
                          "
                        >
                          <CheckCircle2 size={14} />
                          Active
                        </span>
                      ) : (
                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            bg-red-50
                            dark:bg-red-500/10
                            px-3
                            py-1.5
                            text-xs
                            font-bold
                            text-red-700
                            dark:text-red-300
                          "
                        >
                          <XCircle size={14} />
                          Inactive
                        </span>
                      )}

                    </div>

                    {/* ACTIONS */}

                    <div className="flex items-center gap-2 flex-wrap xl:justify-end">

                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(program)
                        }
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          px-3.5
                          py-2
                          rounded-xl
                          bg-blue-50
                          dark:bg-blue-500/10
                          text-[#123B5D]
                          dark:text-blue-300
                          text-sm
                          font-semibold
                          hover:bg-[#123B5D]
                          hover:text-white
                          transition-colors
                        "
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      {/* TOGGLE */}

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(
                            program
                          )
                        }
                        disabled={
                          toggling ===
                          program.id
                        }
                        className={`
                          inline-flex
                          items-center
                          gap-1.5
                          px-3.5
                          py-2
                          rounded-xl
                          text-sm
                          font-semibold
                          transition-colors
                          disabled:cursor-not-allowed
                          disabled:opacity-50

                          ${
                            program.is_active
                              ? `
                                bg-amber-50
                                dark:bg-amber-500/10
                                text-amber-700
                                dark:text-amber-300
                                hover:bg-amber-500
                                hover:text-white
                              `
                              : `
                                bg-emerald-50
                                dark:bg-emerald-500/10
                                text-emerald-700
                                dark:text-emerald-300
                                hover:bg-emerald-600
                                hover:text-white
                              `
                          }
                        `}
                      >
                        <Power size={15} />

                        {toggling ===
                        program.id
                          ? 'Updating...'
                          : program.is_active
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            program.id
                          )
                        }
                        disabled={
                          deleting ===
                          program.id
                        }
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          px-3.5
                          py-2
                          rounded-xl
                          bg-red-50
                          dark:bg-red-500/10
                          text-red-600
                          dark:text-red-300
                          text-sm
                          font-semibold
                          hover:bg-red-600
                          hover:text-white
                          transition-colors
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        <Trash2 size={15} />

                        {deleting ===
                        program.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </section>

      {/* ==========================================
          INFORMATION FOOTER
      ========================================== */}

      <section
        className="
          rounded-2xl
          bg-[#123B5D]
          p-6
          text-white
          shadow-sm
          animate-fade-up
        "
        style={{
          animationDelay: '220ms',
        }}
      >

        <div className="flex items-start gap-4">

          <div
            className="
              w-11
              h-11
              rounded-xl
              bg-white/10
              flex
              items-center
              justify-center
              shrink-0
            "
          >
            <Info size={21} />
          </div>

          <div>

            <h3 className="font-bold">
              Program Management
            </h3>

            <p className="text-sm text-blue-100 mt-1 leading-relaxed">
              Active academic programs are available for
              admission applications and can be assigned to
              staff members as Programs Served. Staff program
              assignments are managed separately through Staff
              Management.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
};

const ProgramsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <Programs confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default ProgramsWrapper;

