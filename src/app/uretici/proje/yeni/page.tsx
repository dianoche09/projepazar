import Link from "next/link";
import { projeOlustur } from "@/app/uretici/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Field, Input, Grup } from "@/components/ui/Form";

export default async function YeniProje({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const { hata } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link href="/uretici" className="text-sm font-medium text-teal hover:underline">
        ← Kokpit
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Yeni proje</h1>
      <p className="mt-1 text-sm text-gray">
        Önce künye. Sonra Kurulum&apos;da kapak &amp; belgeler, ardından blok / daire tipi tanımlayıp
        birim üretirsin.
      </p>

      {hata ? (
        <p role="alert" className="mt-4 rounded-xl border border-red/30 bg-red-soft px-3.5 py-2.5 text-sm text-red">
          {hata}
        </p>
      ) : null}

      <form action={projeOlustur} className="mt-6 rounded-2xl border border-hair bg-card p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-6">
          <Grup baslik="Kimlik">
            <Field label="Proje adı" required htmlFor="ad" className="sm:col-span-2">
              <Input id="ad" name="ad" required placeholder="Çankaya Vadi Konakları" />
            </Field>
          </Grup>

          <Grup baslik="Konum" aciklama="Projenin bulunduğu yer.">
            <Field label="İl" htmlFor="il">
              <Input id="il" name="il" placeholder="Ankara" />
            </Field>
            <Field label="İlçe" htmlFor="ilce">
              <Input id="ilce" name="ilce" placeholder="Çankaya" />
            </Field>
            <Field label="Mahalle" htmlFor="mahalle" className="sm:col-span-2">
              <Input id="mahalle" name="mahalle" placeholder="Kızılırmak" />
            </Field>
          </Grup>

          <Grup baslik="Parsel & Teslim" aciklama="İmar detayını (emsal/TAKS/ruhsat) Kurulum&apos;da tamamlarsın.">
            <Field label="Ada" htmlFor="ada">
              <Input id="ada" name="ada" placeholder="12345" />
            </Field>
            <Field label="Parsel" htmlFor="parsel">
              <Input id="parsel" name="parsel" placeholder="6" />
            </Field>
            <Field label="Tahmini teslim" htmlFor="teslim" className="sm:col-span-2">
              <Input id="teslim" name="teslim_tarihi" type="date" />
            </Field>
          </Grup>
        </div>

        <div className="mt-6 border-t border-hair pt-5">
          <SubmitButton className="w-full">Projeyi oluştur</SubmitButton>
        </div>
      </form>
    </div>
  );
}
