import { useEffect, useState } from 'react';
import api from '../services/api';

export default function SchoolIdPreview({ path }) {
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true, url;
    api.get(path, { responseType: 'blob' }).then(({ data }) => {
      if (!active) return;
      url = URL.createObjectURL(data);
      setResult({ path, url });
    }).catch(() => { if (active) setResult({ path, error: true }); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [path, retry]);
  if (result?.path !== path) return <p role="status">Loading school ID...</p>;
  if (result.error) return <p role="alert">School ID could not be loaded. <button type="button" className="underline" onClick={() => { setResult(null); setRetry((value) => value + 1); }}>Retry</button></p>;
  return <a href={result.url} target="_blank" rel="noreferrer" className="block"><img src={result.url} alt="Submitted school identification" className="max-h-96 w-full rounded-xl border border-slate-300 bg-white object-contain" /><span className="mt-1 block text-xs underline">Open full-size ID image</span></a>;
}
