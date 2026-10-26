export default function OnlineExamReviewNotes({ reviews = [] }) {
  return <section className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
    <h3 className="font-semibold">Staff recommendations</h3>
    {!reviews.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No staff recommendations recorded.</p> : reviews.map((review) => <article key={review.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
      <p className="font-semibold">{review.reviewer?.name || 'Former reviewer'} · {review.recommendation.replaceAll('_', ' ')}</p>
      <p className="mt-2 whitespace-pre-wrap break-words">{review.remarks}</p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{new Date(review.updated_at).toLocaleString()}</p>
    </article>)}
  </section>;
}
