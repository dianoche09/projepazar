export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="h-52 animate-pulse rounded-2xl bg-hair/60" />
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="h-72 animate-pulse rounded-2xl bg-hair/60" />
        <div className="h-72 animate-pulse rounded-2xl bg-hair/60" />
      </div>
    </div>
  );
}
