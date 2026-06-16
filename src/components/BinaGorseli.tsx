/**
 * Modern konut sitesi illüstrasyonu (karikatür ama tanınır: katlar, balkonlar, çatı, cam giriş,
 * peyzaj, havuz, ağaçlar). Gerçek render foto yokken proje kartlarına "konut projesi" hissi verir.
 * seed → pencere aydınlatma deseni sabit (SSR/CSR hydration tutarlı). Saf — render-body reassign yok.
 */
function cephe(
  bx: number,
  by: number,
  bw: number,
  bh: number,
  katlar: number,
  sutun: number,
  govde: string,
  seed: number,
) {
  const pad = 10;
  const katH = (bh - pad) / katlar;
  const colW = (bw - pad * 2) / sutun;
  const pencereler: React.ReactElement[] = [];
  const balkonlar: React.ReactElement[] = [];
  let k = (Math.abs(seed) % 233280) || 1;
  const rnd = () => {
    k = (k * 9301 + 49297) % 233280;
    return k / 233280;
  };
  for (let kat = 0; kat < katlar; kat++) {
    const y = by + pad + kat * katH;
    for (let c = 0; c < sutun; c++) {
      const x = bx + pad + c * colW;
      const aydinlik = rnd() < 0.32;
      // pencere
      pencereler.push(
        <rect
          key={`w${kat}-${c}`}
          x={x + colW * 0.16}
          y={y + katH * 0.18}
          width={colW * 0.68}
          height={katH * 0.5}
          rx={1.5}
          fill={aydinlik ? "#FCE9B8" : "#BFE0F0"}
          opacity={aydinlik ? 0.95 : 0.85}
        />,
      );
      // balkon (alt katlarda, çift sütun)
      if (kat > 0 && c % 2 === 0) {
        balkonlar.push(
          <g key={`b${kat}-${c}`}>
            <rect x={x + 1} y={y + katH * 0.72} width={colW - 2} height={katH * 0.2} fill="#0E2233" opacity="0.18" />
            <rect x={x + 1} y={y + katH * 0.72} width={colW - 2} height={2.5} fill="#fff" opacity="0.5" />
          </g>,
        );
      }
    }
  }
  return (
    <g>
      <rect x={bx} y={by} width={bw} height={bh} rx={4} fill={govde} />
      {/* çatı teknik kat */}
      <rect x={bx - 3} y={by - 7} width={bw + 6} height={9} rx={2} fill="#0E2233" opacity="0.55" />
      {balkonlar}
      {pencereler}
      {/* zemin cam giriş / lobi */}
      <rect x={bx + bw * 0.28} y={by + bh - 26} width={bw * 0.44} height={26} fill="#A9D4E6" opacity="0.9" />
      <rect x={bx + bw * 0.28} y={by + bh - 26} width={bw * 0.44} height={26} fill="none" stroke="#0E2233" strokeWidth="0.8" opacity="0.3" />
    </g>
  );
}

function agac(cx: number, cy: number, r: number) {
  return (
    <g>
      <rect x={cx - 2} y={cy} width={4} height={r * 0.7} fill="#7A5A3A" />
      <circle cx={cx} cy={cy} r={r} fill="#3E8E5E" />
      <circle cx={cx - r * 0.5} cy={cy + r * 0.2} r={r * 0.7} fill="#4CA570" />
      <circle cx={cx + r * 0.5} cy={cy + r * 0.15} r={r * 0.65} fill="#3E8E5E" />
    </g>
  );
}

export function BinaGorseli({ seed = 7, className = "" }: { seed?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 640 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`gok-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BFDCEC" />
          <stop offset="1" stopColor="#ECF5F9" />
        </linearGradient>
        <linearGradient id={`bA-${seed}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1B3A54" />
          <stop offset="1" stopColor="#27506E" />
        </linearGradient>
        <linearGradient id={`bB-${seed}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#17806F" />
          <stop offset="1" stopColor="#1E9B8A" />
        </linearGradient>
      </defs>

      {/* gökyüzü */}
      <rect width="640" height="300" fill={`url(#gok-${seed})`} />
      {/* güneş + bulutlar */}
      <circle cx="585" cy="48" r="26" fill="#FBE7BE" opacity="0.9" />
      <ellipse cx="120" cy="48" rx="46" ry="16" fill="#fff" opacity="0.75" />
      <ellipse cx="160" cy="40" rx="34" ry="14" fill="#fff" opacity="0.65" />
      <ellipse cx="470" cy="60" rx="40" ry="14" fill="#fff" opacity="0.6" />

      {/* arka binalar (silüet, derinlik) */}
      <rect x="20" y="120" width="90" height="130" rx="3" fill="#9FBED0" opacity="0.7" />
      <rect x="525" y="100" width="95" height="150" rx="3" fill="#9FBED0" opacity="0.7" />

      {/* zemin / peyzaj */}
      <rect y="240" width="640" height="60" fill="#DBEFE0" />
      <path d="M0 252 Q 320 238 640 252 L640 300 L0 300 Z" fill="#CDE7D4" />
      {/* yürüyüş yolu */}
      <path d="M250 300 L300 252 L360 252 L330 300 Z" fill="#E7ECE9" />

      {/* havuz */}
      <ellipse cx="455" cy="270" rx="74" ry="15" fill="#86CFE0" />
      <ellipse cx="455" cy="268" rx="74" ry="13" fill="#A6DEEC" />

      {/* ANA BİNA A (geniş, sol) */}
      {cephe(70, 92, 210, 150, 6, 5, `url(#bA-${seed})`, seed)}
      {/* ANA BİNA B (yüksek, sağ-orta) */}
      {cephe(320, 62, 150, 180, 8, 4, `url(#bB-${seed})`, seed + 41)}

      {/* peyzaj ağaçları */}
      {agac(40, 250, 18)}
      {agac(300, 248, 14)}
      {agac(610, 246, 16)}
      {agac(500, 250, 12)}
    </svg>
  );
}
