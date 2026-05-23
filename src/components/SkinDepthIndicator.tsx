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

  return (
    <section className={`panel skin-indicator ${regime.key}`} aria-labelledby="skin-indicator-title">
      <div className="panel-title">
        <Gauge size={18} />
        <h2 id="skin-indicator-title">核心指标：a/δ</h2>
      </div>
      <div className="skin-indicator-grid">
        <div className="skin-big-metric">
          <span>趋肤深度 δ</span>
          <strong>{formatMm(solution.delta)}</strong>
        </div>
        <div className="skin-big-metric emphasis">
          <span>几何尺度 / 扩散深度</span>
          <strong>{formatSci(ratio, 4)}</strong>
          <small>a/δ</small>
        </div>
        <div className="skin-regime">
          <span>当前区域判断</span>
          <strong>{regime.title}</strong>
          <p>{regime.summary}</p>
        </div>
        <div className="skin-regime">
          <span>交流损耗结果</span>
          <strong>{losses.racOverRdc === null ? "R_ac/R_dc 未定义" : formatSci(losses.racOverRdc, 4)}</strong>
          <p>{solution.input.mode === "B" ? "模式 B 无端子净传输电流，因此不定义端子交流电阻。" : "由 J_z(x) 的焦耳热积分得到。"}</p>
        </div>
      </div>
      <p className="tiny-note">a/δ 是导体几何尺度与磁扩散深度的比值，是判断集肤效应强弱的核心无量纲量。</p>
    </section>
  );
}
