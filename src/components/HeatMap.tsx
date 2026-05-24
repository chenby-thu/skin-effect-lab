import { SlabSolution } from "../physics/slabModel";

type HeatMapProps = {
  solution: SlabSolution;
};

const colorFor = (t: number): string => {
  const clamped = Math.max(0, Math.min(1, t));
  const hue = 210 - 190 * clamped;
  const light = 78 - 34 * Math.sqrt(clamped);
  return `hsl(${hue} 78% ${light}%)`;
};

export function HeatMap({ solution }: HeatMapProps) {
  const maxHeat = Math.max(...solution.points.map((point) => point.heat), 1e-30);
  return (
    <section className="panel heat-panel">
      <h2>热源分布色条</h2>
      <div className="heat-strip" role="img" aria-label="单位体积热源沿厚度方向分布">
        {solution.points.map((point, index) => (
          <span
            key={`${point.x}-${index}`}
            style={{ backgroundColor: colorFor(point.heat / maxHeat) }}
            title={`x/a=${point.xOverA.toFixed(3)}, q=${point.heat.toExponential(3)} W/m^3`}
          />
        ))}
      </div>
      <div className="axis-row">
        <span>-a</span>
        <span>x</span>
        <span>+a</span>
      </div>
    </section>
  );
}
