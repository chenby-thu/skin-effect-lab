import { Activity, Zap } from "lucide-react";
import { LossResults } from "../physics/loss";
import { SlabSolution } from "../physics/slabModel";
import { formatPhase, formatSci } from "../utils/format";

type ResistancePanelProps = {
  solution: SlabSolution;
  losses: LossResults;
  showLimits: boolean;
};

type MetricProps = {
  label: string;
  value: string;
  unit?: string;
  muted?: boolean;
};

function Metric({ label, value, unit, muted }: MetricProps) {
  return (
    <div className={`metric ${muted ? "muted-metric" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {unit ? <small>{unit}</small> : null}
    </div>
  );
}

export function ResistancePanel({ solution, losses, showLimits }: ResistancePanelProps) {
  const ratio = solution.input.a / solution.delta;
  const mode = solution.input.mode;
  const resistanceLabel = mode === "C" ? "Req'=P'/I^2" : "Rac'";
  const ratioLabel = mode === "C" ? "Req'/Rdc'" : "Rac'/Rdc'";
  const centerPoint = solution.points[Math.floor(solution.points.length / 2)];
  const modeHint =
    mode === "B"
      ? "模式 B 无端子净传输电流，不定义端子交流电阻。这里关注 P_eddy'、q'''_max、表面/中心热源比和 I_net≈0。"
      : mode === "C"
        ? "模式 C 含外场诱发涡流与端子电流叠加。偏离纯模式 A 曲线是物理结果，不是错误。"
        : ratio > 5
          ? "强集肤区: 电流集中在表面约 1~3 个 delta 内，建议同时查看 log 与表面放大视图。"
          : "模式 A 的 R_ac/R_dc 来自 P'=b/sigma ∫|J_rms|^2 dx 与 I_rms^2。";

  return (
    <section className="panel">
      <div className="panel-title">
        <Zap size={18} />
        <h2>关键数值</h2>
      </div>
      <div className="metric-grid">
        <Metric label="Rdc'" value={formatSci(losses.rdc)} unit="ohm/m" />
        <Metric label={mode === "B" ? "P_eddy'" : "P'"} value={formatSci(losses.pac)} unit="W/m" />
        <Metric label="q'''_max" value={formatSci(losses.maxHeatDensity)} unit="W/m^3" />
        <Metric
          label={resistanceLabel}
          value={losses.rac === null ? "不定义" : formatSci(losses.rac)}
          unit={losses.rac === null ? undefined : "ohm/m"}
          muted={losses.rac === null}
        />
        <Metric label={ratioLabel} value={losses.racOverRdc === null ? "不定义" : formatSci(losses.racOverRdc, 3)} muted={losses.racOverRdc === null} />
        <Metric label="I_net" value={`${formatSci(losses.inetRe)} ${losses.inetIm >= 0 ? "+" : "-"} j${formatSci(Math.abs(losses.inetIm))}`} unit="A" />
        <Metric label="表面/中心热源" value={formatSci(losses.surfaceHeatRatio, 3)} />
        <Metric label="不对称指标" value={formatSci(losses.asymmetryIndex, 3)} />
        <Metric label="最大 |Jz| 位置" value={`${(losses.maxCurrentPosition / solution.input.a).toFixed(3)} a`} />
        <Metric label="最大 |Jz|" value={formatSci(losses.maxCurrentDensity)} unit="A/m^2" />
        <Metric label="中心 J 相位" value={formatPhase(centerPoint.jPhase)} />
        <Metric label="a/delta" value={formatSci(ratio, 3)} />
      </div>

      {showLimits ? (
        <div className="limit-hint">
          <Activity size={17} />
          <span>{modeHint}</span>
        </div>
      ) : null}
    </section>
  );
}
