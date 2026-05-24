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
  const resistanceLabel = mode === "C" ? "R_eq'=P'/I²" : "R_ac'";
  const ratioLabel = mode === "C" ? "R_eq'/R_dc'" : "R_ac'/R_dc'";
  const centerPoint = solution.points[Math.floor(solution.points.length / 2)];
  const modeHint =
    mode === "B"
      ? "Mode B 无端子净传输电流，不定义端子交流电阻。这里关注 P'_eddy、q'''_max、表面/中心热源比和 I_net≈0。"
      : mode === "C"
        ? "Mode C 是外场扰动下的一维邻近效应近似；R_eq 只表示注入电流下的等效损耗。"
        : ratio > 5
          ? "强集肤区: 电流集中在表面约 1~3 个 δ 内，建议同时查看 log 与表面放大视图。"
          : "Mode A 的 R_ac/R_dc 来自 P'=b/σ ∫|J_rms|² dx 与 I_rms²。";

  return (
    <section className="panel">
      <div className="panel-title">
        <Zap size={18} />
        <h2>数值结果：损耗与等效电阻</h2>
      </div>
      <div className="metric-grid">
        <Metric label="R_dc'" value={formatSci(losses.rdc)} unit="ohm/m" />
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
        <Metric label="最大 |J_z|" value={formatSci(losses.maxCurrentDensity)} unit="A/m^2" />
        <Metric label="中心 J 相位" value={formatPhase(centerPoint.jPhase)} />
        <Metric label="a/δ" value={formatSci(ratio, 3)} />
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
