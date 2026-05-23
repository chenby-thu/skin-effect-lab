import { Activity, Zap } from "lucide-react";
import { LossResults } from "../physics/loss";
import { SlabSolution } from "../physics/slabModel";
import { formatMm, formatPhase, formatSci } from "../utils/format";

type ResistancePanelProps = {
  solution: SlabSolution;
  losses: LossResults;
  showLimits: boolean;
};

type MetricProps = {
  label: string;
  value: string;
  unit?: string;
};

function Metric({ label, value, unit }: MetricProps) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {unit ? <small>{unit}</small> : null}
    </div>
  );
}

export function ResistancePanel({ solution, losses, showLimits }: ResistancePanelProps) {
  const ratio = solution.input.a / solution.delta;
  const resistanceLabel = solution.input.mode === "C" ? "Req'=P/I²" : "Rac'";
  const ratioLabel = solution.input.mode === "C" ? "Req'/Rdc'" : "Rac'/Rdc'";
  const limitHint =
    solution.input.mode === "B"
      ? "该模式没有净传输电流，损耗来自闭合涡流。"
      : solution.input.mode === "C"
        ? "外加磁场会破坏两侧对称性，可视为一维邻近效应近似。"
        : ratio < 0.1
          ? "低频极限：电流近似均匀，Rac ≈ Rdc。"
          : ratio > 5
            ? "强集肤区：电流集中在导体表面附近。"
            : "中间频段：场和电流分布已偏离均匀直流状态。";

  return (
    <section className="panel">
      <div className="panel-title">
        <Zap size={18} />
        <h2>数值结果与交流电阻</h2>
      </div>
      <div className="metric-grid">
        <Metric label="δ 趋肤深度" value={formatMm(solution.delta)} />
        <Metric label="a/δ 集肤强度" value={formatSci(ratio, 3)} />
        <Metric label="Γ" value={`(${formatSci(solution.gamma.re) } + j${formatSci(solution.gamma.im)})`} unit="1/m" />
        <Metric label="Rdc'" value={formatSci(losses.rdc)} unit="Ω/m" />
        <Metric label="Pac'" value={formatSci(losses.pac)} unit="W/m" />
        <Metric label={resistanceLabel} value={losses.rac === null ? "未定义" : formatSci(losses.rac)} unit={losses.rac === null ? undefined : "Ω/m"} />
        <Metric label={ratioLabel} value={losses.racOverRdc === null ? "未定义" : formatSci(losses.racOverRdc, 3)} />
        <Metric label="Inet" value={`${formatSci(losses.inetRe)} ${losses.inetIm >= 0 ? "+" : "-"} j${formatSci(Math.abs(losses.inetIm))}`} unit="A" />
        <Metric label="表面/中心热源" value={formatSci(losses.surfaceHeatRatio, 3)} />
        <Metric label="最大 |Jz| 位置" value={`${(losses.maxCurrentPosition / solution.input.a).toFixed(3)} a`} />
        <Metric label="最大 |Jz|" value={formatSci(losses.maxCurrentDensity)} unit="A/m²" />
        <Metric label="中心 J 相位" value={formatPhase(solution.points[Math.floor(solution.points.length / 2)].jPhase)} />
      </div>

      {showLimits ? (
        <div className="limit-hint">
          <Activity size={17} />
          <span>{limitHint}</span>
        </div>
      ) : null}
    </section>
  );
}
