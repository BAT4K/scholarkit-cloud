export default function EmptyState({
  title,
  description,
  action,
  icon
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {icon || (
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 5h6m-7 4h8m-9 4h10M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2Z" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
