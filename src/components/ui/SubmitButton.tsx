"use client";

import { useFormStatus } from "react-dom";

const VARYANT: Record<string, string> = {
  navy: "bg-navy text-white hover:bg-ink",
  green: "bg-green text-white hover:opacity-90",
  teal: "bg-teal text-white hover:opacity-90",
  red: "bg-red text-white hover:opacity-90",
  outline: "border border-hair bg-card text-navy hover:border-teal",
};

/**
 * Form submit butonu — net geri bildirim: tıklayınca spinner + "İşleniyor…" + disabled + basma efekti.
 * useFormStatus ile otomatik pending. "Çalışıyor mu?" belirsizliğini bitirir.
 */
export function SubmitButton({
  children,
  varyant = "navy",
  className = "",
  bekleyenMetin = "İşleniyor…",
}: {
  children: React.ReactNode;
  varyant?: "navy" | "green" | "teal" | "red" | "outline";
  className?: string;
  bekleyenMetin?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] disabled:cursor-progress disabled:opacity-70 ${VARYANT[varyant]} ${className}`}
    >
      {pending && (
        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {pending ? bekleyenMetin : children}
    </button>
  );
}
