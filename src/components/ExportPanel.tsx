import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { LossResults } from "../physics/loss";
import { MaterialKey } from "../physics/materials";
import { SlabSolution } from "../physics/slabModel";
import { buildReportMarkdown } from "../physics/teaching";
import { ValidationItem } from "../physics/validation";
import { downloadJson, formatSci } from "../utils/format";

type ExportPanelProps = {
  solution: SlabSolution;
  losses: LossResults;
  material: MaterialKey;
  validations: ValidationItem[];
};

const downloadText = (filename: string, text: string, mimeType: string): void => {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export function ExportPanel({ solution, losses, material, validations }: ExportPanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const reportMarkdown = useMemo(
    () => buildReportMarkdown(solution, losses, material, validations),
    [solution, losses, material, validations],
  );

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

  const exportReport = () => {
    downloadText("skin-effect-report-material.md", reportMarkdown, "text/markdown;charset=utf-8");
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportMarkdown);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <section className="panel">
      <h2>报告素材导出</h2>
      <div className="export-actions">
        <button onClick={exportParams} type="button">
          <Download size={16} />
          导出当前参数 JSON
        </button>
        <button onClick={exportResults} type="button">
          <Download size={16} />
          导出数值结果 JSON
        </button>
        <button onClick={copyReport} type="button">
          <FileText size={16} />
          复制报告素材
        </button>
        <button onClick={exportReport} type="button">
          <FileText size={16} />
          导出报告 Markdown
        </button>
      </div>
      {copyState !== "idle" ? (
        <p className="tiny-note">
          {copyState === "copied" ? "已复制 Markdown 报告素材。" : "浏览器阻止了剪贴板写入，可使用 Markdown 下载按钮。"}
        </p>
      ) : null}
      <p className="tiny-note">
        Markdown 会整理当前参数、δ、a/δ、Rac/Rdc、模式解释、模型假设、校验结果和设计者自述草稿。当前 Pac' = {formatSci(losses.pac)} W/m。
      </p>
    </section>
  );
}
