"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastTip = "basari" | "hata" | "bilgi";
type Toast = { id: number; tip: ToastTip; mesaj: string };

type ToastCtx = { goster: (mesaj: string, tip?: ToastTip) => void };
const Ctx = createContext<ToastCtx | null>(null);

/** Modern toast — bağımlılıksız, fixed viewport + spring. useToast().goster("...", "basari"). */
export function ToastSaglayici({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const sayac = useRef(0);

  const goster = useCallback((mesaj: string, tip: ToastTip = "bilgi") => {
    const id = Date.now() + sayac.current++;
    setToasts((t) => [...t, { id, tip, mesaj }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <Ctx.Provider value={{ goster }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-cardlg [animation:toastIn_.25s_ease-out] ${
              t.tip === "basari"
                ? "border-green/30 bg-green-soft text-teal-d"
                : t.tip === "hata"
                  ? "border-red/30 bg-red-soft text-red"
                  : "border-hair bg-card text-ink"
            }`}
          >
            <span
              className={`size-2 shrink-0 rounded-full ${
                t.tip === "basari" ? "bg-green" : t.tip === "hata" ? "bg-red" : "bg-navy"
              }`}
            />
            {t.mesaj}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const c = useContext(Ctx);
  return c ?? { goster: () => {} };
}
