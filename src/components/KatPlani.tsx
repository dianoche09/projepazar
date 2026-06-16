/** Daire/kat planı SVG (Ekranlar.html `planSVG`). Gerçek plan görseli yokken şematik plan. */
export function KatPlani({ etiket, buyuk = false }: { etiket?: string; buyuk?: boolean }) {
  const H = buyuk ? 260 : 120;
  const mono = "var(--font-geist-mono), ui-monospace, monospace";
  return (
    <svg
      viewBox="0 0 360 260"
      style={{ width: "100%", height: H, display: "block", background: "#FBFCFD", borderRadius: 10 }}
      aria-hidden
    >
      <g stroke="#A9B6BF" strokeWidth={1.3} fill="#EEF3F6">
        <rect x={14} y={14} width={170} height={84} />
        <rect x={14} y={98} width={170} height={78} />
        <rect x={14} y={176} width={96} height={70} />
        <rect x={110} y={176} width={74} height={35} />
        <rect x={110} y={211} width={74} height={35} />
        <rect x={184} y={14} width={162} height={162} />
        <rect x={184} y={176} width={162} height={70} fill="#E4F0E8" />
      </g>
      <rect x={14} y={14} width={332} height={232} fill="none" stroke="#2C4256" strokeWidth={3} />
      <g fontFamily={mono} fontSize={10} fill="#5E6B78">
        <text x={99} y={58} textAnchor="middle">Ebeveyn Y.O.</text>
        <text x={99} y={140} textAnchor="middle">Yatak Odası</text>
        <text x={62} y={214} textAnchor="middle">Mutfak</text>
        <text x={147} y={197} textAnchor="middle">Antre</text>
        <text x={147} y={232} textAnchor="middle">Banyo</text>
        <text x={265} y={96} textAnchor="middle" fontSize={12} fill="#2C4256">Salon</text>
        <text x={265} y={214} textAnchor="middle">Balkon / Teras</text>
      </g>
      <g transform="translate(326,30)">
        <circle r={11} fill="#fff" stroke="#A9B6BF" />
        <path d="M0,-7 L4,5 L0,2 L-4,5 Z" fill="#D15A4E" />
        <text y={20} textAnchor="middle" fontFamily={mono} fontSize={9} fill="#5E6B78">K</text>
      </g>
      {etiket ? (
        <>
          <rect x={14} y={14} width={92} height={22} fill="#13314B" />
          <text x={60} y={29} textAnchor="middle" fontFamily={mono} fontSize={11} fill="#fff">{etiket}</text>
        </>
      ) : null}
    </svg>
  );
}
