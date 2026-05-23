import { AlertTriangle } from "lucide-react";
import { Mode } from "../physics/slabModel";
import { modeCApproximation, modelAssumptions } from "../physics/teaching";

type ModelLimitsPanelProps = {
  mode: Mode;
};

export function ModelLimitsPanel({ mode }: ModelLimitsPanelProps) {
  return (
    <section className="panel limits-panel" aria-labelledby="limits-title">
      <div className="panel-title">
        <AlertTriangle size={18} />
        <h2 id="limits-title">模型适用范围说明</h2>
      </div>
      {mode === "C" ? <p className="mode-c-note">{modeCApproximation}</p> : null}
      <div className="limits-list">
        {modelAssumptions.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </section>
  );
}
