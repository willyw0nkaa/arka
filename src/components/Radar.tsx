export function Radar({ data, size = 260 }: { data: { label: string; value: number }[]; size?: number }) {
  const c = size / 2, r = size / 2 - 36, n = data.length;
  const pt = (i: number, v: number) => {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(ang) * r * (v / 100), c + Math.sin(ang) * r * (v / 100)] as const;
  };
  const poly = data.map((d, i) => pt(i, d.value).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[300px]" role="img" aria-label={data.map((d) => `${d.label} ${d.value}`).join(", ")}>
      <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6366f1" stopOpacity=".55" /><stop offset="1" stopColor="#06b6d4" stopOpacity=".45" /></linearGradient></defs>
      {[25, 50, 75, 100].map((lv) => (
        <polygon key={lv} points={data.map((_, i) => pt(i, lv).join(",")).join(" ")} fill="none" stroke="#cbd5e1" strokeWidth="1" />
      ))}
      {data.map((_, i) => { const [x, y] = pt(i, 100); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#e2e8f0" />; })}
      <polygon points={poly} fill="url(#rg)" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => { const [x, y] = pt(i, d.value); return <circle key={i} cx={x} cy={y} r="3.5" fill="#4f46e5" />; })}
      {data.map((d, i) => {
        const [x, y] = pt(i, 122);
        return <text key={d.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-700 text-[11px] font-semibold">{d.label}<tspan x={x} dy="13" className="fill-slate-500 font-normal">{d.value}</tspan></text>;
      })}
    </svg>
  );
}
