export default function LoadingSpinner({ label = 'Loading...', fullPage = false, className = '' }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 ${
        fullPage ? 'min-h-[60vh]' : 'py-12'
      } ${className}`}
    >
      <svg
        className="h-8 w-8 animate-spin text-primary"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4Zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.14 5.82 3 7.94l3-2.65Z"
        />
      </svg>
      <span className="text-sm font-semibold text-slate-600">{label}</span>
    </div>
  );
}
