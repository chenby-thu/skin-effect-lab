import { LossResults } from "../physics/loss";
import { SlabSolution } from "../physics/slabModel";
import { classifySkinRegime } from "../physics/teaching";
import { formatMm, formatSci } from "../utils/format";

type PhysicsFlowProps = {
  solution: SlabSolution;
  losses: LossResults;
};

type Step = {
  meaning: string;
  formula: string;
  value: string;
  note?: string;
};

export function PhysicsFlow({ solution, losses }: PhysicsFlowProps) {
  const input = solution.input;
  const ratio = input.a / solution.delta;
  const regime = classifySkinRegime(ratio);
  const maxHy = Math.max(...solution.points.map((point) => point.hyAbs), 1);

  const finalStep: Step =
    input.mode === "B"
      ? {
          meaning: "涡流损耗",
          formula: "P′eddy",
          value: `${formatSci(losses.pac)} W/m`,
          note: "无端子电流, R_ac 不定义",
        }
      : input.mode === "C"
        ? {
            meaning: "总损耗",
            formula: "P′total → R_eq/R_dc",
            value: losses.racOverRdc === null ? "未定义" : formatSci(losses.racOverRdc, 3),
            note: "等效损耗",
          }
        : {
            meaning: "端子损耗",
            formula: "P′ → R_ac/R_dc",
            value: losses.racOverRdc === null ? "未定义" : formatSci(losses.racOverRdc, 3),
          };

  const steps: Step[] = [
    { meaning: "角频率", formula: "ω = 2πf", value: `${formatSci(2 * Math.PI * input.frequency)} rad/s` },
    { meaning: "材料与尺寸", formula: "μ, σ, a", value: `μr=${formatSci(input.muR)}, a=${formatMm(input.a)}` },
    { meaning: "扩散深度", formula: "δ = √(2/(ωμσ))", value: formatMm(solution.delta) },
    { meaning: "集肤强度", formula: "a/δ", value: formatSci(ratio, 3), note: regime.title },
    { meaning: "磁场剖面", formula: "H_y(x)", value: `max |H|=${formatSci(maxHy)}` },
    { meaning: "电流重分布", formula: "J_z = dH_y/dx", value: `max |J|=${formatSci(losses.maxCurrentDensity)}` },
    { meaning: "焦耳热源", formula: "q''' = |J|²/σ", value: `max q'''=${formatSci(losses.maxHeatDensity)}` },
    finalStep,
  ];

  return (
    <section className="panel flow-panel" aria-labelledby="physics-flow-title">
      <div className="panel-title compact-title">
        <h2 id="physics-flow-title">物理链条</h2>
        <span className={`regime-badge ${regime.key}`}>{regime.title}</span>
      </div>
      <div className="flow-steps compact-flow">
        {steps.map((step, index) => (
          <div className="flow-node" key={`${step.meaning}-${step.formula}`}>
            <article className="flow-step compact-step">
              <span className="flow-meaning">{step.meaning}</span>
              <strong>{step.formula}</strong>
              <p>{step.value}</p>
              {step.note ? <small className={index === 3 ? `regime-badge ${regime.key}` : "flow-note"}>{step.note}</small> : null}
            </article>
            {index < steps.length - 1 ? <span className="flow-link-arrow" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
