import { LossResults } from "./loss";
import { MaterialKey, getMaterial } from "./materials";
import { Mode, ModelInput, SlabSolution } from "./slabModel";
import { ValidationItem } from "./validation";
import { formatFixed, formatMm, formatSci } from "../utils/format";

export type SkinRegime = {
  key: "weak" | "light" | "medium" | "strong";
  title: string;
  summary: string;
};

export type PresetScenario = {
  id: string;
  title: string;
  goal: string;
  note: string;
  material: MaterialKey;
  input: Partial<ModelInput>;
};

export const classifySkinRegime = (ratio: number): SkinRegime => {
  if (ratio < 0.1) {
    return {
      key: "weak",
      title: "低频/弱集肤",
      summary: "电流近似均匀，R_ac/R_dc 接近 1。",
    };
  }
  if (ratio < 1) {
    return {
      key: "light",
      title: "轻微集肤",
      summary: "扩散深度大于导体半厚度，电流分布开始偏离均匀。",
    };
  }
  if (ratio < 5) {
    return {
      key: "medium",
      title: "中等集肤",
      summary: "电流明显向两侧表面集中，中心电流密度下降。",
    };
  }
  return {
    key: "strong",
    title: "强集肤",
    summary: "主要电流集中在表面约 δ 厚度内，交流损耗显著增加。",
  };
};

export const modeDescriptions: Record<Mode, string> = {
  A: "端子注入交流电流，用边界磁场差值表示净传输电流，是观察集肤效应与交流电阻的主模式。",
  B: "两侧施加同向交变磁场，无端子净传输电流，用来观察外磁场诱发的闭合涡流与损耗。",
  C: "端子注入电流叠加外加一维交变磁场扰动，可展示左右不对称的 J_z(x) 分布。",
};

export const modeCApproximation =
  "模式 C 不是完整二维/三维邻近效应仿真，而是用外加一维交变磁场扰动模拟邻近导体造成的左右不对称电流分布。";

export const modelAssumptions = [
  "一维平板近似，只解析厚度方向 x 上的分布。",
  "磁准静态 MQS 近似，忽略位移电流。",
  "材料线性、均匀、各向同性，μ 和 σ 假设为常数。",
  "忽略边缘效应与端部效应。",
  "未考虑真实多导体邻近效应的二维/三维耦合。",
  "简化钢模型仅用于定性演示，真实铁磁材料 μ 可能非线性、频率相关。",
];

export const presetScenarios: PresetScenario[] = [
  {
    id: "low-frequency",
    title: "低频近似直流",
    goal: "目标：a/δ < 0.1",
    note: "电流几乎均匀，R_ac/R_dc 接近 1。",
    material: "copper",
    input: {
      frequency: 50,
      a: 0.5e-3,
      b: 20e-3,
      current: 100,
      h0: 0,
      mode: "A",
      samples: 400,
    },
  },
  {
    id: "strong-skin",
    title: "高频强集肤",
    goal: "目标：a/δ 显著大于 1",
    note: "电流集中在导体表面，R_ac/R_dc 明显上升。",
    material: "copper",
    input: {
      frequency: 1e6,
      a: 2e-3,
      b: 20e-3,
      current: 100,
      h0: 0,
      mode: "A",
      samples: 600,
    },
  },
  {
    id: "high-mu",
    title: "高磁导率材料对比",
    goal: "目标：观察 μ 增大使 δ 减小",
    note: "简化钢仅用于定性演示，真实铁磁材料 μ 非线性且频率相关。",
    material: "steel",
    input: {
      frequency: 1e4,
      a: 1e-3,
      b: 20e-3,
      current: 80,
      h0: 0,
      mode: "A",
      samples: 500,
    },
  },
  {
    id: "eddy-current",
    title: "外加磁场涡流",
    goal: "目标：模式 B，净传输电流约为 0",
    note: "无端子净传输电流，但外加交变磁场诱发闭合涡流并产生损耗。",
    material: "copper",
    input: {
      frequency: 1e4,
      a: 2e-3,
      b: 30e-3,
      current: 0,
      h0: 800,
      mode: "B",
      samples: 500,
    },
  },
  {
    id: "proximity-1d",
    title: "注入电流 + 外磁场扰动",
    goal: "目标：模式 C，左右不对称 J_z(x)",
    note: "展示一维邻近效应近似下外磁场扰动造成的电流偏置。",
    material: "copper",
    input: {
      frequency: 1e5,
      a: 2e-3,
      b: 20e-3,
      current: 100,
      h0: 1600,
      mode: "C",
      samples: 500,
    },
  },
];

const modeName = (mode: Mode): string => {
  if (mode === "A") return "模式 A：端子注入电流";
  if (mode === "B") return "模式 B：外加磁场涡流";
  return "模式 C：注入电流 + 外磁场扰动";
};

export const buildReportMarkdown = (
  solution: SlabSolution,
  losses: LossResults,
  material: MaterialKey,
  validations: ValidationItem[],
): string => {
  const input = solution.input;
  const selected = getMaterial(material);
  const ratio = input.a / solution.delta;
  const regime = classifySkinRegime(ratio);
  const racText = losses.racOverRdc === null ? "无端子净电流，R_ac/R_dc 不定义" : formatSci(losses.racOverRdc, 4);
  const validationLines = validations
    .map((item) => `- ${item.status.toUpperCase()}：${item.label}。${item.detail}`)
    .join("\n");

  const lines = [
    "# 集肤效应一维可视化报告素材",
    "",
    "## 当前参数",
    "",
    `- 材料：${selected.name}`,
    `- σ：${formatSci(input.sigma)} S/m`,
    `- μr：${formatSci(input.muR)}`,
    `- f：${formatSci(input.frequency)} Hz`,
    `- a：${formatMm(input.a)}`,
    `- b：${formatMm(input.b)}`,
    `- Irms：${formatSci(input.current)} A`,
    `- H0,rms：${formatSci(input.h0)} A/m`,
    `- 模式：${modeName(input.mode)}`,
    `- N：${formatFixed(input.samples, 0)}`,
    "",
    "## 核心无量纲指标",
    "",
    `- δ：${formatMm(solution.delta)}`,
    `- a/δ：${formatSci(ratio, 4)}`,
    `- R_ac/R_dc：${racText}`,
    "",
    "## 物理解释摘要",
    "",
    `- 当前区间：${regime.title}。${regime.summary}`,
    `- 当前模式：${modeDescriptions[input.mode]}`,
    ...(input.mode === "C" ? [`- 近似说明：${modeCApproximation}`] : []),
    "",
    "## 模型假设",
    "",
    ...modelAssumptions.map((item) => `- ${item}`),
    "",
    "## 模型校验结果",
    "",
    validationLines,
    "",
    "## 设计者自述草稿",
    "",
    "本作品以有限厚导体板为对象，将磁准静态场中的扩散方程转化为一维正弦稳态边值问题。通过调节频率、电导率、磁导率和几何尺寸，观察电流密度从近似均匀分布逐渐向表面集中的过程，并进一步由 J(x) 的损耗积分得到交流电阻。该可视化强调了集肤效应并非经验修正，而是 Maxwell 方程组、材料本构关系与边界条件共同决定的场分布结果。",
    "",
  ];

  return lines.join("\n");
};
