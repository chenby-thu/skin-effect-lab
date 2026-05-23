import { Download, FileText } from "lucide-react";
import { LossResults } from "../physics/loss";
import { SlabSolution } from "../physics/slabModel";
import { downloadJson, formatSci } from "../utils/format";

type ExportPanelProps = {
  solution: SlabSolution;
  losses: LossResults;
};

export function ExportPanel({ solution, losses }: ExportPanelProps) {
  const draft = [
    "设计者自述草稿（仅供参考，最终报告必须自行复核和改写）",
    "",
    "知识映射：本作品把磁准静态方程、磁扩散方程、复传播常数、趋肤深度、焦耳损耗和交流电阻联系在同一个一维平板模型中。",
    "设计逻辑：通过改变边界条件，同一套 d²Hy/dx²-Γ²Hy=0 的解可以分别展示端子注入电流的集肤效应、外加交变磁场诱发的涡流，以及外磁场扰动下的非对称电流分布。",
    "模型假设：导体为线性、均匀、各向同性材料；忽略位移电流和边缘效应；所有相量使用 RMS 值；μ 和 σ 不随场强、频率和温度变化。",
    "可视化内容说明：页面展示 |Jz|、arg(Jz)、q'''、|Hy|、arg(Hy)、瞬时 Jz(x,t)、Rac/Rdc 随 a/δ 变化以及热源伪彩色条，并用模型校验检查净电流、低频极限、损耗非负和对称性。",
  ].join("\n");

  const exportParams = () => {
    downloadJson("skin-effect-parameters.json", {
      ...solution.input,
      delta: solution.delta,
      gamma: solution.gamma,
      boundaries: solution.boundaries,
    });
  };

  const exportResults = () => {
    downloadJson("skin-effect-results.json", {
      losses,
      points: solution.points.map((point) => ({
        x: point.x,
        xOverA: point.xOverA,
        Hy: point.hy,
        Jz: point.jz,
        absJz: point.jAbs,
        argJz: point.jPhase,
        heat: point.heat,
      })),
    });
  };

  const exportDraft = () => {
    const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "designer-statement-draft.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel">
      <h2>导出</h2>
      <div className="export-actions">
        <button onClick={exportParams} type="button">
          <Download size={16} />
          导出当前参数 JSON
        </button>
        <button onClick={exportResults} type="button">
          <Download size={16} />
          导出数值结果 JSON
        </button>
        <button onClick={exportDraft} type="button">
          <FileText size={16} />
          生成设计者自述草稿
        </button>
      </div>
      <p className="tiny-note">
        自述草稿仅作组织思路参考；课程报告中的公式、图像解释和结论需要自行复核与改写。当前 Pac' = {formatSci(losses.pac)} W/m。
      </p>
    </section>
  );
}
