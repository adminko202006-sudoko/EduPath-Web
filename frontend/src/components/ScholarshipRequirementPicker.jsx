import { Link } from 'react-router-dom';

export default function ScholarshipRequirementPicker({ requirements, selected, onChange, loading, error, onRetry, disabled = false }) {
  // The saved contract uses document names. Collapse duplicate catalog names
  // without introducing extra options or changing existing saved selections.
  const names = new Set();
  const options = requirements.filter((item) => {
    if (!item?.is_active || typeof item.name !== 'string' || !item.name.trim()) return false;
    const key = item.name.toLowerCase();
    if (names.has(key)) return false;
    names.add(key);
    return true;
  });
  const unavailable = selected.filter((name) => !options.some((item) => item.name === name));
  return <fieldset disabled={disabled || loading} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
    <legend className="px-1 font-semibold">Required uploads during application</legend>
    <p className="text-sm text-gray-600 dark:text-gray-300">Choose documents from the active Requirement List. Up to 10 documents, 5 MB per file and 25 MB combined.</p>
    <p className="text-sm"><Link className="font-semibold text-blue-700 underline dark:text-blue-300" to="/admin/requirements">Manage Requirement List</Link></p>
    {loading ? <p role="status" className="text-sm">Loading Requirement List...</p> : error ? <div role="alert" className="space-y-2 text-sm text-red-700 dark:text-red-300"><p>{error}</p><button type="button" onClick={onRetry} disabled={disabled} className="rounded-lg border px-3 py-2">Retry Requirement List</button></div> : <>
      {options.length === 0 && <p className="text-sm text-gray-600 dark:text-gray-300">No active requirements are available. Add or activate documents in the Requirement List to make them selectable here.</p>}
      {options.map((item) => <label key={item.id} className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 accent-[#123B5D]" checked={selected.includes(item.name)} disabled={!selected.includes(item.name) && selected.length >= 10} onChange={(event) => onChange(event.target.checked ? [...selected, item.name] : selected.filter((name) => name !== item.name))} /><span className="min-w-0 break-words"><span className="block font-semibold">{item.name}</span>{item.description && <span className="block text-xs text-gray-500 dark:text-gray-400">{item.description}</span>}</span></label>)}
      {unavailable.length > 0 && <div className="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700"><p className="text-sm">These selections are no longer in the active Requirement List. Previously saved selections are preserved unless you remove them; new selections must come from the active list.</p>{unavailable.map((name) => <div key={name} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 break-words">{name}</span><button type="button" className="shrink-0 rounded-lg border px-3 py-2" onClick={() => onChange(selected.filter((item) => item !== name))}>Remove saved requirement</button></div>)}</div>}
    </>}
  </fieldset>;
}
