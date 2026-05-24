const sections = [
  {
    title: "1. Maxwell 子集",
    formulas: ["curl H = J", "curl E = -dB/dt", "J = sigma E", "B = mu H"],
    note: "时变磁场诱导电场，导体中的传导电流反过来改变磁场分布。",
  },
  {
    title: "2. 一维磁扩散",
    formulas: ["d^2 H_y/dx^2 - Gamma^2 H_y = 0", "Gamma = sqrt(j omega mu sigma) = (1+j)/delta", "delta = sqrt(2/(omega mu sigma))"],
    note: "delta 是幅值衰减的特征深度，也是判断集肤强弱的核心尺度。",
  },
  {
    title: "3. 从场到损耗",
    formulas: ["J_z = dH_y/dx", "q''' = |J_rms|^2 / sigma", "P' = b/sigma ∫ |J_rms|^2 dx", "R_ac' = P'/I_rms^2"],
    note: "端子交流电阻只在有端子净电流的模式下定义；模式 B 应报告涡流损耗。",
  },
];

export function DerivationPanel() {
  return (
    <details className="panel derivation-panel compact-details" aria-labelledby="derivation-title">
      <summary id="derivation-title">推导链条</summary>
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
