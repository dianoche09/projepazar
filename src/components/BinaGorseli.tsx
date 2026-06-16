/**
 * Bina render illüstrasyonu (Ekranlar.html `renderSVG` — React/saf/deterministik).
 * Gerçek foto yokken proje kartlarına "render görsel" hissi verir. seed → sabit pencere deseni
 * (SSR/CSR hydration tutarlı). Saf helper (render body'sinde reassign yok).
 */
function pencereler(x: number, y: number, w: number, h: number, seed: number) {
  const out: { x: number; y: number }[] = [];
  const satir = Math.floor(h / 26);
  const sutun = Math.floor(w / 26);
  let k = (Math.abs(seed) % 233280) || 1;
  for (let i = 0; i < satir; i++) {
    for (let j = 0; j < sutun; j++) {
      k = (k * 9301 + 49297) % 233280;
      if (k / 233280 < 0.22) continue;
      out.push({ x: x + j * 26, y: y + i * 26 });
    }
  }
  return out;
}

export function BinaGorseli({
  seed = 7,
  className = "",
  rounded = false,
}: {
  seed?: number;
  className?: string;
  rounded?: boolean;
}) {
  const w1 = pencereler(86, 86, 150, 190, seed);
  const w2 = pencereler(266, 56, 140, 220, seed + 13);
  const w3 = pencereler(436, 111, 150, 165, seed + 29);

  return (
    <svg
      viewBox="0 0 640 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden
    >
      <rect width="640" height="300" fill="#D7E6EE" />
      <circle cx="560" cy="56" r="34" fill="#F6E6C4" />
      <rect y="210" width="640" height="90" fill="#E2EEE3" />
      <rect x="70" y="70" width="150" height="190" rx={rounded ? 10 : 6} fill="#1E3A55" />
      <rect x="250" y="40" width="140" height="220" rx={rounded ? 10 : 6} fill="#214A63" />
      <rect x="420" y="95" width="150" height="165" rx={rounded ? 10 : 6} fill="#1E3A55" />
      <g fill="#9FC3D6" opacity="0.85">
        {w1.map((p, i) => (
          <rect key={`a${i}`} x={p.x} y={p.y} width="15" height="16" rx="1.5" />
        ))}
        {w2.map((p, i) => (
          <rect key={`b${i}`} x={p.x} y={p.y} width="15" height="16" rx="1.5" />
        ))}
        {w3.map((p, i) => (
          <rect key={`c${i}`} x={p.x} y={p.y} width="15" height="16" rx="1.5" />
        ))}
      </g>
      <ellipse cx="320" cy="270" rx="120" ry="20" fill="#BFE3DA" />
      <circle cx="40" cy="250" r="22" fill="#3E7E5C" />
      <circle cx="610" cy="250" r="20" fill="#3E7E5C" />
      <circle cx="600" cy="240" r="16" fill="#4C9A6E" />
    </svg>
  );
}
