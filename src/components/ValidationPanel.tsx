import { AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";
import { ValidationItem } from "../physics/validation";

type ValidationPanelProps = {
  items: ValidationItem[];
};

export function ValidationPanel({ items }: ValidationPanelProps) {
  const icon = {
    pass: <CheckCircle2 size={17} aria-hidden="true" />,
    warn: <AlertTriangle size={17} aria-hidden="true" />,
    fail: <CircleAlert size={17} aria-hidden="true" />,
  };

  const statusText = {
    pass: "通过",
    warn: "提示",
    fail: "需检查",
  };

  return (
    <section className="panel" aria-labelledby="validation-title">
      <h2 id="validation-title">模型校验</h2>
      <div className="validation-list">
        {items.map((item) => (
          <div key={item.label} className={`validation-item ${item.status}`}>
            {icon[item.status]}
            <strong>{item.label}</strong>
            <span>
              <b>{statusText[item.status]}: </b>
              {item.detail}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
