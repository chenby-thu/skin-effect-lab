import { TINY } from "./constants";
import { abs, sub } from "./complex";
import { computeLosses, integrateComplexJ } from "./loss";
import { SlabSolution } from "./slabModel";

export type ValidationStatus = "pass" | "warn" | "fail";

export type ValidationItem = {
  label: string;
  status: ValidationStatus;
  detail: string;
};

const statusByError = (error: number, pass: number, warn: number): ValidationStatus => {
  if (!Number.isFinite(error)) return "fail";
  if (error <= pass) return "pass";
  if (error <= warn) return "warn";
  return "fail";
};

const symmetryError = (solution: SlabSolution, antiSymmetric = false): number => {
  let maxRelative = 0;
  const points = solution.integrationPoints ?? solution.points;
  const n = points.length;
  for (let index = 0; index < Math.floor(n / 2); index += 1) {
    const left = points[index].jz;
    const right = points[n - 1 - index].jz;
    const residual = antiSymmetric
      ? abs({ re: left.re + right.re, im: left.im + right.im })
      : Math.abs(abs(left) - abs(right));
    maxRelative = Math.max(maxRelative, residual / Math.max(abs(left), abs(right), TINY));
  }
  return maxRelative;
};

export const validateSolution = (solution: SlabSolution): ValidationItem[] => {
  const input = solution.input;
  const losses = computeLosses(solution);
  const inet = integrateComplexJ(solution);
  const items: ValidationItem[] = [];
  const ratio = input.a / solution.delta;

  if (input.mode === "A") {
    const currentError = Math.hypot(inet.re - input.current, inet.im) / Math.max(input.current, TINY);
    items.push({
      label: "模式 A: 净电流",
      status: statusByError(currentError, 1e-3, 5e-3),
      detail: `I_net 应接近 I_input，当前相对误差 ${currentError.toExponential(2)}`,
    });

    const resistanceOk = (losses.racOverRdc ?? 0) >= 1 - 5e-4;
    items.push({
      label: "模式 A: R_ac/R_dc 下界",
      status: resistanceOk ? "pass" : "fail",
      detail: losses.racOverRdc === null ? "端子电阻未定义" : `R_ac/R_dc = ${losses.racOverRdc.toFixed(5)}`,
    });

    if (ratio < 0.1 && losses.racOverRdc !== null) {
      const lowFrequencyError = Math.abs(losses.racOverRdc - 1);
      items.push({
        label: "模式 A: 低频极限",
        status: statusByError(lowFrequencyError, 5e-3, 3e-2),
        detail: `a/δ = ${ratio.toFixed(4)}，R_ac/R_dc 应接近 1`,
      });
    }

    if (ratio > 5 && losses.racOverRdc !== null) {
      items.push({
        label: "模式 A: 强集肤趋势",
        status: losses.racOverRdc > 1.1 ? "pass" : "warn",
        detail: `a/δ = ${ratio.toFixed(2)}，R_ac/R_dc = ${losses.racOverRdc.toFixed(3)}`,
      });
    }

    const ampSymmetry = symmetryError(solution, false);
    items.push({
      label: "模式 A: |J| 中心面对称",
      status: statusByError(ampSymmetry, 2e-3, 2e-2),
      detail: `最大相对偏差 ${ampSymmetry.toExponential(2)}`,
    });
  }

  if (input.mode === "B") {
    const currentScale = input.b * Math.max(losses.maxCurrentDensity, TINY) * 2 * input.a;
    const currentError = inet.abs / Math.max(currentScale, TINY);
    items.push({
      label: "模式 B: I_net ≈ 0",
      status: statusByError(currentError, 1e-3, 1e-2),
      detail: `|I_net|/典型电流尺度 = ${currentError.toExponential(2)}`,
    });

    const antiSymmetry = symmetryError(solution, true);
    items.push({
      label: "模式 B: 涡流反对称",
      status: statusByError(antiSymmetry, 3e-3, 3e-2),
      detail: `J_z(x)+J_z(-x) 最大相对残差 ${antiSymmetry.toExponential(2)}`,
    });

    items.push({
      label: "模式 B: 涡流损耗非负",
      status: losses.pac >= -1e-15 ? "pass" : "fail",
      detail: `P_eddy' = ${losses.pac.toExponential(3)} W/m`,
    });

    items.push({
      label: "模式 B: 不定义端子 R_ac",
      status: losses.racOverRdc === null ? "pass" : "fail",
      detail: "无端子净传输电流，因此不展示 R_ac/R_dc 当前点",
    });
  }

  if (input.mode === "C") {
    const leftPoint = solution.points[0];
    const rightPoint = solution.points[solution.points.length - 1];
    const leftResidual = leftPoint ? abs(sub(leftPoint.hy, solution.boundaries.hl)) : Number.POSITIVE_INFINITY;
    const rightResidual = rightPoint ? abs(sub(rightPoint.hy, solution.boundaries.hr)) : Number.POSITIVE_INFINITY;
    const boundaryScale = Math.max(abs(solution.boundaries.hl), abs(solution.boundaries.hr), 1);
    const boundaryRelative = Math.max(leftResidual, rightResidual) / boundaryScale;
    items.push({
      label: "模式 C: 边界条件残差",
      status: statusByError(boundaryRelative, 1e-7, 1e-4),
      detail: `max |H_y(±a)-H_{L/R}|/尺度 = ${boundaryRelative.toExponential(2)}`,
    });

    items.push({
      label: "模式 C: 总损耗非负",
      status: losses.pac >= -1e-15 ? "pass" : "fail",
      detail: `P_total' = ${losses.pac.toExponential(3)} W/m`,
    });

    items.push({
      label: "模式 C: 左右不对称指标",
      status: losses.asymmetryIndex > 0.03 ? "pass" : "warn",
      detail: `不对称指标 = ${losses.asymmetryIndex.toExponential(2)}`,
    });

    items.push({
      label: "模式 C: 不强求落在纯 A 曲线",
      status: "pass",
      detail: "外场诱发涡流与端子电流叠加，偏离纯集肤曲线是物理结果",
    });
  }

  if (input.mode !== "C") {
    const leftPoint = solution.points[0];
    const rightPoint = solution.points[solution.points.length - 1];
    const leftResidual = leftPoint ? abs(sub(leftPoint.hy, solution.boundaries.hl)) : Number.POSITIVE_INFINITY;
    const rightResidual = rightPoint ? abs(sub(rightPoint.hy, solution.boundaries.hr)) : Number.POSITIVE_INFINITY;
    const boundaryScale = Math.max(abs(solution.boundaries.hl), abs(solution.boundaries.hr), 1);
    const boundaryRelative = Math.max(leftResidual, rightResidual) / boundaryScale;
    items.push({
      label: "边界条件残差",
      status: statusByError(boundaryRelative, 1e-7, 1e-4),
      detail: `max |H_y(±a)-H_{L/R}|/尺度 = ${boundaryRelative.toExponential(2)}`,
    });
  }

  return items;
};
