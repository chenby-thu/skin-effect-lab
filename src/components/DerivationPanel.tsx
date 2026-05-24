const sections = [
  {
    title: "1. Maxwell 方程组子集",
    formulas: ["∇×H = J", "∇×E = -∂B/∂t", "J = σE", "B = μH"],
    note: "时变磁场诱导有旋电场，导体中的传导电流反过来影响磁场分布。",
  },
  {
    title: "2. 一维磁扩散",
    formulas: ["d²H_y/dx² - Γ²H_y = 0", "Γ = √(jωμσ) = (1+j)/δ", "δ = √(2/(ωμσ))"],
    note: "δ 是时变场进入导体的特征深度，也是判断集肤强弱的核心尺度。",
  },
  {
    title: "3. 从场到损耗积分",
    formulas: ["J_z = dH_y/dx", "q''' = |J_rms|² / σ", "P' = b∫q''' dx", "R_ac' = P'/I_rms²"],
    note: "端子交流电阻只在有端子净电流的模式下定义；Mode B 应报告涡流损耗。",
  },
];

export function DerivationPanel() {
  return (
    <details className="panel derivation-panel compact-details" aria-labelledby="derivation-title">
      <summary id="derivation-title">从 Maxwell 方程到损耗积分</summary>
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
    </details>
  );
}
