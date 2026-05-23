import { Activity, Zap } from "lucide-react";
import { LossResults } from "../physics/loss";
import { SlabSolution } from "../physics/slabModel";
import { formatMm, formatPhase, formatSci } from "../utils/format";

type ResistancePanelProps = {
  solution: SlabSolution;
  losses: LossResults;
  curve: { ratio: number; value: number }[];
  showLimits: boolean;
};

type MetricProps = {
  label: string;
  value: string;
  unit?: string;
};

function Metric({ label, value, unit }: MetricProps) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {unit ? <small>{unit}</small> : null}
    </div>
  );
}

export function ResistancePanel({ solution, losses, curve, showLimits }: ResistancePanelProps) {
  const ratio = solution.input.a / solution.delta;
  const width = 620;
  const height = 260;
  const pad = { left: 58, right: 20, top: 28, bottom: 42 };
  const xs = curve.map((point) => Math.log10(point.ratio));
  const ys = curve.map((point) => point.value);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = 0.8;
  const yMax = Math.max(...ys, losses.racOverRdc ?? 1, 2) * 1.08;
  const sx = (x: number) => pad.left + ((Math.log10(x) - xMin) / (xMax - xMin)) * (width - pad.left - pad.right);
  const sy = (y: number) => pad.top + (1 - (y - yMin) / (yMax - yMin)) * (height - pad.top - pad.bottom);
  const path = curve.map((point, index) => `${index === 0 ? "M" : "L"} ${sx(point.ratio).toFixed(2)} ${sy(point.value).toFixed(2)}`).join(" ");
  const currentX = sx(ratio);
  const currentY = losses.racOverRdc ? sy(losses.racOverRdc) : null;
  const limitHint =
    solution.input.mode === "B"
      ? "该模式没有净传输电流，损耗来自闭合涡流。"
      : solution.input.mode === "C"
        ? "外加磁场会破坏两侧对称性，可视为一维邻近效应近似。"
        : ratio < 0.1
          ? "低频极限：电流近似均匀，Rac ≈ Rdc。"
          : ratio > 5
            ? "强集肤区：电流集中在导体表面附近。"
            : "中间频段：场和电流分布已偏离均匀直流状态。";

  return (
    <section className="panel">
      <div className="panel-title">
        <Zap size={18} />
        <h2>数值结果与交流电阻</h2>
      </div>
      <div className="metric-grid">
        <Metric label="δ 趋肤深度" value={formatMm(solution.delta)} />
        <Metric label="a/δ 集肤强度" value={formatSci(ratio, 3)} />
        <Metric label="Γ" value={`(${formatSci(solution.gamma.re) } + j${formatSci(solution.gamma.im)})`} unit="1/m" />
        <Metric label="Rdc'" value={formatSci(losses.rdc)} unit="Ω/m" />
        <Metric label="Pac'" value={formatSci(losses.pac)} unit="W/m" />
        <Metric label="Rac'" value={losses.rac === null ? "未定义" : formatSci(losses.rac)} unit={losses.rac === null ? undefined : "Ω/m"} />
        <Metric label="Rac'/Rdc'" value={losses.racOverRdc === null ? "未定义" : formatSci(losses.racOverRdc, 3)} />
        <Metric label="Inet" value={`${formatSci(losses.inetRe)} ${losses.inetIm >= 0 ? "+" : "-"} j${formatSci(Math.abs(losses.inetIm))}`} unit="A" />
        <Metric label="表面/中心热源" value={formatSci(losses.surfaceHeatRatio, 3)} />
        <Metric label="最大 |Jz| 位置" value={`${(losses.maxCurrentPosition / solution.input.a).toFixed(3)} a`} />
        <Metric label="最大 |Jz|" value={formatSci(losses.maxCurrentDensity)} unit="A/m²" />
        <Metric label="中心 J 相位" value={formatPhase(solution.points[Math.floor(solution.points.length / 2)].jPhase)} />
      </div>

      {showLimits ? (
        <div className="limit-hint">
          <Activity size={17} />
          <span>{limitHint}</span>
        </div>
      ) : null}

      <div className="curve-wrap">
        <h3>交流电阻随 a/δ 的变化</h3>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Rac/Rdc vs a/delta">
          <rect x="0" y="0" width={width} height={height} className="plot-bg" />
          <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} className="axis" />
          <line x1={pad.left} x2={pad.left} y1={pad.top} y2={height - pad.bottom} className="axis" />
          {[0.01, 0.1, 1, 10].map((tick) => (
            <g key={tick}>
              <line x1={sx(tick)} x2={sx(tick)} y1={height - pad.bottom} y2={height - pad.bottom + 4} className="axis" />
              <text x={sx(tick)} y={height - 14} textAnchor="middle" className="tick">
                {tick}
              </text>
            </g>
          ))}
          <path d={path} fill="none" stroke="#5c2d91" strokeWidth="2.8" />
          {currentY !== null && Number.isFinite(currentX) && Number.isFinite(currentY) ? (
            <g>
              <line x1={currentX} x2={currentX} y1={pad.top} y2={height - pad.bottom} className="marker-line" />
              <circle cx={currentX} cy={currentY} r="6" className="marker-dot" />
            </g>
          ) : null}
          <text x={width / 2} y={height - 2} textAnchor="middle" className="axis-label">
            a/δ
          </text>
          <text x="18" y={height / 2} textAnchor="middle" className="axis-label rotate-label">
            Rac/Rdc
          </text>
        </svg>
      </div>
    </section>
  );
}
