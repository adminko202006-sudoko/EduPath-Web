import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, Megaphone, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import Loading from '../../components/Loading';

const unwrap = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  throw new Error('Invalid announcement response');
};

const formatDate = (value) => {
  if (!value) return 'Date not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not specified';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const Announcements = () => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [endpointMissing, setEndpointMissing] = useState(false);

  const loadAnnouncements = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    setEndpointMissing(false);

    try {
      const response = await api.get('/applicant/announcements', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setItems(unwrap(response.data));
    } catch (err) {
      const missing = err.response?.status === 404;
      setEndpointMissing(missing);
      setError(
        missing
          ? 'Announcements are temporarily unavailable. Please try again later.'
          : err.response?.data?.message || 'Announcements could not be loaded. Check your connection and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);
  useAutoRefresh(async () => {
    await loadAnnouncements(true);
  });

  useEffect(() => {
    queueMicrotask(() => {
      loadAnnouncements();
    });
  }, [loadAnnouncements]);

  if (loading) return <Loading label="Loading announcements..." fullScreen />;

  return (
    <div className="page-transition space-y-6">
      <section className="ep-page-banner ep-brand-gradient relative overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#48C8FF]/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-50">
              <Megaphone size={14} /> Applicant Portal
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Announcements</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Important updates from Trinidad Municipal College about admissions, scholarships, and applicant activities.
            </p>
          </div>
          
        </div>
      </section>

      {error && (
        <ErrorMessage message={error}><section role="alert" className="flex gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
          {endpointMissing ? <WifiOff className="mt-0.5 shrink-0" size={20} /> : <AlertCircle className="mt-0.5 shrink-0" size={20} />}
          <div>
            <p className="font-semibold">Unable to load announcements</p>
            <p className="mt-1 text-sm leading-6">{error}</p>
            <button type="button" disabled={refreshing} onClick={() => loadAnnouncements(true)} className="mt-2 font-semibold underline">Retry</button>
          </div>
        </section></ErrorMessage>
      )}

      {!error && items.length === 0 && (
        <div className="ep-card rounded-2xl p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-[#168BFF]">
            <Megaphone size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No announcements yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">College announcements will appear here when they are published.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <article key={item.id ?? `${item.title}-${item.published_at}`} className="ep-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0755B8]/10 text-[#168BFF] dark:bg-blue-400/10">
                  <Megaphone size={21} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-lg font-bold text-slate-900 dark:text-white">{item.title || 'Announcement'}</h2>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <CalendarDays size={13} /> {formatDate(item.published_at || item.created_at)}
                  </p>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-700 dark:text-slate-200">{item.content || item.message || 'No additional details provided.'}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
