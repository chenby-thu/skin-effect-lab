import { SlabSolution } from "../physics/slabModel";

type AnimationPanelProps = {
  solution: SlabSolution;
  normalized: boolean;
};

export function AnimationPanel({ solution, normalized }: AnimationPanelProps) {
  const maxAbs = Math.max(...solution.points.map((point) => Math.abs(point.instantJ)), 1e-30);
  const data = solution.points.map((point) => ({ x: point.xOverA, y: normalized ? point.instantJ / maxAbs : point.instantJ }));
  const width = 720;
  const height = 250;
  const pad = { left: 56, right: 18, top: 28, bottom: 38 };
  const yVals = data.map((point) => point.y);
  const rawMin = Math.min(...yVals, -1);
  const rawMax = Math.max(...yVals, 1);
  const span = rawMax - rawMin || 1;
  const yMin = rawMin - span * 0.1;
  const yMax = rawMax + span * 0.1;
  const sx = (x: number) => pad.left + ((x + 1) / 2) * (width - pad.left - pad.right);
  const sy = (y: number) => pad.top + (1 - (y - yMin) / (yMax - yMin || 1)) * (height - pad.top - pad.bottom);
  const path = data.map((point, index) => `${index === 0 ? "M" : "L"} ${sx(point.x).toFixed(2)} ${sy(point.y).toFixed(2)}`).join(" ");
  const zero = sy(0);

  return (
    <section className="panel">
      <h2>瞬时分布图</h2>
      <p className="panel-subtitle">Jz(x,t) = Re&#123;Jz(x) exp(j2πt/T)&#125;</p>
      <svg className="wide-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="电流密度瞬时分布">
        <rect x="0" y="0" width={width} height={height} className="plot-bg" />
        <line x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} className="axis" />
        <line x1={pad.left} x2={pad.left} y1={pad.top} y2={height - pad.bottom} className="axis" />
        {zero >= pad.top && zero <= height - pad.bottom ? <line x1={pad.left} x2={width - pad.right} y1={zero} y2={zero} className="zero-line" /> : null}
        <path d={path} fill="none" stroke="#5c2d91" strokeWidth="3" strokeLinecap="round" />
        <text x={width / 2} y={height - 8} textAnchor="middle" className="axis-label">
          x/a
        </text>
      </svg>
    </section>
  );
}
