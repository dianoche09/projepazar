export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <div className="h-8 w-44 animate-pulse rounded-lg bg-hair" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-hair/60" />
        ))}
      </div>
    </div>
  );
}
