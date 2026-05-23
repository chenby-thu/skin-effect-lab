import { Sparkles } from "lucide-react";
import { PresetScenario, presetScenarios } from "../physics/teaching";

type PresetScenariosProps = {
  onApply: (scenario: PresetScenario) => void;
};

export function PresetScenarios({ onApply }: PresetScenariosProps) {
  return (
    <section className="panel preset-panel" aria-labelledby="preset-title">
      <div className="panel-title">
        <Sparkles size={18} />
        <h2 id="preset-title">一键实验场景</h2>
      </div>
      <p className="tiny-note">这些场景用于快速观察典型物理极限。</p>
      <div className="preset-grid">
        {presetScenarios.map((scenario) => (
          <button className="preset-button" key={scenario.id} type="button" onClick={() => onApply(scenario)}>
            <strong>{scenario.title}</strong>
            <span>{scenario.goal}</span>
            <small>{scenario.note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
