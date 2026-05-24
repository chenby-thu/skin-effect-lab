import { AlertTriangle } from "lucide-react";
import { interpolateResistanceCurve, LossResults, ResistanceCurvePoint } from "../physics/loss";
import { SlabSolution } from "../physics/slabModel";
import { formatSci } from "../utils/format";

type ResistanceCurvePlotProps = {
  solution: SlabSolution;
  losses: LossResults;
  curve: ResistanceCurvePoint[];
};

const width = 460;
const height = 185;
const pad = { left: 50, right: 16, top: 22, bottom: 31 };

const tickValues = (xMin: number, xMax: number): number[] => {
  const minPower = Math.ceil(xMin);
  const maxPower = Math.floor(xMax);
  return Array.from({ length: maxPower - minPower + 1 }, (_, index) => 10 ** (minPower + index));
};

export function ResistanceCurvePlot({ solution, losses, curve }: ResistanceCurvePlotProps) {
  const ratio = solution.input.a / solution.delta;
  const mode = solution.input.mode;
  const isPureAMode = mode === "A" && Math.abs(solution.input.h0) < 1e-12 && solution.input.current > 0;
  const referenceValue = interpolateResistanceCurve(curve, ratio);
  const relativeCurveError =
    isPureAMode && referenceValue !== null && losses.racOverRdc !== null
      ? Math.abs(losses.racOverRdc - referenceValue) / Math.max(referenceValue, 1e-12)
      : null;
  const shouldWarn = relativeCurveError !== null && relativeCurveError > 0.05;

  const xs = curve.map((point) => Math.log10(point.ratio));
  const ys = curve.map((point) => point.value).filter(Number.isFinite);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = 0.8;
  const yMax = Math.max(...ys, losses.racOverRdc ?? 1, 2) * 1.08;
  const sx = (x: number) => pad.left + ((Math.log10(x) - xMin) / (xMax - xMin || 1)) * (width - pad.left - pad.right);
  const sy = (y: number) => pad.top + (1 - (y - yMin) / (yMax - yMin || 1)) * (height - pad.top - pad.bottom);
  const path = curve
    .map((point, index) => `${index === 0 ? "M" : "L"} ${sx(point.ratio).toFixed(2)} ${sy(point.value).toFixed(2)}`)
    .join(" ");
  const currentX = sx(ratio);
  const currentY = losses.racOverRdc !== null ? sy(losses.racOverRdc) : null;
  const markerVisible =
    currentY !== null &&
    Number.isFinite(currentX) &&
    Number.isFinite(currentY) &&
    currentX >= pad.left - 0.1 &&
    currentX <= width - pad.right + 0.1;

  const title = mode === "A" ? "纯集肤 R_ac/R_dc 曲线" : mode === "C" ? "纯 Mode A 曲线参考" : "涡流损耗模式";
  const subtitle = mode === "A" ? "端子电流定义" : mode === "C" ? "等效损耗指标" : "R_ac 不定义";

  return (
    <article className="plot-card resistance-curve-card">
      <div className="plot-header">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      {mode === "B" ? (
        <div className="plot-message">
          <strong>无端子电流，不定义端子交流电阻。</strong>
          <span>请看 P_eddy'、q'''_max、表面/中心热源比与 I_net≈0 校验。</span>
        </div>
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
            <rect x={0} y={0} width={width} height={height} className="plot-bg" />
            <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} className="axis" />
            <line x1={pad.left} x2={pad.left} y1={height - pad.bottom} y2={pad.top} className="axis" />
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = height - pad.bottom - t * (height - pad.bottom - pad.top);
              return <line key={t} x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="grid" />;
            })}
            {tickValues(xMin, xMax).map((tick) => {
              const x = sx(tick);
              return (
                <g key={tick}>
                  <line x1={x} x2={x} y1={height - pad.bottom} y2={height - pad.bottom + 4} className="axis" />
                  <text x={x} y={height - 12} textAnchor="middle" className="tick">
                    {formatSci(tick, 1)}
                  </text>
                </g>
              );
            })}
            <path d={path} fill="none" stroke="#5c2d91" strokeWidth="2.4" strokeDasharray={mode === "C" ? "5 5" : undefined} />
            {markerVisible ? (
              <g>
                <line x1={currentX} x2={currentX} y1={pad.top} y2={height - pad.bottom} className="marker-line" />
                {mode === "C" ? (
                  <path
                    d={`M ${currentX} ${currentY - 6} L ${currentX + 6} ${currentY} L ${currentX} ${currentY + 6} L ${currentX - 6} ${currentY} Z`}
                    className="marker-diamond"
                  />
                ) : (
                  <circle cx={currentX} cy={currentY} r="5.5" className="marker-dot" />
                )}
              </g>
            ) : null}
            <text x={(pad.left + width - pad.right) / 2} y={height - 2} textAnchor="middle" className="axis-label">
              a/δ
            </text>
            <text x={14} y={(height - pad.bottom + pad.top) / 2} textAnchor="middle" className="axis-label rotate-label">
              R/R_dc
            </text>
          </svg>
          <p className="plot-note">
            {mode === "C"
              ? "Mode C 当前点为等效损耗，含外场诱发涡流与端子电流叠加；偏离纯 Mode A 曲线是物理结果。"
              : `当前 a/δ = ${formatSci(ratio, 3)}。曲线与当前点使用同一 P'=b/σ ∫|J|² dx 定义。`}
          </p>
          {shouldWarn ? (
            <p className="plot-warning">
              <AlertTriangle size={14} />
              当前纯 A 点与曲线插值相差 {(relativeCurveError * 100).toFixed(1)}%，请检查采样或参数范围。
            </p>
          ) : null}
        </>
      )}
    </article>
  );
}
