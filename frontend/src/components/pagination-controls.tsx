interface Props { page: number; totalPages: number; onPageChange: (p: number) => void; }

export function PaginationControls({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)} disabled={page === 1}
        className="h-10 px-4 rounded-pill bg-surface-strong text-ink
                   font-semibold text-body-sm disabled:opacity-40
                   hover:bg-hairline transition-colors">
        &larr; Prev
      </button>

      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`h-10 w-10 rounded-pill font-semibold text-body-sm transition-colors
            ${p === page
              ? 'bg-primary text-on-primary'
              : 'bg-surface-strong text-ink hover:bg-hairline'}`}>
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
        className="h-10 px-4 rounded-pill bg-surface-strong text-ink
                   font-semibold text-body-sm disabled:opacity-40
                   hover:bg-hairline transition-colors">
        Next &rarr;
      </button>
    </div>
  );
}
