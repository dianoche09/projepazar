import type { ComponentProps, ReactNode } from "react";

/**
 * Form temel sistemi — her ekranda tutarlı alan/etiket/yardım/hata düzeni.
 * ui-ux-pro-max form kuralları: görünür etiket, alan-altı yardım/hata, ≥44px
 * dokunma yüksekliği, net odak halkası, mobilde zoom-tetiklemeyen 16px+ metin.
 */

const TABAN =
  "h-11 w-full rounded-xl border bg-card px-3.5 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-gray/55 disabled:cursor-not-allowed disabled:opacity-60";
const NORMAL = "border-hair focus:border-teal focus:ring-4 focus:ring-teal/12";
const HATALI = "border-red focus:border-red focus:ring-4 focus:ring-red/12";

export function Input({ hatali, className = "", ...props }: ComponentProps<"input"> & { hatali?: boolean }) {
  return <input {...props} aria-invalid={hatali || undefined} className={`${TABAN} ${hatali ? HATALI : NORMAL} ${className}`} />;
}

export function Textarea({ hatali, className = "", ...props }: ComponentProps<"textarea"> & { hatali?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={hatali || undefined}
      className={`min-h-[88px] w-full rounded-xl border bg-card px-3.5 py-2.5 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-gray/55 ${hatali ? HATALI : NORMAL} ${className}`}
    />
  );
}

export function Select({ hatali, className = "", children, ...props }: ComponentProps<"select"> & { hatali?: boolean }) {
  return (
    <select {...props} aria-invalid={hatali || undefined} className={`${TABAN} cursor-pointer appearance-none bg-[length:14px] bg-[right_0.85rem_center] bg-no-repeat pr-9 ${hatali ? HATALI : NORMAL} ${className}`}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%235e6b78' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")" }}
    >
      {children}
    </select>
  );
}

/** Etiket + kontrol + yardım/hata sarmalı. */
export function Field({
  label,
  required,
  helper,
  error,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-red"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red">{error}</p>
      ) : helper ? (
        <p className="text-xs text-gray">{helper}</p>
      ) : null}
    </div>
  );
}

/** Form içi başlıklı grup (alanları mantıksal böler). */
export function Grup({ baslik, aciklama, children }: { baslik: string; aciklama?: string; children: ReactNode }) {
  return (
    <section className="border-t border-hair pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-display text-sm font-semibold text-ink">{baslik}</h3>
      {aciklama ? <p className="mt-0.5 text-xs text-gray">{aciklama}</p> : null}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
