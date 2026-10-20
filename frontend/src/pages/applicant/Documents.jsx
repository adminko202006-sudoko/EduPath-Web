import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import { openPrivateDocument } from '../../services/documentFile';
import useAutoRefresh from '../../hooks/useAutoRefresh';

import {
  FolderOpen,
  Upload,
  FileText,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock3,
  FileImage,
  RefreshCw,
  FileCheck2,
  ShieldCheck,
  XCircle,
  ClipboardList,
  ClipboardCheck,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';

const Documents = () => {
  const { token } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [admissionApplication, setAdmissionApplication] = useState(null);
  const [admissionApplicationId, setAdmissionApplicationId] = useState('');

  const [documentName, setDocumentName] = useState('');
  const [file, setFile] = useState(null);

  // Replacement state
  const [replacementDocument, setReplacementDocument] = useState(null);
  const [replacing, setReplacing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [requirementsLoading, setRequirementsLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // ==========================================
  // LOAD ADMISSION APPLICATION
  // ==========================================

  const loadAdmissionApplication = useCallback(async () => {
    try {
      const response = await api.get('/applicant/admissions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const applications = Array.isArray(data)
        ? data
        : data?.data || [];

      if (applications.length > 0) {
        const application = applications[0];

        setAdmissionApplication(application);
        setAdmissionApplicationId(application.id);

        return application;
      }

      setAdmissionApplication(null);
      setAdmissionApplicationId('');
      setRequirements([]);

      return null;
    } catch (err) {
      console.error(
        'Failed to load admission application:',
        err
      );

      setAdmissionApplication(null);
      setAdmissionApplicationId('');
      setRequirements([]);

      return null;
    }
  }, [token]);

  // ==========================================
  // LOAD REQUIREMENTS FOR PROGRAM
  // ==========================================

  const loadRequirements = useCallback(async (application) => {
    if (!application) {
      setRequirements([]);
      return;
    }

    const programId =
      application.academic_program_id ||
      application.academicProgram?.id;

    if (!programId) {
      console.warn(
        'No academic program found for admission application.'
      );

      setRequirements([]);
      return;
    }

    setRequirementsLoading(true);

    try {
      const response = await api.get(
        `/applicant/programs/${programId}/requirements`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      setRequirements(
        Array.isArray(data)
          ? data
          : data?.data || []
      );
    } catch (err) {
      console.error(
        'Failed to load admission requirements:',
        err
      );

      setRequirements([]);
    } finally {
      setRequirementsLoading(false);
    }
  }, [token]);

  // ==========================================
  // LOAD DOCUMENTS
  // ==========================================

  const loadDocuments = useCallback(async () => {
    try {
      const response = await api.get(
        '/applicant/documents',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      setDocuments(
        Array.isArray(data)
          ? data
          : data?.data || []
      );

      return true;
    } catch (err) {
      console.error(
        'Failed to load documents:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load documents.'
      );

      return false;
    }
  }, [token]);
  useAutoRefresh(async () => {
    const application = await loadAdmissionApplication();

    await Promise.all([
      loadDocuments(),
      loadRequirements(application),
    ]);
  });

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const loadPage = async () => {
      if (!token) {
        return;
      }

      setLoading(true);
      setError('');

      const application =
        await loadAdmissionApplication();

      await Promise.all([
        loadDocuments(),
        loadRequirements(application),
      ]);

      setLoading(false);
    };

    loadPage();
  }, [token, loadAdmissionApplication, loadDocuments, loadRequirements]);

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = async () => {
    if (!token) {
      return;
    }

    setRefreshing(true);
    setError('');
    setMessage('');

    const application =
      await loadAdmissionApplication();

    await Promise.all([
      loadDocuments(),
      loadRequirements(application),
    ]);

    setRefreshing(false);
  };

  // ==========================================
  // FILE CHANGE
  // ==========================================

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    setFile(selectedFile || null);
    setMessage('');
    setError('');

    if (
      selectedFile &&
      selectedFile.size > 5 * 1024 * 1024
    ) {
      setError(
        'The selected file is larger than the 5MB limit.'
      );

      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ==========================================
  // SELECT REQUIREMENT FOR NORMAL UPLOAD
  // ==========================================

  const handleRequirementSelect = (requirement) => {
    setReplacementDocument(null);
    setDocumentName(requirement.name);
    setFile(null);
    setMessage('');
    setError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => {
      document
        .getElementById('document-file')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
    }, 100);
  };

  // ==========================================
  // START DOCUMENT REPLACEMENT
  // ==========================================

  const handleReplaceStart = (document) => {
    if (!document) {
      return;
    }

    if (
      document.status?.toLowerCase() !== 'rejected'
    ) {
      setError(
        'Only rejected documents can be replaced.'
      );

      return;
    }

    setReplacementDocument(document);
    setDocumentName(document.document_name || '');
    setFile(null);
    setMessage('');
    setError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => {
      document
        .getElementById('document-file')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
    }, 100);
  };

  // ==========================================
  // CANCEL REPLACEMENT
  // ==========================================

  const cancelReplacement = () => {
    if (replacing) {
      return;
    }

    setReplacementDocument(null);
    setFile(null);
    setDocumentName('');
    setMessage('');
    setError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ==========================================
  // REPLACE DOCUMENT
  // ==========================================

  const handleReplace = async () => {
    setMessage('');
    setError('');

    if (!replacementDocument) {
      setError(
        'No rejected document was selected for replacement.'
      );

      return;
    }

    if (
      replacementDocument.status?.toLowerCase() !==
      'rejected'
    ) {
      setError(
        'Only rejected documents can be replaced.'
      );

      return;
    }

    if (!file) {
      setError(
        'Please select the replacement file.'
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'The selected file is larger than the 5MB limit.'
      );

      return;
    }

    setReplacing(true);

    try {
      const formData = new FormData();

      formData.append(
        'document',
        file
      );

      await api.post(
        `/applicant/documents/${replacementDocument.id}/replace`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMessage(
        `${replacementDocument.document_name} was replaced successfully and is now pending review.`
      );

      setReplacementDocument(null);
      setDocumentName('');
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await loadDocuments();
    } catch (err) {
      console.error(
        'Document replacement failed:',
        err
      );

      if (err.response?.data?.errors) {
        const validationErrors =
          Object.values(
            err.response.data.errors
          ).flat();

        setError(
          validationErrors.join(' ')
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to replace document.'
        );
      }
    } finally {
      setReplacing(false);
    }
  };

  // ==========================================
  // UPLOAD DOCUMENT
  // ==========================================

  const handleUpload = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    // Replacement flow
    if (replacementDocument) {
      await handleReplace();
      return;
    }

    if (!admissionApplicationId) {
      setError(
        'You must submit an admission application before uploading documents.'
      );

      return;
    }

    if (!documentName) {
      setError(
        'Please select a document requirement.'
      );

      return;
    }

    if (!file) {
      setError(
        'Please select a file.'
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'The selected file is larger than the 5MB limit.'
      );

      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append(
        'admission_application_id',
        admissionApplicationId
      );

      formData.append(
        'document_name',
        documentName
      );

      formData.append(
        'document',
        file
      );

      await api.post(
        '/applicant/documents',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMessage(
        `${documentName} uploaded successfully.`
      );

      setDocumentName('');
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await loadDocuments();
    } catch (err) {
      console.error(
        'Document upload failed:',
        err
      );

      if (err.response?.data?.errors) {
        const validationErrors =
          Object.values(
            err.response.data.errors
          ).flat();

        setError(
          validationErrors.join(' ')
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to upload document.'
        );
      }
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // VIEW DOCUMENT
  // ==========================================

  const handleView = async (doc) => {
    if (!doc?.file_path) {
      setError(
        'Document file is not available.'
      );

      return;
    }

    try {
      // Private files are streamed through the authenticated endpoint so
      // ownership is enforced server-side instead of relying on unguessable
      // public /storage/ URLs.
      await openPrivateDocument(
        `/applicant/documents/${doc.id}/file`
      );
    } catch {
      setError(
        'Unable to open the document right now. Please try again.'
      );
    }
  };

  // ==========================================
  // DELETE DOCUMENT
  // ==========================================

  const handleDelete = async (documentId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this document?'
    );

    if (!confirmed) {
      return;
    }

    setMessage('');
    setError('');

    try {
      await api.delete(
        `/applicant/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        'Document deleted successfully.'
      );

      await loadDocuments();
    } catch (err) {
      console.error(
        'Failed to delete document:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to delete document.'
      );
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return 'Unknown date';
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return 'Unknown date';
    }

    return parsedDate.toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  // ==========================================
  // GET FILE NAME
  // ==========================================

  const getFileName = (filePath) => {
    if (!filePath) {
      return 'Uploaded file';
    }

    return filePath
      .split('/')
      .pop();
  };

  // ==========================================
  // GET STATUS STYLE
  // ==========================================

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'verified':
        return {
          container:
            'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
          icon: CheckCircle2,
          label: 'Verified',
        };

      case 'rejected':
        return {
          container:
            'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
          icon: XCircle,
          label: 'Rejected',
        };

      case 'under_review':
      case 'under review':
        return {
          container:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
          icon: ShieldCheck,
          label: 'Under Review',
        };

      case 'pending':
      default:
        return {
          container:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
          icon: Clock3,
          label: 'Pending',
        };
    }
  };

  // ==========================================
  // FIND DOCUMENT FOR REQUIREMENT
  // ==========================================

  const findDocumentForRequirement = useCallback((
    requirement
  ) => {
    if (!requirement) {
      return null;
    }

    return documents.find((document) => {
      const uploadedName =
        document.document_name
          ?.trim()
          .toLowerCase();

      const requirementName =
        requirement.name
          ?.trim()
          .toLowerCase();

      return (
        uploadedName === requirementName
      );
    });
  }, [documents]);

  // ==========================================
  // REQUIREMENT CHECKLIST
  // ==========================================

  const requirementChecklist = useMemo(() => {
    return requirements.map(
      (requirement) => {
        const document =
          findDocumentForRequirement(
            requirement
          );

        return {
          ...requirement,
          document,
        };
      }
    );
  }, [requirements, findDocumentForRequirement]);

  // ==========================================
  // REQUIREMENT STATISTICS
  // ==========================================

  const requirementStats = useMemo(() => {
    const total =
      requirements.length;

    const uploaded =
      requirementChecklist.filter(
        (requirement) =>
          requirement.document
      ).length;

    const verified =
      requirementChecklist.filter(
        (requirement) =>
          ['verified', 'approved'].includes(
            requirement.document?.status?.toLowerCase()
          )
      ).length;

    const rejected =
      requirementChecklist.filter(
        (requirement) =>
          requirement.document?.status?.toLowerCase() ===
          'rejected'
      ).length;

    const missing =
      requirementChecklist.filter(
        (requirement) =>
          !requirement.document
      ).length;

    return {
      total,
      uploaded,
      verified,
      rejected,
      missing,
    };
  }, [
    requirements,
    requirementChecklist,
  ]);

  // ==========================================
  // DOCUMENT STATISTICS
  // ==========================================

  // ==========================================
  // PROGRAM NAME
  // ==========================================

  const programName =
    admissionApplication?.academicProgram?.name ||
    admissionApplication?.academic_program?.name ||
    'Selected Program';

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">

        <div className="ep-card overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-800" />

                <div className="space-y-3">
                  <div className="h-7 w-52 rounded-lg bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-80 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>

              <div className="hidden sm:block h-11 w-28 rounded-xl bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>

        <div className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-800" />

        <div className="h-80 rounded-2xl bg-gray-200 dark:bg-gray-800" />

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-8 page-transition">

      {/* HERO */}

      <div className="ep-card overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm ep-hover-lift">
        <div className="ep-page-banner ep-brand-gradient p-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white shadow-sm">
                <FolderOpen size={28} />
              </div>

              <div>
                <p className="text-sm font-semibold text-white/75 uppercase tracking-wider">
                  Applicant Portal
                </p>

                <h1 data-tutorial-target="applicant-documents-intro" className="text-3xl font-bold text-white mt-1">
                  My Documents
                </h1>

                <p className="text-sm text-white/75 mt-1">
                  Manage your admission requirements and uploaded documents.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white border border-white/20 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-200"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              />

              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}
            </button>

          </div>
        </div>
      </div>

      {/* MESSAGES */}

      {message && (
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 px-5 py-4 rounded-2xl animate-fade-up">

          <CheckCircle2
            size={20}
            className="mt-0.5 flex-shrink-0"
          />

          <div>
            <p className="font-semibold">
              Success
            </p>

            <p className="text-sm mt-0.5">
              {message}
            </p>
          </div>

        </div>
      )}

      {error && (
        <ErrorMessage message={error}><div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-5 py-4 rounded-2xl animate-fade-up">

          <AlertCircle
            size={20}
            className="mt-0.5 flex-shrink-0"
          />

          <div>
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="text-sm mt-0.5">
              {error}
            </p>
          </div>

        </div></ErrorMessage>
      )}

      {/* REQUIREMENT STATISTICS */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="ep-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm ep-hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Requirements
              </p>

              <p className="text-3xl font-bold text-[#123B5D] dark:text-white mt-1">
                {requirementStats.total}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center">
              <ClipboardList
                size={21}
                className="text-[#123B5D] dark:text-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="ep-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm ep-hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Uploaded
              </p>

              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {requirementStats.uploaded}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Upload
                size={21}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="ep-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm ep-hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Verified
              </p>

              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {requirementStats.verified}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
              <CheckCircle2
                size={21}
                className="text-green-600 dark:text-green-400"
              />
            </div>
          </div>
        </div>

        <div className="ep-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm ep-hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Missing
              </p>

              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {requirementStats.missing}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle
                size={21}
                className="text-amber-600 dark:text-amber-400"
              />
            </div>
          </div>
        </div>

      </div>

      {/* PROGRAM REQUIREMENT CHECKLIST */}

      <div className="ep-card bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center">
                <ClipboardCheck
                  size={21}
                  className="text-[#123B5D] dark:text-blue-400"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
                  Admission Requirement Checklist
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Requirements for your selected academic program.
                </p>
              </div>

            </div>

            {admissionApplication && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#123B5D]/5 dark:bg-blue-500/10 text-[#123B5D] dark:text-blue-300 text-sm font-semibold">
                <GraduationCap size={17} />
                {programName}
              </div>
            )}

          </div>
        </div>

        <div className="p-6">

          {requirementsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : !admissionApplication ? (
            <div className="py-12 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-4">
                <ClipboardList
                  size={30}
                  className="text-amber-500"
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                No admission application
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Submit an admission application to see your program requirements.
              </p>

            </div>
          ) : requirements.length === 0 ? (
            <div className="py-12 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <ClipboardList
                  size={30}
                  className="text-gray-400"
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                No requirements assigned
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                No active admission requirements have been assigned to this program yet.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {requirementChecklist.map(
                (requirement) => {
                  const document =
                    requirement.document;

                  const status =
                    document?.status?.toLowerCase();

                  const verified =
                    ['verified', 'approved'].includes(
                      status
                    );

                  const rejected =
                    status === 'rejected';

                  return (
                    <div
                      key={requirement.id}
                      className={`border rounded-2xl p-5 transition-colors duration-200 ${
                        verified
                          ? 'border-green-200 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/5'
                          : rejected
                          ? 'border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5'
                          : document
                          ? 'border-blue-200 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5'
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                      }`}
                    >

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                        <div className="flex items-start gap-4 min-w-0">

                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              verified
                                ? 'bg-green-100 dark:bg-green-500/10'
                                : rejected
                                ? 'bg-red-100 dark:bg-red-500/10'
                                : document
                                ? 'bg-blue-100 dark:bg-blue-500/10'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}
                          >
                            {verified ? (
                              <CheckCircle2
                                size={24}
                                className="text-green-600 dark:text-green-400"
                              />
                            ) : rejected ? (
                              <XCircle
                                size={24}
                                className="text-red-600 dark:text-red-400"
                              />
                            ) : document ? (
                              <FileCheck2
                                size={24}
                                className="text-blue-600 dark:text-blue-400"
                              />
                            ) : (
                              <FileText
                                size={24}
                                className="text-gray-400"
                              />
                            )}
                          </div>

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                                {requirement.name}
                              </h3>

                              {requirement.is_required && (
                                <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                                  Required
                                </span>
                              )}

                            </div>

                            {requirement.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {requirement.description}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-2">

                              {!document && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                  <Clock3 size={13} />
                                  Missing
                                </span>
                              )}

                              {document && (
                                <>
                                  {(() => {
                                    const style =
                                      getStatusStyle(
                                        document.status
                                      );

                                    const StatusIcon =
                                      style.icon;

                                    return (
                                      <span
                                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${style.container}`}
                                      >
                                        <StatusIcon size={13} />
                                        {style.label}
                                      </span>
                                    );
                                  })()}

                                  {document.file_path && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                      <FileText size={13} />

                                      {getFileName(
                                        document.file_path
                                      )}
                                    </span>
                                  )}
                                </>
                              )}

                            </div>

                            {document?.remarks && (
                              <div className="mt-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3">

                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  Review Remarks
                                </p>

                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {document.remarks}
                                </p>

                              </div>
                            )}

                          </div>
                        </div>

                        <div className="flex items-center gap-2 lg:flex-shrink-0">

                          {document?.file_path && (
                            <button
                              type="button"
                              onClick={() =>
                                handleView(
                                  document
                                )
                              }
                              className="inline-flex items-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors duration-200"
                            >
                              <Eye size={17} />
                              View
                            </button>
                          )}

                          {rejected && (
                            <button
                              type="button"
                              onClick={() =>
                                handleReplaceStart(
                                  document
                                )
                              }
                              className="inline-flex items-center gap-2 bg-[#F4B400] hover:bg-[#D9A000] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors duration-200"
                            >
                              <RefreshCw size={17} />
                              Replace
                            </button>
                          )}

                          {!document && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRequirementSelect(
                                  requirement
                                )
                              }
                              className="inline-flex items-center gap-2 bg-[#F4B400] hover:bg-[#D9A000] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors duration-200"
                            >
                              <Upload size={17} />
                              Upload
                            </button>
                          )}

                        </div>

                      </div>
                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>
      </div>

      {/* UPLOAD / REPLACEMENT CARD */}

      <div
        className={`ep-card bg-white dark:bg-gray-900 rounded-2xl border shadow-sm overflow-hidden ep-hover-lift ${
          replacementDocument
            ? 'border-amber-300 dark:border-amber-500/30'
            : 'border-gray-100 dark:border-gray-800'
        }`}
      >

        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">

          <div className="flex items-center gap-3">

            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                replacementDocument
                  ? 'bg-amber-50 dark:bg-amber-500/10'
                  : 'bg-[#123B5D]/10 dark:bg-blue-500/10'
              }`}
            >
              {replacementDocument ? (
                <RefreshCw
                  size={21}
                  className="text-amber-600 dark:text-amber-400"
                />
              ) : (
                <Upload
                  size={21}
                  className="text-[#123B5D] dark:text-blue-400"
                />
              )}
            </div>

            <div>

              <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
                {replacementDocument
                  ? 'Replace Rejected Document'
                  : 'Upload Document'}
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {replacementDocument
                  ? `Upload a corrected file for ${replacementDocument.document_name}.`
                  : 'Upload a document from your admission requirement checklist.'}
              </p>

            </div>

          </div>

        </div>

        <form
          onSubmit={handleUpload}
          className="p-6 space-y-6"
        >

          {/* REPLACEMENT NOTICE */}

          {replacementDocument && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">

              <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <AlertTriangle
                  size={18}
                  className="text-amber-600 dark:text-amber-400"
                />
              </div>

              <div className="flex-1">

                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  Replacing Rejected Document
                </p>

                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                  {replacementDocument.document_name}
                </p>

                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  The new file will replace the previous file and will be sent back for review.
                </p>

              </div>

              <button
                type="button"
                onClick={cancelReplacement}
                disabled={replacing}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>

            </div>
          )}

          {/* DOCUMENT REQUIREMENT */}

          <div>

            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Document Requirement
            </label>

            {replacementDocument ? (
              <div className="w-full px-4 py-3 border border-amber-200 dark:border-amber-500/20 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-gray-700 dark:text-gray-200">
                <span className="font-semibold">
                  {replacementDocument.document_name}
                </span>
              </div>
            ) : requirements.length > 0 ? (
              <select
                value={documentName}
                onChange={(e) =>
                  setDocumentName(
                    e.target.value
                  )
                }
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-500/20 focus:border-[#123B5D] transition"
              >
                <option value="">
                  Select requirement
                </option>

                {requirements.map(
                  (requirement) => (
                    <option
                      key={requirement.id}
                      value={requirement.name}
                    >
                      {requirement.name}
                      {requirement.is_required
                        ? ' — Required'
                        : ''}
                    </option>
                  )
                )}
              </select>
            ) : (
              <div className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
                No program-specific requirements available.
              </div>
            )}

          </div>

          {/* FILE */}

          <div>

            <label
              htmlFor="document-file"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              {replacementDocument
                ? 'Select Replacement File'
                : 'Select File'}
            </label>

            <input
              ref={fileInputRef}
              id="document-file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#123B5D] file:text-white file:font-medium hover:file:bg-[#0F3553] transition"
            />

            {file && (
              <div className="mt-3 flex items-center justify-between gap-3 bg-[#F4F7FA] dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3">

                <div className="flex items-center gap-3 min-w-0">

                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0">

                    {file.type?.includes(
                      'image'
                    ) ? (
                      <FileImage
                        size={18}
                        className="text-[#123B5D] dark:text-blue-400"
                      />
                    ) : (
                      <FileText
                        size={18}
                        className="text-[#123B5D] dark:text-blue-400"
                      />
                    )}

                  </div>

                  <div className="min-w-0">

                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                      {file.name}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(2)}{' '}
                      MB
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);

                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-xs font-semibold text-red-500 hover:text-red-600"
                >
                  Remove
                </button>

              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Accepted formats: PDF, JPG, JPEG, PNG. Maximum 5MB.
            </p>

          </div>

          {/* APPLICATION INFORMATION */}

          {!replacementDocument && (
            <div className="flex items-start gap-3 bg-[#123B5D]/5 dark:bg-blue-500/10 border border-[#123B5D]/10 dark:border-blue-500/20 rounded-xl p-4">

              <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <ClipboardList
                  size={18}
                  className="text-[#123B5D] dark:text-blue-400"
                />
              </div>

              <div>

                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Admission Application
                </p>

                <p className="text-sm text-[#123B5D] dark:text-blue-300 mt-1">
                  Application ID:{' '}
                  <span className="font-bold">
                    {admissionApplicationId ||
                      'Not found'}
                  </span>
                </p>

                {admissionApplication && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Program:{' '}
                    <span className="font-semibold">
                      {programName}
                    </span>
                  </p>
                )}

                {!admissionApplicationId && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    Submit an admission application before uploading documents.
                  </p>
                )}

              </div>

            </div>
          )}

          {/* SUBMIT BUTTON */}

          <div className="flex justify-end gap-3 pt-2">

            {replacementDocument && (
              <button
                type="button"
                onClick={cancelReplacement}
                disabled={replacing}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold px-6 py-3 rounded-xl transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={
                uploading ||
                replacing ||
                !documentName ||
                !file ||
                (!replacementDocument &&
                  !admissionApplicationId)
              }
              className={`inline-flex items-center gap-2 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200 shadow-sm hover:shadow-md ${
                replacementDocument
                  ? 'bg-[#F4B400] hover:bg-[#D9A000]'
                  : 'bg-[#123B5D] hover:bg-[#0F3553]'
              }`}
            >

              {replacementDocument ? (
                <RefreshCw
                  size={18}
                  className={
                    replacing
                      ? 'animate-spin'
                      : ''
                  }
                />
              ) : (
                <Upload size={18} />
              )}

              {replacementDocument
                ? replacing
                  ? 'Replacing...'
                  : 'Replace Document'
                : uploading
                ? 'Uploading...'
                : 'Upload Document'}

            </button>

          </div>

        </form>
      </div>

      {/* UPLOADED DOCUMENTS */}

      <div className="ep-card bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-[#F4B400]/10 flex items-center justify-center">
              <FolderOpen
                size={21}
                className="text-[#D9A900]"
              />
            </div>

            <div>

              <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
                Uploaded Documents
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Documents you have submitted for your admission application.
              </p>

            </div>

          </div>

        </div>

        <div className="p-6">

          {documents.length === 0 ? (
            <div className="py-14 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F4F7FA] dark:bg-gray-800 flex items-center justify-center mb-4">
                <FolderOpen
                  size={30}
                  className="text-gray-400"
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                No documents yet
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                You haven't uploaded any documents yet.
              </p>

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Upload your admission requirements using the checklist above.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {documents.map((doc) => {
                const statusStyle =
                  getStatusStyle(
                    doc.status
                  );

                const StatusIcon =
                  statusStyle.icon;

                const isRejected =
                  doc.status?.toLowerCase() ===
                  'rejected';

                return (
                  <div
                    key={doc.id}
                    className={`border rounded-2xl p-5 hover:shadow-md transition-colors duration-200 ${
                      isRejected
                        ? 'border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                      <div className="flex items-start gap-4 min-w-0">

                        <div className="w-12 h-12 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <FileCheck2
                            size={23}
                            className="text-[#123B5D] dark:text-blue-400"
                          />
                        </div>

                        <div className="min-w-0">

                          <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                            {doc.document_name ||
                              'Document'}
                          </h3>

                          <div className="flex items-center gap-2 mt-1">

                            <FileText
                              size={14}
                              className="text-gray-400 flex-shrink-0"
                            />

                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {getFileName(
                                doc.file_path
                              )}
                            </p>

                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">

                            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                              <Clock3 size={13} />

                              <span>
                                Uploaded:{' '}
                                {formatDate(
                                  doc.created_at
                                )}
                              </span>
                            </div>

                            {doc.file_type && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {doc.file_type}
                              </div>
                            )}

                          </div>

                          <div className="mt-3">

                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusStyle.container}`}
                            >
                              <StatusIcon size={13} />
                              {statusStyle.label}
                            </span>

                          </div>

                          {doc.remarks && (
                            <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">

                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Review Remarks
                              </p>

                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {doc.remarks}
                              </p>

                            </div>
                          )}

                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:flex-shrink-0">

                        <button
                          type="button"
                          onClick={() =>
                            handleView(
                              doc
                            )
                          }
                          disabled={
                            !doc.file_path
                          }
                          className="inline-flex items-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors duration-200"
                        >
                          <Eye size={17} />
                          View
                        </button>

                        {isRejected && (
                          <button
                            type="button"
                            onClick={() =>
                              handleReplaceStart(
                                doc
                              )
                            }
                            className="inline-flex items-center gap-2 bg-[#F4B400] hover:bg-[#D9A000] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors duration-200"
                          >
                            <RefreshCw size={17} />
                            Replace
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              doc.id
                            )
                          }
                          className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 dark:border-red-500/20 hover:border-red-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors duration-200"
                        >
                          <Trash2 size={17} />
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

      {/* INFORMATION FOOTER */}

      <div className="bg-[#123B5D] rounded-2xl p-6 text-white shadow-sm">

        <div className="flex items-start gap-4">

          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={21} />
          </div>

          <div>

            <h3 className="font-bold">
              Document Requirements
            </h3>

            <p className="text-sm text-blue-100 mt-1 leading-relaxed">
              Make sure your uploaded documents are clear,
              complete, and readable. Only PDF, JPG, JPEG,
              and PNG files up to 5MB are accepted.
              Rejected documents can be replaced and will
              return to Pending status for review.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Documents;