import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export const addressInputClass = 'w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/30 disabled:opacity-50 dark:border-gray-600 dark:bg-[#102A3D] dark:text-white';

export default function SearchableLocation({ id, label, value, disabled, load, onChange, manual = false }) {
  const dialog = useRef(null);
  const search = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (!dialog.current.open) dialog.current.showModal();
    search.current.focus();
    let active = true;
    load().then((data) => { if (active) { setRows(data); setStatus('ready'); } })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [open, load, retry]);

  const close = () => { dialog.current.close(); setOpen(false); };
  const choose = (row) => { onChange(row); close(); };
  const filtered = rows.filter((row) => row.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</label>
      <div className="relative">
        <input id={id} value={value?.name ?? ''} readOnly required disabled={disabled}
          aria-haspopup="dialog" aria-expanded={open} placeholder={`Select ${label.toLowerCase()}`}
          className={`${addressInputClass} cursor-pointer pr-10 text-ellipsis`}
          onClick={() => { setQuery(''); setStatus('loading'); setOpen(true); }}
          onKeyDown={(event) => { if (['Enter', ' ', 'ArrowDown'].includes(event.key)) { event.preventDefault(); setQuery(''); setStatus('loading'); setOpen(true); } }} />
        <ChevronDown size={18} className="pointer-events-none absolute right-3 top-4 text-gray-400" />
      </div>
      <dialog ref={dialog} onCancel={() => setOpen(false)} onClick={(event) => { if (event.target === dialog.current) close(); }}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-gray-200 bg-white p-0 text-gray-800 shadow-2xl backdrop:bg-black/50 dark:border-gray-600 dark:bg-[#102A3D] dark:text-white"
        aria-labelledby={`${id}-title`}>
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-600">
          <h3 id={`${id}-title`} className="font-bold">Select {label.toLowerCase()}</h3>
          <button type="button" onClick={close} aria-label="Close location selection" className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
        </div>
        <div className="p-4">
          <div className="relative"><Search size={18} className="absolute left-3 top-4 text-gray-400" />
            <input ref={search} type="search" aria-label={`Search ${label.toLowerCase()}`} placeholder="Type to search..." value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter') { event.preventDefault(); if (status === 'ready' && filtered[0]) choose(filtered[0]); }
            }} className={`${addressInputClass} pl-10`} />
          </div>
          <div className="mt-3 h-[min(45vh,22rem)] overflow-y-auto" aria-live="polite">
            {status === 'loading' && <p className="p-3">Loading locations...</p>}
            {status === 'error' && <div className="p-3"><p>Could not load locations. Check your connection.</p><button type="button" className="mt-2 font-semibold underline" onClick={() => { setStatus('loading'); setRetry(retry + 1); }}>Retry</button></div>}
            {status === 'ready' && <>
              {filtered.map((row) => <button type="button" key={row.id} onClick={() => choose(row)} className="block w-full rounded-lg p-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:hover:bg-gray-700 dark:focus:bg-gray-700">{row.name}</button>)}
              {!filtered.length && <p className="p-3 text-sm text-gray-500 dark:text-gray-300">No matching locations.</p>}
              {manual && <button type="button" onClick={() => choose({ id: '__other__', name: 'Not listed — enter manually' })} className="mt-2 block w-full rounded-lg border border-gray-300 p-3 text-left font-semibold dark:border-gray-600">Not listed — enter manually</button>}
            </>}
          </div>
        </div>
      </dialog>
    </div>
  );
}
