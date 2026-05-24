import { useMemo, useState } from "react";
import { LossResults, ResistanceCurvePoint } from "../physics/loss";
import { SamplePoint, SlabSolution } from "../physics/slabModel";
import { formatPhase, formatSci } from "../utils/format";
import { DisplayOptions } from "./displayTypes";
import { ResistanceCurvePlot } from "./ResistanceCurvePlot";

type Series = {
  x: number;
  y: number;
};

type PlotProps = {
  title: string;
  subtitle?: string;
  data: Series[];
  color?: string;
  yLabel?: string;
  zeroLine?: boolean;
  logScale?: boolean;
  xLabel?: string;
  xTicks?: number[];
};

const width = 460;
const height = 185;
const pad = { left: 50, right: 16, top: 22, bottom: 31 };

const toPlotY = (value: number, logScale?: boolean) => {
  if (!logScale) return value;
  return Math.log10(Math.max(value, 1e-18));
};

function pathFromData(data: Series[], yMin: number, yMax: number, xMin: number, xMax: number, logScale?: boolean) {
  const xScale = (x: number) => pad.left + ((x - xMin) / (xMax - xMin || 1)) * (width - pad.left - pad.right);
  const yScale = (y: number) => pad.top + (1 - (toPlotY(y, logScale) - yMin) / (yMax - yMin || 1)) * (height - pad.top - pad.bottom);
  return data
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xScale(point.x).toFixed(2)} ${yScale(point.y).toFixed(2)}`)
    .join(" ");
}

function Plot({
  title,
  subtitle,
  data,
  color = "#5c2d91",
  yLabel,
  zeroLine,
  logScale,
  xLabel = "x/a",
  xTicks = [-1, -0.5, 0, 0.5, 1],
}: PlotProps) {
  const finiteData = data.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const xValues = finiteData.map((point) => point.x);
  const yValues = finiteData.map((point) => toPlotY(point.y, logScale));
  const rawMin = Math.min(...yValues, logScale ? -6 : 0);
  const rawMax = Math.max(...yValues, logScale ? 0 : 1);
  const span = rawMax - rawMin || Math.max(Math.abs(rawMax), 1);
  const yMin = rawMin - span * 0.08;
  const yMax = rawMax + span * 0.08;
  const xMin = Math.min(...xValues, xTicks[0] ?? -1);
  const xMax = Math.max(...xValues, xTicks[xTicks.length - 1] ?? 1);
  const x0 = pad.left;
  const x1 = width - pad.right;
  const y0 = height - pad.bottom;
  const y1 = pad.top;
  const zeroY = pad.top + (1 - (toPlotY(0, logScale) - yMin) / (yMax - yMin || 1)) * (height - pad.top - pad.bottom);
  const xScale = (x: number) => pad.left + ((x - xMin) / (xMax - xMin || 1)) * (width - pad.left - pad.right);

  return (
    <article className="plot-card">
      <div className="plot-header">
        <h3>{title}</h3>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <rect x={0} y={0} width={width} height={height} className="plot-bg" />
        <line x1={x0} x2={x1} y1={y0} y2={y0} className="axis" />
        <line x1={x0} x2={x0} y1={y0} y2={y1} className="axis" />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = y0 - t * (y0 - y1);
          return <line key={t} x1={x0} x2={x1} y1={y} y2={y} className="grid" />;
        })}
        {xTicks.map((tick) => {
          const x = xScale(tick);
          return (
            <g key={tick}>
              <line x1={x} x2={x} y1={y0} y2={y0 + 4} className="axis" />
              <text x={x} y={height - 12} textAnchor="middle" className="tick">
                {tick}
              </text>
            </g>
          );
        })}
        {zeroLine && !logScale && zeroY >= y1 && zeroY <= y0 ? <line x1={x0} x2={x1} y1={zeroY} y2={zeroY} className="zero-line" /> : null}
        <path d={pathFromData(finiteData, yMin, yMax, xMin, xMax, logScale)} fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        <text x={pad.left - 8} y={pad.top - 8} textAnchor="end" className="tick">
          {logScale ? `1e${Math.round(yMax)}` : formatSci(yMax, 2)}
        </text>
        <text x={pad.left - 8} y={height - pad.bottom + 4} textAnchor="end" className="tick">
          {logScale ? `1e${Math.round(yMin)}` : formatSci(yMin, 2)}
        </text>
        <text x={(x0 + x1) / 2} y={height - 2} textAnchor="middle" className="axis-label">
          {xLabel}
        </text>
        {yLabel ? (
          <text x={14} y={(y0 + y1) / 2} textAnchor="middle" className="axis-label rotate-label">
            {yLabel}
          </text>
        ) : null}
      </svg>
    </article>
  );
}

type FieldPlotsProps = {
  solution: SlabSolution;
  losses: LossResults;
  curve: ResistanceCurvePoint[];
  display: DisplayOptions;
};

const nearestPoint = (points: SamplePoint[], xOverA: number): SamplePoint =>
  points.reduce((best, point) => (Math.abs(point.xOverA - xOverA) < Math.abs(best.xOverA - xOverA) ? point : best), points[0]);

const fieldRegion = (point: SamplePoint, solution: SlabSolution): string => {
  const sOverDelta = (solution.input.a - Math.abs(point.x)) / solution.delta;
  return sOverDelta <= 3 ? "表面层" : "内部区域";
};

function ProbePanel({ solution }: { solution: SlabSolution }) {
  const [probe, setProbe] = useState(0);
  const point = nearestPoint(solution.points, probe);
  const sOverDelta = (solution.input.a - Math.abs(point.x)) / solution.delta;

  return (
    <section className="panel probe-panel">
      <div className="panel-title">
        <h2>探针数据</h2>
        <span className="probe-tag">{fieldRegion(point, solution)}</span>
      </div>
      <label>
        probe x/a: {point.xOverA.toFixed(3)}
        <input type="range" min="-1" max="1" step="0.002" value={probe} onChange={(event) => setProbe(Number(event.target.value))} />
      </label>
      <div className="probe-grid">
        <span>x/a <strong>{point.xOverA.toFixed(3)}</strong></span>
        <span>s/delta <strong>{formatSci(sOverDelta, 3)}</strong></span>
        <span>|H_y| <strong>{formatSci(point.hyAbs)}</strong></span>
        <span>phase(H_y) <strong>{formatPhase(point.hyPhase)}</strong></span>
        <span>|J_z| <strong>{formatSci(point.jAbs)}</strong></span>
        <span>phase(J_z) <strong>{formatPhase(point.jPhase)}</strong></span>
        <span>q''' <strong>{formatSci(point.heat)}</strong></span>
      </div>
    </section>
  );
}

function surfaceSeries(solution: SlabSolution, side: "left" | "right", value: "j" | "heat", normalized: boolean): Series[] {
  const maxJ = Math.max(...solution.points.map((point) => point.jAbs), 1);
  const maxHeat = Math.max(...solution.points.map((point) => point.heat), 1);
  return solution.points
    .map((point) => {
      const s = side === "left" ? point.x + solution.input.a : solution.input.a - point.x;
      return {
        x: s / solution.delta,
        y: value === "j" ? point.jAbs / (normalized ? maxJ : 1) : point.heat / (normalized ? maxHeat : 1),
      };
    })
    .filter((point) => point.x >= 0 && point.x <= 8)
    .sort((a, b) => a.x - b.x);
}

function SurfaceZoom({ solution, display }: { solution: SlabSolution; display: DisplayOptions }) {
  const normalized = display.amplitudeMode === "normalized";
  const logScale = display.scaleMode === "log";
  const leftJ = surfaceSeries(solution, "left", "j", normalized);
  const rightJ = surfaceSeries(solution, "right", "j", normalized);
  const leftHeat = surfaceSeries(solution, "left", "heat", normalized);
  const rightHeat = surfaceSeries(solution, "right", "heat", normalized);
  const showLeft = display.surfaceSide === "left" || display.surfaceSide === "both";
  const showRight = display.surfaceSide === "right" || display.surfaceSide === "both";
  const visibleSeries = [
    ...(showLeft ? [leftJ, leftHeat] : []),
    ...(showRight ? [rightJ, rightHeat] : []),
  ].flat();
  const yMax = normalized ? 1 : Math.max(...visibleSeries.map((point) => point.y), 1);
  const yMin = logScale ? Math.log10(Math.max(yMax, 1e-18)) - 8 : 0;
  const plotYMax = logScale ? Math.log10(Math.max(yMax, 1e-18)) : yMax;

  return (
    <article className="plot-card surface-zoom-card">
      <div className="plot-header">
        <h3>表面层放大</h3>
        <span>s/delta, 0 到 8</span>
      </div>
      <div className="surface-legend">
        {showLeft ? <span className="legend-j">左 |J|</span> : null}
        {showRight ? <span className="legend-j right">右 |J|</span> : null}
        <span className="legend-q">q'''</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="表面层放大">
        <rect x={0} y={0} width={width} height={height} className="plot-bg" />
        <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} className="axis" />
        <line x1={pad.left} x2={pad.left} y1={height - pad.bottom} y2={pad.top} className="axis" />
        {[0, 2, 4, 6, 8].map((tick) => {
          const x = pad.left + (tick / 8) * (width - pad.left - pad.right);
          return (
            <g key={tick}>
              <line x1={x} x2={x} y1={height - pad.bottom} y2={height - pad.bottom + 4} className="axis" />
              <text x={x} y={height - 12} textAnchor="middle" className="tick">
                {tick}
              </text>
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = height - pad.bottom - t * (height - pad.bottom - pad.top);
          return <line key={t} x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="grid" />;
        })}
        {showLeft ? <path d={pathFromData(leftJ, yMin, plotYMax, 0, 8, logScale)} fill="none" stroke="#5c2d91" strokeWidth="2.5" /> : null}
        {showRight ? <path d={pathFromData(rightJ, yMin, plotYMax, 0, 8, logScale)} fill="none" stroke="#007c89" strokeWidth="2.5" /> : null}
        {showLeft ? <path d={pathFromData(leftHeat, yMin, plotYMax, 0, 8, logScale)} fill="none" stroke="#ba4a00" strokeWidth="1.8" strokeDasharray="4 4" /> : null}
        {showRight ? <path d={pathFromData(rightHeat, yMin, plotYMax, 0, 8, logScale)} fill="none" stroke="#d97706" strokeWidth="1.8" strokeDasharray="4 4" /> : null}
        <text x={(pad.left + width - pad.right) / 2} y={height - 2} textAnchor="middle" className="axis-label">
          s/delta
        </text>
        <text x={14} y={(height - pad.bottom + pad.top) / 2} textAnchor="middle" className="axis-label rotate-label">
          {normalized ? "normalized" : "absolute"}
        </text>
      </svg>
      {solution.input.a / solution.delta > 5 ? <p className="plot-note">强集肤: 主要变化集中在约 1~3 个 delta 内。</p> : null}
    </article>
  );
}

export function FieldPlots({ solution, losses, curve, display }: FieldPlotsProps) {
  const input = solution.input;
  const normalized = display.amplitudeMode === "normalized";
  const logScale = display.scaleMode === "log";
  const maxJ = Math.max(...solution.points.map((point) => point.jAbs), 1);
  const maxHeat = Math.max(...solution.points.map((point) => point.heat), 1);
  const maxHy = Math.max(...solution.points.map((point) => point.hyAbs), 1);
  const showFull = display.viewMode === "full" || display.viewMode === "both";
  const showSurface = display.viewMode === "surface" || display.viewMode === "both";
  const subtitle = normalized ? "归一化" : "RMS";

  const plotData = useMemo(
    () => ({
      j: solution.points.map((point) => ({ x: point.xOverA, y: normalized ? point.jAbs / maxJ : point.jAbs })),
      phaseJ: solution.points.map((point) => ({ x: point.xOverA, y: point.jPhase })),
      heat: solution.points.map((point) => ({ x: point.xOverA, y: normalized ? point.heat / maxHeat : point.heat })),
      hy: solution.points.map((point) => ({ x: point.xOverA, y: normalized ? point.hyAbs / maxHy : point.hyAbs })),
      phaseHy: solution.points.map((point) => ({ x: point.xOverA, y: point.hyPhase })),
    }),
    [solution.points, normalized, maxJ, maxHeat, maxHy],
  );

  return (
    <section className="plot-section">
      <div className="plot-grid">
        <ResistanceCurvePlot solution={solution} losses={losses} curve={curve} />
        {showSurface ? <SurfaceZoom solution={solution} display={display} /> : null}
        <ProbePanel solution={solution} />
        {showFull ? (
          <>
            <Plot
              title="电流密度幅值分布"
              subtitle={`${subtitle} ${logScale ? "log" : "linear"}`}
              yLabel={normalized ? "|J|/max" : "A/m^2"}
              logScale={logScale}
              data={plotData.j}
            />
            <Plot
              title="单位体积热源分布"
              subtitle={`${subtitle} ${logScale ? "log" : "linear"}`}
              yLabel={normalized ? "q/max" : "W/m^3"}
              color="#ba4a00"
              logScale={logScale}
              data={plotData.heat}
            />
            <Plot
              title="磁场幅值分布"
              subtitle={`${subtitle} ${logScale ? "log" : "linear"}`}
              yLabel={normalized ? "|H|/max" : "A/m"}
              color="#4f7d22"
              logScale={logScale}
              data={plotData.hy}
            />
            <Plot title="J_z 相位" subtitle="arg(Jz), rad" yLabel="rad" color="#007c89" zeroLine data={plotData.phaseJ} />
            <Plot title="H_y 相位" subtitle="arg(Hy), rad" yLabel="rad" color="#725ac1" zeroLine data={plotData.phaseHy} />
          </>
        ) : null}
        {!showFull && showSurface ? null : null}
      </div>
      {input.mode === "B" ? <p className="panel-subtitle">模式 B 主指标是涡流损耗，不显示端子交流电阻当前点。</p> : null}
    </section>
  );
}
