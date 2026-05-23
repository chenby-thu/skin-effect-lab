import { SlabSolution } from "../physics/slabModel";
import { formatSci } from "../utils/format";

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
};

const width = 460;
const height = 185;
const pad = { left: 50, right: 16, top: 22, bottom: 31 };

function pathFromData(data: Series[], yMin: number, yMax: number) {
  const xScale = (x: number) => pad.left + ((x + 1) / 2) * (width - pad.left - pad.right);
  const yScale = (y: number) => pad.top + (1 - (y - yMin) / (yMax - yMin || 1)) * (height - pad.top - pad.bottom);
  return data.map((point, index) => `${index === 0 ? "M" : "L"} ${xScale(point.x).toFixed(2)} ${yScale(point.y).toFixed(2)}`).join(" ");
}

function Plot({ title, subtitle, data, color = "#5c2d91", yLabel, zeroLine }: PlotProps) {
  const yValues = data.map((point) => point.y).filter(Number.isFinite);
  const rawMin = Math.min(...yValues, 0);
  const rawMax = Math.max(...yValues, 1);
  const span = rawMax - rawMin || Math.max(Math.abs(rawMax), 1);
  const yMin = rawMin - span * 0.08;
  const yMax = rawMax + span * 0.08;
  const x0 = pad.left;
  const x1 = width - pad.right;
  const y0 = height - pad.bottom;
  const y1 = pad.top;
  const zeroY = pad.top + (1 - (0 - yMin) / (yMax - yMin || 1)) * (height - pad.top - pad.bottom);

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
        {[-1, -0.5, 0, 0.5, 1].map((tick) => {
          const x = pad.left + ((tick + 1) / 2) * (width - pad.left - pad.right);
          return (
            <g key={tick}>
              <line x1={x} x2={x} y1={y0} y2={y0 + 4} className="axis" />
              <text x={x} y={height - 12} textAnchor="middle" className="tick">
                {tick}
              </text>
            </g>
          );
        })}
        {zeroLine && zeroY >= y1 && zeroY <= y0 ? <line x1={x0} x2={x1} y1={zeroY} y2={zeroY} className="zero-line" /> : null}
        <path d={pathFromData(data, yMin, yMax)} fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        <text x={pad.left - 8} y={pad.top - 8} textAnchor="end" className="tick">
          {formatSci(yMax, 2)}
        </text>
        <text x={pad.left - 8} y={height - pad.bottom + 4} textAnchor="end" className="tick">
          {formatSci(yMin, 2)}
        </text>
        <text x={(x0 + x1) / 2} y={height - 2} textAnchor="middle" className="axis-label">
          x/a
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
  normalized: boolean;
};

export function FieldPlots({ solution, normalized }: FieldPlotsProps) {
  const input = solution.input;
  const jdc = input.current > 0 ? input.current / (2 * input.a * input.b) : Math.max(...solution.points.map((point) => point.jAbs), 1);
  const maxHeat = Math.max(...solution.points.map((point) => point.heat), 1);
  const maxHy = Math.max(...solution.points.map((point) => point.hyAbs), 1);

  return (
    <section className="plot-grid">
      <Plot
        title="电流密度幅值分布"
        subtitle={normalized ? "|Jz| / Jdc" : "RMS A/m²"}
        yLabel={normalized ? "|J|/Jdc" : "A/m²"}
        data={solution.points.map((point) => ({ x: point.xOverA, y: normalized ? point.jAbs / jdc : point.jAbs }))}
      />
      <Plot
        title="相位滞后"
        subtitle="arg(Jz), rad"
        yLabel="rad"
        color="#007c89"
        zeroLine
        data={solution.points.map((point) => ({ x: point.xOverA, y: point.jPhase }))}
      />
      <Plot
        title="单位体积热源分布"
        subtitle={normalized ? "q''' / max(q''')" : "W/m³"}
        yLabel={normalized ? "rel." : "W/m³"}
        color="#ba4a00"
        data={solution.points.map((point) => ({ x: point.xOverA, y: normalized ? point.heat / maxHeat : point.heat }))}
      />
      <Plot
        title="磁场幅值分布"
        subtitle={normalized ? "|Hy| / max(|Hy|)" : "RMS A/m"}
        yLabel={normalized ? "rel." : "A/m"}
        color="#4f7d22"
        data={solution.points.map((point) => ({ x: point.xOverA, y: normalized ? point.hyAbs / maxHy : point.hyAbs }))}
      />
      <Plot
        title="磁场相位分布"
        subtitle="arg(Hy), rad"
        yLabel="rad"
        color="#725ac1"
        zeroLine
        data={solution.points.map((point) => ({ x: point.xOverA, y: point.hyPhase }))}
      />
    </section>
  );
}
