"use client";

import { useMemo, useState } from "react";
import { tahsisEkle } from "@/app/uretici/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const inp = "rounded-lg border border-hair bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal";

const TURLER: [string, string][] = [
  ["daire", "Daire"],
  ["dukkan", "Dükkan"],
  ["ofis", "Ofis"],
  ["villa", "Villa"],
  ["depo", "Depo"],
  ["otopark", "Otopark"],
];

/** Çoklu-seçim çip (checkbox + peer styling — form getAll ile gönderir). */
function Cip({ name, value, etiket }: { name: string; value: string; etiket: string }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} className="peer sr-only" />
      <span className="inline-block rounded-lg border border-hair bg-card px-2.5 py-1.5 text-[13px] text-ink transition-colors peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-hover:border-teal">
        {etiket}
      </span>
    </label>
  );
}

function Bolum({ baslik, ipucu, children }: { baslik: string; ipucu?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink">
        {baslik}
        {ipucu ? <span className="ml-1 font-normal text-gray">{ipucu}</span> : null}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function TahsisForm({
  projeId,
  bloklar,
  katlar,
  tipler,
  ofisler,
  emlakcilar,
  birimler = [],
  geriYol,
}: {
  projeId: string;
  bloklar: { id: string; ad: string | null }[];
  katlar: number[];
  tipler: { id: string; ad: string | null; oda: string | null }[];
  ofisler: { id: string; ad: string }[];
  emlakcilar: { id: string; ad: string | null; ofis: string | null }[];
  /** Daire-bazlı kapsam için ham birim listesi (opsiyonel — boşsa daire seçimi gizlenir). */
  birimler?: { id: string; daire_no: string | null; blok_id: string | null; kat: number | null }[];
  /** Wizard akışı: doluysa tahsis sonrası bu yola döner (yoksa proje ekranına). */
  geriYol?: string;
}) {
  const [kapsamTip, setKapsamTip] = useState<"tum" | "belirli">("tum");
  const [komisyon, setKomisyon] = useState<"yuzde" | "sabit" | "yok">("yuzde");

  // Blok adı eşlemesi (daire grubunda başlık için)
  const blokAd = useMemo(() => new Map(bloklar.map((b) => [b.id, b.ad])), [bloklar]);

  // Daireleri blok → kat → birim olarak grupla (katlanabilir liste; uzun olabilir)
  const bloklaGruplu = useMemo(() => {
    const gruplar = new Map<string, { id: string; daire_no: string | null; kat: number | null }[]>();
    for (const b of birimler) {
      const anahtar = b.blok_id ?? "_";
      if (!gruplar.has(anahtar)) gruplar.set(anahtar, []);
      gruplar.get(anahtar)!.push({ id: b.id, daire_no: b.daire_no, kat: b.kat });
    }
    return [...gruplar.entries()].map(([blokId, liste]) => ({
      blokId,
      ad: blokAd.get(blokId) ?? "Blok",
      liste: [...liste].sort(
        (a, c) => (a.kat ?? 0) - (c.kat ?? 0) || (a.daire_no ?? "").localeCompare(c.daire_no ?? "", "tr"),
      ),
    }));
  }, [birimler, blokAd]);

  return (
    <form action={tahsisEkle} className="grid gap-4 rounded-2xl border border-dashed border-hair bg-card/50 p-4">
      <input type="hidden" name="proje_id" value={projeId} />
      {geriYol ? <input type="hidden" name="geri_yol" value={geriYol} /> : null}

      {/* ALICILAR — çoklu seçim (kapalı-devre tahsis = ürünün YILDIZI; görünürlük = tahsis) */}
      <div>
        <p className="text-[13px] font-bold text-ink">Bu projeyi kime açıyorsun?</p>
        <p className="mt-0.5 text-[11.5px] text-gray">
          Birden çok danışman/ofis seçebilirsin; her biri ayrı tahsis olarak kaydedilir.{" "}
          <span className="font-medium text-teal-d">Görünürlük = tahsis.</span>
        </p>

        {/* Emlakçılar — çoklu checkbox */}
        {emlakcilar.length ? (
          <div className="mt-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray">Danışmanlar</p>
            <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
              {emlakcilar.map((e) => (
                <label
                  key={e.id}
                  className="flex cursor-pointer items-start gap-2 rounded-xl border border-hair bg-card px-3 py-2 transition-colors hover:border-teal/40 has-[:checked]:border-teal has-[:checked]:bg-teal/5"
                >
                  <input type="checkbox" name="emlakci_ids" value={e.id} className="mt-0.5 size-4 shrink-0 accent-teal" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">{e.ad ?? "Danışman"}</span>
                    {e.ofis ? <span className="block truncate text-[11px] text-gray">{e.ofis}</span> : null}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {/* Ofisler — çoklu checkbox */}
        {ofisler.length ? (
          <div className="mt-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray">Ofisler (tamamı)</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ofisler.map((o) => <Cip key={o.id} name="ofis_ids" value={o.id} etiket={o.ad} />)}
            </div>
          </div>
        ) : null}

        {/* Tüm ağ — tek checkbox (value YOK → action 'on' bekler) */}
        <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-hair bg-card px-3 py-2.5 transition-colors hover:border-teal/40 has-[:checked]:border-teal has-[:checked]:bg-teal/5">
          <input type="checkbox" name="herkes" className="mt-0.5 size-4 shrink-0 accent-teal" />
          <span>
            <span className="block text-[13px] font-bold text-ink">Tüm ağ (yayın)</span>
            <span className="block text-[11px] text-gray">Tüm doğrulanmış danışmanlar görür</span>
          </span>
        </label>
      </div>

      {/* KAPSAM — açık toggle: tüm proje VEYA belirli kapsam */}
      <div className="space-y-3 rounded-xl border border-hair bg-card p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray">Kapsam — bu tahsis hangi birimleri kapsar</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {([
            ["tum", "Tüm proje", "Projedeki tüm satılabilir birimler"],
            ["belirli", "Belirli kapsam", "Blok / kat / tip / tür ya da tek tek daire"],
          ] as const).map(([v, et, aciklama]) => (
            <label
              key={v}
              className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                kapsamTip === v ? "border-teal bg-teal/5 shadow-sm" : "border-hair bg-card hover:border-teal/30"
              }`}
            >
              <input
                type="radio"
                name="kapsam_tip"
                value={v}
                checked={kapsamTip === v}
                onChange={() => setKapsamTip(v)}
                className="sr-only"
              />
              <span className={`block text-[13px] font-bold ${kapsamTip === v ? "text-teal-d" : "text-ink"}`}>{et}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-gray">{aciklama}</span>
            </label>
          ))}
        </div>

        {kapsamTip === "belirli" ? (
          <div className="space-y-3 border-t border-hair pt-3">
            {bloklar.length ? (
              <Bolum baslik="Bloklar">
                {bloklar.map((b) => <Cip key={b.id} name="bloklar" value={b.id} etiket={b.ad ?? "Blok"} />)}
              </Bolum>
            ) : null}
            {katlar.length ? (
              <Bolum baslik="Katlar">
                {katlar.map((k) => <Cip key={k} name="katlar" value={String(k)} etiket={`${k}. kat`} />)}
              </Bolum>
            ) : null}
            {tipler.length ? (
              <Bolum baslik="Daire tipleri">
                {tipler.map((t) => <Cip key={t.id} name="tipler" value={t.id} etiket={t.oda ?? t.ad ?? "Tip"} />)}
              </Bolum>
            ) : null}
            <Bolum baslik="Birim türleri">
              {TURLER.map(([v, et]) => <Cip key={v} name="turler" value={v} etiket={et} />)}
            </Bolum>

            {/* Belirli daireler — bloklara göre katlanır (uzun olabilir) */}
            {bloklaGruplu.length ? (
              <div>
                <p className="text-xs font-semibold text-ink">
                  Belirli daireler
                  <span className="ml-1 font-normal text-gray">(tek tek seç — bloğa tıkla aç)</span>
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {bloklaGruplu.map((g) => (
                    <details key={g.blokId} className="rounded-lg border border-hair bg-card">
                      <summary className="cursor-pointer list-none px-3 py-2 text-[13px] font-medium text-ink">
                        <span className="select-none">▸ </span>
                        {g.ad}
                        <span className="ml-1 font-normal text-gray">({g.liste.length} daire)</span>
                      </summary>
                      <div className="flex flex-wrap gap-1.5 border-t border-hair px-3 py-2.5">
                        {g.liste.map((bi) => (
                          <Cip key={bi.id} name="birimler" value={bi.id} etiket={bi.daire_no ?? "—"} />
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="text-[11px] text-gray">
              Boş bıraktığın katman tümünü kapsar (ör. yalnız &quot;A Blok&quot; seçersen tüm A blok). Daire seçersen yalnız o daireler.
            </p>
          </div>
        ) : null}
      </div>

      {/* ŞARTLAR — seçili tüm alıcılara aynı uygulanır */}
      <div className="space-y-3 rounded-xl border border-hair bg-card p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray">Şartlar</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-gray">
            Komisyon
            <select
              name="komisyon_tip"
              value={komisyon}
              onChange={(e) => setKomisyon(e.target.value as "yuzde" | "sabit" | "yok")}
              className={inp}
            >
              <option value="yuzde">% Yüzde</option>
              <option value="sabit">Sabit ₺</option>
              <option value="yok">Yok</option>
            </select>
          </label>
          {komisyon !== "yok" ? (
            <label className="flex flex-col gap-1 text-xs text-gray">
              {komisyon === "yuzde" ? "Yüzde (%)" : "Tutar (₺)"}
              <input name="komisyon_deger" type="number" min={0} step={komisyon === "yuzde" ? 0.5 : 1000} className={`${inp} w-28`} />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-xs text-gray">
            Kontenjan <span className="font-normal">(birim)</span>
            <input name="kontenjan" type="number" min={1} placeholder="sınırsız" className={`${inp} w-28`} />
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 pb-1 text-sm text-ink">
            <input type="checkbox" name="munhasir" className="size-4 accent-teal" />
            Münhasır
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray">
            Erişim süresi <span className="font-normal">(gün)</span>
            <input name="bitis_gun" type="number" min={1} placeholder="süresiz" className={`${inp} w-28`} />
          </label>
          <label className="flex items-center gap-2 pb-1 text-sm text-ink">
            <input type="checkbox" name="fiyat_gorunur" defaultChecked className="size-4 accent-teal" /> Fiyat görünür
          </label>
        </div>
        <p className="text-[11px] text-gray">
          Seçili tüm alıcılara <span className="font-medium text-ink">aynı şart</span> uygulanır; farklı şart için ayrı kayıt yap.
        </p>
      </div>

      <SubmitButton className="justify-self-start">Tahsis et</SubmitButton>
    </form>
  );
}
