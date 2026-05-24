import { Gauge } from "lucide-react";
import { LossResults } from "../physics/loss";
import { SlabSolution } from "../physics/slabModel";
import { classifySkinRegime } from "../physics/teaching";
import { formatMm, formatSci } from "../utils/format";

type SkinDepthIndicatorProps = {
  solution: SlabSolution;
  losses: LossResults;
};

export function SkinDepthIndicator({ solution, losses }: SkinDepthIndicatorProps) {
  const ratio = solution.input.a / solution.delta;
  const regime = classifySkinRegime(ratio);
  const modeMetric =
    solution.input.mode === "B"
      ? `P_eddy' = ${formatSci(losses.pac)} W/m`
      : `${solution.input.mode === "C" ? "Req/Rdc" : "Rac/Rdc"} = ${
          losses.racOverRdc === null ? "未定义" : formatSci(losses.racOverRdc, 4)
        }`;

  return (
    <section className={`panel skin-indicator ${regime.key}`} aria-labelledby="skin-indicator-title">
      <div className="panel-title">
        <Gauge size={18} />
        <h2 id="skin-indicator-title">delta 与集肤强度</h2>
      </div>
      <div className="skin-indicator-grid">
        <div className="skin-big-metric">
          <span>趋肤深度 delta</span>
          <strong>{formatMm(solution.delta)}</strong>
        </div>
        <div className="skin-big-metric emphasis">
          <span>a/delta</span>
          <strong>{formatSci(ratio, 4)}</strong>
          <small>{regime.title}</small>
        </div>
        <div className="skin-regime">
          <span>当前区间</span>
          <strong>{regime.title}</strong>
          <p>{regime.summary}</p>
        </div>
        <div className="skin-regime">
          <span>模式指标</span>
          <strong>{modeMetric}</strong>
          <p>{solution.input.mode === "B" ? "无端子电流，改看涡流损耗。" : "由 J_z(x) 的焦耳热积分得到。"}</p>
        </div>
      </div>
    </section>
  );
}
