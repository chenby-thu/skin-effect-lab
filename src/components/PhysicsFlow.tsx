import { ArrowRight } from "lucide-react";

const steps = [
  { title: "交流激励", text: "电流或外加磁场随时间变化" },
  { title: "磁扩散", text: "时变磁场进入导体受到感应电流阻碍" },
  { title: "电流重分布", text: "J_z(x) 不再均匀，而向表面集中" },
  { title: "焦耳损耗", text: "q''' = |J_rms|² / σ" },
  { title: "交流电阻", text: "R_ac' = P_ac' / I_rms²" },
];

export function PhysicsFlow() {
  return (
    <section className="panel flow-panel" aria-labelledby="physics-flow-title">
      <div className="panel-title">
        <h2 id="physics-flow-title">从场到路的物理链条</h2>
      </div>
      <div className="flow-steps">
        {steps.map((step, index) => (
          <div className="flow-step-wrap" key={step.title}>
            <article className="flow-step">
              <span>{index + 1}</span>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </article>
            {index < steps.length - 1 ? <ArrowRight className="flow-arrow" size={18} aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
