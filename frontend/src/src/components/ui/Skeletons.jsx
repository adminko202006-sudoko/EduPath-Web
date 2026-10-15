/* =========================================================
   SKELETON PLACEHOLDERS

   Consistent with the ep-skeleton shimmer used in
   Requirements.jsx and Dashboard.jsx.
   ========================================================= */

const SkeletonCard = ({ className = '' }) => (
  <div className={`ep-card rounded-2xl p-5 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1 space-y-3">
        <div className="ep-skeleton h-4 w-28" />

        <div className="ep-skeleton h-9 w-16" />

        <div className="ep-skeleton h-3 w-36" />
      </div>

      <div className="ep-skeleton h-12 w-12 rounded-xl" />
    </div>

    <div className="mt-5 h-1 rounded-full bg-gray-100 dark:bg-gray-800" />
  </div>
);

const SkeletonTable = ({ rows = 4, height = 'auto' }) => (
  <div
    className="ep-card overflow-hidden rounded-2xl"
    style={{ minHeight: height }}
  >
    <div className="border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="ep-skeleton h-11 w-11 rounded-xl" />

        <div className="space-y-2">
          <div className="ep-skeleton h-5 w-40" />

          <div className="ep-skeleton h-3 w-64" />
        </div>
      </div>
    </div>

    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="p-5 sm:p-6">
          <div className="flex gap-4">
            <div className="ep-skeleton h-11 w-11 shrink-0 rounded-xl" />

            <div className="flex-1 space-y-3">
              <div className="ep-skeleton h-5 w-56" />

              <div className="ep-skeleton h-4 w-full max-w-lg" />

              <div className="ep-skeleton h-4 w-2/3 max-w-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export { SkeletonCard, SkeletonTable };
