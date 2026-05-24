import { AlertTriangle } from "lucide-react";
import { Mode } from "../physics/slabModel";
import { modeCApproximation, modelAssumptions } from "../physics/teaching";

type ModelLimitsPanelProps = {
  mode: Mode;
};

export function ModelLimitsPanel({ mode }: ModelLimitsPanelProps) {
  return (
    <details className="panel limits-panel compact-details" aria-labelledby="limits-title">
      <summary id="limits-title">
        <AlertTriangle size={17} />
        模型假设与适用边界
      </summary>
      {mode === "C" ? <p className="mode-c-note">{modeCApproximation}</p> : null}
      <div className="limits-list">
        {modelAssumptions.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </details>
  );
}
