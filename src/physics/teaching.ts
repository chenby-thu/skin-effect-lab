import { LossResults } from "./loss";
import { MaterialKey, getMaterial } from "./materials";
import { Mode, ModelInput, SlabSolution } from "./slabModel";
import { ValidationItem } from "./validation";
import { formatFixed, formatMm, formatSci } from "../utils/format";

export type SkinRegime = {
  key: "dc" | "weak" | "medium" | "strong";
  title: string;
  summary: string;
};

export type PresetScenario = {
  id: string;
  title: string;
  goal: string;
  note: string;
  target: string;
  material: MaterialKey;
  input: Partial<ModelInput>;
};

export const classifySkinRegime = (ratio: number): SkinRegime => {
  if (ratio < 0.1) {
    return {
      key: "dc",
      title: "近似直流",
      summary: "电流近似均匀；Mode A 下 R_ac/R_dc 接近 1。",
    };
  }
  if (ratio < 1) {
    return {
      key: "weak",
      title: "弱集肤",
      summary: "δ 仍大于半厚度，J_z(x) 开始偏离均匀分布。",
    };
  }
  if (ratio < 5) {
    return {
      key: "medium",
      title: "中等集肤",
      summary: "电流明显向表面集中，中心区电流与热源下降。",
    };
  }
  return {
    key: "strong",
    title: "强集肤",
    summary: "主要变化集中在约 1~3 个 δ 内，表面层视图更清楚。",
  };
};

export const boundaryFormula = (mode: Mode): string => {
  if (mode === "A") return "H_y(-a) = -I/(2b),  H_y(a) = I/(2b)";
  if (mode === "B") return "H_y(-a) = H_0,      H_y(a) = H_0";
  return "H_y(-a) = H_0 - I/(2b), H_y(a) = H_0 + I/(2b)";
};

export const modeDescriptions: Record<Mode, string> = {
  A: "端子电流给定，J_z(x) 因磁扩散在截面内重新分布；适合展示 R_ac/R_dc 随 a/δ 增大的变化。",
  B: "边界施加切向时变磁场，导体内产生闭合感应电流；适合展示涡流损耗和 q''' 分布，不定义端子 R_ac。",
  C: "注入电流叠加外部时变磁场边界扰动，用于展示电流偏移、局部热源增强和等效损耗变化。",
};

export const modeCApproximation =
  "Mode C 是邻近效应的教学化一维近似，不是完整二维/三维多导体邻近效应 FEM 仿真。";

export const modelBoundaryStatement =
  "本作品采用一维平板磁扩散解析模型，适合展示集肤效应、涡流损耗和外磁场扰动下的电流重分布趋势，不等同于真实二维/三维有限元邻近效应仿真。";

export const modelAssumptions = [
  "一维平板导体模型，只解析厚度方向 x ∈ [-a,a] 上的分布。",
  "材料均匀、线性、各向同性，μ 与 σ 视为常数。",
  "正弦稳态相量模型，采用 RMS 值展示。",
  "磁准静态近似，忽略位移电流。",
  "不包含完整二维/三维几何边界、端部效应、温升反馈和真实多导体耦合。",
  "简化钢模型仅用于定性演示，真实铁磁材料的 μ 可能非线性且与频率、温度和磁化状态有关。",
];

export const presetScenarios: PresetScenario[] = [
  {
    id: "low-frequency",
    title: "低频近似直流",
    goal: "看到: |J_z| 近似平坦，R_ac/R_dc ≈ 1",
    note: "参数: 铜, 50 Hz, 薄板",
    target: "目标: 建立直流极限基准",
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
    goal: "看到: 表面层尖峰，中心区电流衰减",
    note: "参数: 铜, 1 MHz, a = 2 mm",
    target: "目标: 用 s/δ 放大表面层",
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
    goal: "看到: δ 变小，表面层变薄",
    note: "参数: steel-like, μ_r = 100",
    target: "目标: 比较 μ 对磁扩散深度的影响",
    material: "steel",
    input: {
      frequency: 1e4,
      a: 1e-3,
      b: 20e-3,
      current: 80,
      h0: 0,
      mode: "A",
      samples: 520,
    },
  },
  {
    id: "eddy-current",
    title: "外加时变磁场: 涡流损耗",
    goal: "看到: I_net ≈ 0, 但 P'_eddy > 0",
    note: "参数: H_0 驱动, 无端子电流",
    target: "目标: 区分涡流损耗与端子电阻",
    material: "copper",
    input: {
      frequency: 1e4,
      a: 2e-3,
      b: 30e-3,
      current: 0,
      h0: 800,
      mode: "B",
      samples: 520,
    },
  },
  {
    id: "proximity-1d",
    title: "注入电流 + 外场扰动",
    goal: "看到: 左右不对称 J_z(x) 与 q'''(x)",
    note: "参数: Mode C, H_0 与 I 同时存在",
    target: "目标: 展示一维邻近效应近似",
    material: "copper",
    input: {
      frequency: 1e5,
      a: 2e-3,
      b: 20e-3,
      current: 100,
      h0: 1600,
      mode: "C",
      samples: 520,
    },
  },
];

