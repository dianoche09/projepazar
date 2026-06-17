// ProjePazar 3×3 logo loader — sinyal renkleri dalga hâlinde parlar.
const HUCRELER = [
  { renk: "#1E9B8A", g: 0.0 },
  { renk: "#13314B", g: 0.08 },
  { renk: "#E3A12C", g: 0.16 },
  { renk: "#13314B", g: 0.08 },
  { renk: "#2FB36B", g: 0.16 },
  { renk: "#D15A4E", g: 0.24 },
  { renk: "#E3A12C", g: 0.16 },
  { renk: "#2FB36B", g: 0.24 },
  { renk: "#1E9B8A", g: 0.32 },
];

export function LogoLoader({ boyut = 13, etiket = "yükleniyor…" }: { boyut?: number; etiket?: string }) {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-label="Yükleniyor">
      <div className="grid grid-cols-3 gap-1.5">
        {HUCRELER.map((c, i) => (
          <span
            key={i}
            style={{
              width: boyut,
              height: boyut,
              background: c.renk,
              borderRadius: boyut * 0.28,
              animation: `hucrePulse 1.1s ${c.g}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
      {etiket ? <span className="font-mono text-xs text-gray">{etiket}</span> : null}
    </div>
  );
}
