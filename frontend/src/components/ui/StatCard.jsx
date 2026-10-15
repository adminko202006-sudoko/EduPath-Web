/* =========================================================
   STATCARD

   Matches the card language of Requirements.jsx: labels,
   big numeric value, icon tile, short description, and a
   thin navy→gold progress bar whose width is driven by the
   optional `progress` prop (not fabricated data).
   ========================================================= */

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconClass = 'bg-blue-100 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300',
  description,
  delay = '0ms',
  progress,
}) => (
  <div
    className="ep-card ep-hover-lift rounded-2xl p-5 animate-fade-up"
    style={{ animationDelay: delay }}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>

        <p className="mt-2 text-3xl font-extrabold text-[#123B5D] dark:text-gray-100">
          {value ?? 0}
        </p>

        {description && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      <div
        className={`
          flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
          transition-transform duration-200
          ${iconClass}
        `}
      >
        <Icon
          size={22}
          strokeWidth={2.2}
        />
      </div>
    </div>

    <div className="mt-5 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#123B5D] via-[#0F766E] to-[#F4B400]"
        style={{
          width:
            typeof progress === 'number'
              ? `${Math.min(Math.max(progress * 100, 12), 100)}%`
              : '100%',
        }}
      />
    </div>
  </div>
);

export default StatCard;