const modeName = (mode: Mode): string => {
  if (mode === "A") return "Mode A: 注入电流 - 集肤效应与交流电阻";
  if (mode === "B") return "Mode B: 外加时变磁场 - 涡流损耗";
  return "Mode C: 注入电流 + 外场扰动 - 一维邻近效应近似";
};

const modeMetricText = (solution: SlabSolution, losses: LossResults): string[] => {
  if (solution.input.mode === "B") {
    return [
      "- 当前模式是否定义 R_ac: 否。无端子净传输电流，不定义端子交流电阻。",
      `- 涡流损耗 P'_eddy: ${formatSci(losses.pac)} W/m`,
      `- 最大热源 q'''_max: ${formatSci(losses.maxHeatDensity)} W/m^3`,
      `- 净传输电流 I_net: ${formatSci(losses.inetAbs)} A`,
    ];
  }
  if (solution.input.mode === "C") {
    return [
      "- 当前模式是否定义 R_ac: 仅可报告等效损耗 P'/I_rms^2，不应与纯 Mode A 曲线强行重合。",
      `- 等效损耗电阻比 R_eq/R_dc: ${losses.racOverRdc === null ? "未定义" : formatSci(losses.racOverRdc, 4)}`,
      "- 说明: Mode C 含外场诱发涡流与端子电流叠加，偏离纯集肤曲线是物理结果。",
    ];
  }
  return [
    "- 当前模式是否定义 R_ac: 是。Mode A 为端子注入电流，R_ac = P'/I_rms^2。",
    `- R_ac/R_dc: ${losses.racOverRdc === null ? "未定义" : formatSci(losses.racOverRdc, 4)}`,
  ];
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
  const validationLines = validations
    .map((item) => `- ${item.status.toUpperCase()}: ${item.label}. ${item.detail}`)
    .join("\n");

  const lines = [
    "# 集肤效应一维可视化报告素材",
    "",
    "## 当前参数",
    "",
    `- 材料: ${selected.name}`,
    `- σ: ${formatSci(input.sigma)} S/m`,
    `- μ_r: ${formatSci(input.muR)}`,
    `- f: ${formatSci(input.frequency)} Hz`,
    `- a: ${formatMm(input.a)}`,
    `- b: ${formatMm(input.b)}`,
    `- I_rms: ${formatSci(input.current)} A`,
    `- H_{0,rms}: ${formatSci(input.h0)} A/m`,
    `- 模式: ${modeName(input.mode)}`,
    `- 边界条件: ${boundaryFormula(input.mode)}`,
    `- N: ${formatFixed(input.samples, 0)}`,
    "",
    "## 核心指标",
    "",
    `- δ: ${formatMm(solution.delta)}`,
    `- a/δ: ${formatSci(ratio, 4)} (${regime.title})`,
    `- P': ${formatSci(losses.pac)} W/m`,
    ...modeMetricText(solution, losses),
    "",
    "## 物理解释摘要",
    "",
    `- 当前区间: ${regime.title}. ${regime.summary}`,
    `- 当前模式: ${modeDescriptions[input.mode]}`,
    ...(input.mode === "C" ? [`- 近似说明: ${modeCApproximation}`] : []),
    `- 模型边界说明: ${modelBoundaryStatement}`,
    "",
    "## 模型假设",
    "",
    ...modelAssumptions.map((item) => `- ${item}`),
    "",
    "## 模型校验结果",
    "",
    validationLines,
    "",
    "## 可写入报告的表述",
    "",
    modelBoundaryStatement,
    "",
  ];

  return lines.join("\n");
};
