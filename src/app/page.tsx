import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/(auth)/login/actions";

/** Berrak Güven imza öğesi: 3×3 ızgara, ortadaki yeşil (tazelik sinyali). */
function GridMark() {
  const cells = Array.from({ length: 9 });
  return (
    <span className="grid grid-cols-3 gap-1" aria-hidden>
      {cells.map((_, i) => (
        <span
          key={i}
          className={`size-2.5 rounded-[3px] ${i === 4 ? "bg-green" : "bg-navy/25"}`}
        />
      ))}
    </span>
  );
}

function SinyalRozet({ renk, etiket }: { renk: string; etiket: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-hair bg-card px-3 py-1">
      <span className={`size-2 rounded-full ${renk}`} />
      {etiket}
    </span>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profil: { ad: string | null; rol: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("ad, rol")
      .eq("id", user.id)
      .single();
    profil = data;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex items-center gap-3">
        <GridMark />
        <span className="font-display text-2xl font-semibold text-navy">ProjePazar</span>
      </div>

      <h1 className="max-w-2xl text-balance font-display text-3xl font-semibold text-ink sm:text-4xl">
        Çok-müteahhitli canlı konut stoğu dağıtım ağı
      </h1>

      <p className="max-w-xl text-balance text-gray">
        Tek doğru kaynak · granüler tahsis · çift-satış kalkanı · görünür tazelik.
        Gayrimenkulün güven protokolü.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-sm text-ink">
        <SinyalRozet renk="bg-green" etiket="müsait" />
        <SinyalRozet renk="bg-amber" etiket="opsiyon" />
        <SinyalRozet renk="bg-red" etiket="satıldı" />
      </div>

      {user ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-hair bg-card px-6 py-5">
          <p className="text-sm text-gray">
            Giriş yapıldı:{" "}
            <strong className="text-ink">{profil?.ad ?? user.email}</strong>
            {profil?.rol ? (
              <>
                {" "}
                · rol{" "}
                <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-xs text-teal">
                  {profil.rol}
                </code>
              </>
            ) : null}
          </p>
          <p className="text-xs text-gray">
            Paneller (üretici kokpiti / emlakçı havuzu) PR-3 ve PR-5&apos;te gelecek.
          </p>
          <form action={cikisYap}>
            <button className="rounded-lg border border-hair bg-card px-5 py-2 font-medium text-navy transition-colors hover:border-teal">
              Çıkış yap
            </button>
          </form>
        </div>
      ) : (
        <Link
          href="/login"
          className="rounded-lg bg-navy px-6 py-3 font-medium text-white transition-colors hover:bg-ink"
        >
          Giriş yap
        </Link>
      )}
    </main>
  );
}
