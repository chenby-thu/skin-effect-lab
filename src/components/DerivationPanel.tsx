const sections = [
  {
    title: "1. 从 Maxwell 子集到磁扩散方程",
    formulas: ["∇×H = J", "∇×E = -∂B/∂t", "J = σE", "B = μH", "∇²H = μσ ∂H/∂t"],
    note: "变化磁场产生有旋感应电场，感应电场驱动传导电流，传导电流又反过来改变磁场分布，因此时变磁场在导体中表现为扩散。",
  },
  {
    title: "2. 一维正弦稳态",
    formulas: ["d²H_y/dx² - Γ²H_y = 0", "Γ = √(jωμσ) = (1+j)/δ", "δ = √(2/(ωμσ))"],
    note: "δ 表示场幅值衰减到表面值 1/e 的特征深度，是集肤效应的核心尺度。",
  },
  {
    title: "3. 从场量回到电路量",
    formulas: ["J_z = dH_y/dx", "q''' = |J_rms|² / σ", "P_ac' = b/σ ∫ |J_rms|² dx", "R_ac' = P_ac' / I_rms²", "R_dc' = 1/(σ·2ab)"],
    note: "交流电阻不是凭空增加的参数，而是非均匀 J(x) 导致的总损耗增加。",
  },
];

export function DerivationPanel() {
  return (
    <section className="panel derivation-panel" aria-labelledby="derivation-title">
      <h2 id="derivation-title">公式推导链条</h2>
      <div className="derivation-grid">
        {sections.map((section) => (
          <article className="derivation-card" key={section.title}>
            <h3>{section.title}</h3>
            <div className="derivation-formulas">
              {section.formulas.map((formula) => (
                <code key={formula}>{formula}</code>
              ))}
            </div>
            <p>{section.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
