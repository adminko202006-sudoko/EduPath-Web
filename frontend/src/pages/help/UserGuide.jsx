import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, ChevronDown, CircleHelp, Search, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { filterGuideTopics, getUserGuideTopics } from '../../content/userGuides';

export default function UserGuide() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All topics');
  const topics = getUserGuideTopics(user);
  const categories = ['All topics', ...new Set(topics.map((topic) => topic.category))];
  const visibleTopics = filterGuideTopics(topics, query, category);
  const reset = () => { setQuery(''); setCategory('All topics'); };

  return <div className="animate-fade-up space-y-6">
    <header className="ep-page-banner rounded-2xl bg-[#123B5D] p-5 text-white sm:p-7">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F4B400]"><BookOpen size={16} /> EduPath user guide</p>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">How to Use EduPath</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100">
        {user?.role === 'staff'
          ? 'Step-by-step help for your assigned staff tasks. Topics follow your current permissions; contact the Admin for access or assignment questions.'
          : 'Start with your profile, submit your admission application and follow each requirement. Find clear steps for scholarships, examinations and college updates.'}
      </p>
    </header>

    <section aria-label="Find a guide" className="ep-card space-y-4 rounded-2xl p-4 sm:p-5">
      <label htmlFor="guide-search" className="block text-sm font-bold text-[#123B5D] dark:text-sky-200">What would you like help with?</label>
      <div className="relative">
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
        <input id="guide-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search admission, upload, scholarship, exam..." className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-400/30" />
      </div>
      <div role="group" aria-label="Guide categories" className="flex flex-wrap gap-2">
        {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`min-h-10 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B400] ${category === item ? 'bg-[#123B5D] text-white dark:bg-sky-900' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}>{item}</button>)}
      </div>
    </section>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <p role="status" aria-live="polite" className="text-sm text-slate-600 dark:text-slate-300">{visibleTopics.length} {visibleTopics.length === 1 ? 'guide' : 'guides'} available. Select a topic to see the steps.</p>
      {(query || category !== 'All topics') && <button type="button" onClick={reset} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#123B5D] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B400] dark:text-sky-200 dark:hover:bg-slate-800"><X size={16} /> Clear filters</button>}
    </div>

    <div className="space-y-4">
      {visibleTopics.map((topic) => <details key={topic.id} open={query.trim() ? true : undefined} className="ep-card group overflow-hidden rounded-2xl">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F4B400] dark:hover:bg-slate-800/50 sm:p-6 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0"><span className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">{topic.category}</span><span className="mt-1 block text-lg font-bold text-[#123B5D] dark:text-sky-200">{topic.title}</span><span className="mt-2 block text-sm leading-6 text-slate-600 dark:text-slate-300">{topic.summary}</span><span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">{topic.steps.length} steps</span></span>
          <ChevronDown size={20} aria-hidden="true" className="mt-2 shrink-0 text-slate-500 transition-transform group-open:rotate-180 dark:text-slate-300" />
        </summary>
        <div className="space-y-5 border-t border-slate-200 p-5 dark:border-slate-700 sm:p-6">
          <ol className="space-y-4">{topic.steps.map((step, index) => <li key={step} className="flex items-start gap-3"><span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#123B5D]/10 text-xs font-bold text-[#123B5D] dark:bg-sky-900/50 dark:text-sky-200">{index + 1}</span><span className="min-w-0 pt-0.5 text-sm leading-6 text-slate-700 dark:text-slate-200"><span className="sr-only">Step {index + 1}: </span>{step}</span></li>)}</ol>
          {topic.note && <p className="rounded-xl border-l-4 border-[#F4B400] bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><strong>Remember: </strong>{topic.note}</p>}
          {topic.path && <Link to={topic.path} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0B2941] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B400] focus-visible:ring-offset-2 dark:bg-sky-900 dark:hover:bg-sky-800">{topic.action}<ArrowUpRight size={16} /></Link>}
        </div>
      </details>)}
      {visibleTopics.length === 0 && <div className="ep-card rounded-2xl p-8 text-center"><CircleHelp size={32} className="mx-auto text-slate-400" /><h2 className="mt-3 font-bold text-[#123B5D] dark:text-sky-200">No matching guides</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Try a different word or clear the filters to see all your topics.</p><button type="button" onClick={reset} className="mt-4 rounded-lg bg-[#123B5D] px-4 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B400]">Show all topics</button></div>}
    </div>

    <aside className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><h2 className="mb-2 font-bold text-[#123B5D] dark:text-sky-200">Need more help?</h2>Contact Trinidad Municipal College’s admissions or scholarship office about eligibility, deadlines and official decisions. This guide explains the application; the college’s current instructions and the status shown on your record remain authoritative.</aside>
  </div>;
}
