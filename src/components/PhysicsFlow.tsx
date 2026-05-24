import { LossResults } from "../physics/loss";
import { SlabSolution } from "../physics/slabModel";
import { classifySkinRegime } from "../physics/teaching";
import { formatMm, formatSci } from "../utils/format";

type PhysicsFlowProps = {
  solution: SlabSolution;
  losses: LossResults;
};

type Step = {
  label: string;
  value: string;
  detail?: string;
  badge?: string;
};

export function PhysicsFlow({ solution, losses }: PhysicsFlowProps) {
  const input = solution.input;
  const ratio = input.a / solution.delta;
  const regime = classifySkinRegime(ratio);
  const terminalMetric =
    input.mode === "B"
      ? `P_eddy' = ${formatSci(losses.pac)} W/m`
      : input.mode === "C"
        ? `R_eq/R_dc = ${losses.racOverRdc === null ? "未定义" : formatSci(losses.racOverRdc, 3)}`
        : `R_ac/R_dc = ${losses.racOverRdc === null ? "未定义" : formatSci(losses.racOverRdc, 3)}`;

  const steps: Step[] = [
    { label: "ω = 2πf", value: `${formatSci(2 * Math.PI * input.frequency)} rad/s`, detail: `f = ${formatSci(input.frequency)} Hz` },
    { label: "μ, σ, a", value: `μr=${formatSci(input.muR)}, σ=${formatSci(input.sigma)}`, detail: `a = ${formatMm(input.a)}` },
    { label: "δ", value: formatMm(solution.delta), detail: "δ = √(2/(ωμσ))" },
    { label: "a/δ", value: formatSci(ratio, 3), badge: regime.title },
    { label: "H_y(x)", value: `|H|max = ${formatSci(Math.max(...solution.points.map((point) => point.hyAbs), 1))}`, detail: "边界条件驱动" },
    { label: "J_z(x)", value: `max |J| = ${formatSci(losses.maxCurrentDensity)}`, detail: "J_z = dH_y/dx" },
    { label: "q'''(x)", value: `max q''' = ${formatSci(losses.maxHeatDensity)}`, detail: "q''' = |J|²/σ" },
    { label: "P' → 指标", value: terminalMetric, detail: input.mode === "B" ? "无端子 R_ac" : "P'/I²" },
  ];

  return (
    <section className="panel flow-panel" aria-labelledby="physics-flow-title">
      <div className="panel-title compact-title">
        <h2 id="physics-flow-title">物理链条</h2>
        <span className={`regime-badge ${regime.key}`}>{regime.title}</span>
      </div>
      <div className="flow-steps compact-flow">
        {steps.map((step) => (
          <article className="flow-step compact-step" key={step.label}>
            <span>{step.label}</span>
            <strong>{step.value}</strong>
            {step.badge ? <small className={`regime-badge ${regime.key}`}>{step.badge}</small> : null}
            {step.detail ? <p>{step.detail}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
