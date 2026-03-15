interface Props {
  label: string;
  value: number;
  unit: string;
  color: string;
  bgColor: string;
  max: number;
  icon: string;
}

export default function MacroBar({ label, value, unit, color, bgColor, max, icon }: Props) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: "var(--radius)",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>{icon}</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink-muted)", letterSpacing: "0.03em" }}>
            {label}
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color }}>
          {value}
          <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--ink-light)", marginLeft: "2px" }}>
            {unit}
          </span>
        </span>
      </div>

      <div style={{ height: "5px", background: "rgba(0,0,0,0.08)", borderRadius: "99px", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "99px",
            transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </div>
    </div>
  );
}
