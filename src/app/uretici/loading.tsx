export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-hair" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-2xl bg-hair/60" />
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-hair/60" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-hair/60" />
        ))}
      </div>
    </div>
  );
}
