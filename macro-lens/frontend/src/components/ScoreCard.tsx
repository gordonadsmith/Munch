import { DayScore, StreakData } from "../types";
import { getScoreLabel } from "../useStreak";

interface Props {
  todayScore: DayScore | null;
  streakData: StreakData;
}

function ScoreRing({ score }: { score: number }) {
  const size = 72;
  const sw = 5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const { color } = getScoreLabel(score);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-mid)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={sw}
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color, lineHeight: 1 }}>{score}</p>
      </div>
    </div>
  );
}

function ScoreBreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "11px", color: "var(--ink-3)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color }}>{value}/{max}</span>
      </div>
      <div style={{ height: 4, background: "var(--border-mid)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: color, borderRadius: "var(--r-full)", transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

export default function ScoreCard({ todayScore, streakData }: Props) {
  const score = todayScore?.score ?? 0;
  const { label, color, emoji } = getScoreLabel(score);
  const hasData = todayScore && todayScore.entriesLogged > 0;

  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "18px 16px", boxShadow: "var(--shadow-sm)" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
        Munch Score
      </p>

      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: hasData ? "16px" : "0" }}>
        {hasData ? (
          <ScoreRing score={score} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--bg)", border: "2px dashed var(--border-mid)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "24px" }}>🎯</span>
          </div>
        )}

        <div style={{ flex: 1 }}>
          {hasData ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ fontSize: "18px" }}>{emoji}</span>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color, lineHeight: 1 }}>{label}</p>
              </div>
              <p style={{ fontSize: "12px", color: "var(--ink-4)" }}>{todayScore?.entriesLogged} meals logged today</p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--ink-3)", fontStyle: "italic", marginBottom: "4px" }}>No score yet</p>
              <p style={{ fontSize: "12px", color: "var(--ink-4)" }}>Log meals to earn your daily score</p>
            </>
          )}

          {/* Streak pills */}
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: streakData.currentStreak > 0 ? "#fff7ed" : "var(--bg)", borderRadius: "var(--r-full)", padding: "4px 10px", border: `1px solid ${streakData.currentStreak > 0 ? "rgba(251,146,60,0.3)" : "var(--border-mid)"}` }}>
              <span style={{ fontSize: "13px" }}>🔥</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: streakData.currentStreak > 0 ? "#c2410c" : "var(--ink-4)" }}>{streakData.currentStreak}</span>
              <span style={{ fontSize: "11px", color: "var(--ink-4)" }}>streak</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--bg)", borderRadius: "var(--r-full)", padding: "4px 10px", border: "1px solid var(--border-mid)" }}>
              <span style={{ fontSize: "13px" }}>🏆</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-2)" }}>{streakData.longestStreak}</span>
              <span style={{ fontSize: "11px", color: "var(--ink-4)" }}>best</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {hasData && todayScore && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
          <ScoreBreakdownBar label="Calories on target" value={todayScore.calorieScore} max={30} color="var(--forest)" />
          <ScoreBreakdownBar label="Protein goal" value={todayScore.proteinScore} max={25} color="var(--green)" />
          <ScoreBreakdownBar label="Food quality" value={todayScore.qualityScore} max={25} color="var(--amber-light)" />
          <ScoreBreakdownBar label="Meals logged" value={todayScore.logScore} max={20} color="var(--blue)" />
        </div>
      )}
    </div>
  );
}
