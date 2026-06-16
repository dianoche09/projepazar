/** Berrak Güven imza öğesi: 3×3 ızgara, ortadaki yeşil (tazelik sinyali). */
export function GridMark({ className = "" }: { className?: string }) {
  return (
    <span className={`grid grid-cols-3 gap-0.5 ${className}`} aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className={`size-2 rounded-[2px] ${i === 4 ? "bg-green" : "bg-navy/25"}`}
        />
      ))}
    </span>
  );
}
