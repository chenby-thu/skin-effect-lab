const formulas = [
  "δ = sqrt(2/(ωμσ))",
  "Γ = (1+j)/δ",
  "d²Hy/dx² - Γ²Hy = 0",
  "Jz = dHy/dx",
  "q''' = |Jrms|²/σ",
  "Pac' = b/σ ∫ |Jrms|² dx",
  "R_ac' = P_ac'/I_rms²",
  "R_dc' = 1/(σ·2ab)",
];

export function FormulaPanel() {
  return (
    <section className="panel">
      <h2>公式展示</h2>
      <div className="formula-grid">
        {formulas.map((formula) => (
          <code key={formula}>{formula}</code>
        ))}
      </div>
    </section>
  );
}
