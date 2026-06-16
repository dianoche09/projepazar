import Link from "next/link";
import { projeOlustur } from "@/app/uretici/actions";

function Alan({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
      <span>
        {label}
        {required ? <span className="text-red"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-hair bg-paper px-3 py-2 font-sans text-base text-ink outline-none transition-colors focus:border-teal"
      />
    </label>
  );
}

export default async function YeniProje({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const { hata } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <Link href="/uretici" className="text-sm font-medium text-teal hover:underline">
        ← Kokpit
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Yeni proje</h1>
      <p className="mt-1 text-sm text-gray">
        Künyeyi gir; sonra blok/daire tipi tanımlayıp generator ile birimleri üretirsin.
      </p>

      {hata ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm text-red"
        >
          {hata}
        </p>
      ) : null}

      <form action={projeOlustur} className="mt-6 flex flex-col gap-4">
        <Alan name="ad" label="Proje adı" required placeholder="Çankaya Vadi Konakları" />
        <div className="grid grid-cols-2 gap-4">
          <Alan name="il" label="İl" placeholder="Ankara" />
          <Alan name="ilce" label="İlçe" placeholder="Çankaya" />
        </div>
        <Alan name="mahalle" label="Mahalle" placeholder="Kızılırmak" />
        <div className="grid grid-cols-2 gap-4">
          <Alan name="ada" label="Ada" placeholder="12345" />
          <Alan name="parsel" label="Parsel" placeholder="6" />
        </div>
        <Alan name="teslim_tarihi" label="Tahmini teslim" type="date" />

        <button className="mt-2 rounded-lg bg-navy px-4 py-2.5 font-medium text-white transition-colors hover:bg-ink">
          Projeyi oluştur
        </button>
      </form>
    </div>
  );
}
