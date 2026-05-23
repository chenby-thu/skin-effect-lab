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

export const validateSolution = (solution: SlabSolution): ValidationItem[] => {
  const input = solution.input;
  const losses = computeLosses(solution);
  const inet = integrateComplexJ(solution);
  const items: ValidationItem[] = [];
  const ratio = input.a / solution.delta;

  if (input.mode === "A") {
    const error = Math.hypot(inet.re - input.current, inet.im) / Math.max(input.current, TINY);
    items.push({
      label: "模式 A 净电流",
      status: statusByError(error, 1e-3, 5e-3),
      detail: `|Inet-I|/I = ${error.toExponential(2)}`,
    });
  }

  if (input.mode === "B") {
    const right = solution.points[solution.points.length - 1]?.jAbs ?? 0;
    const surfaceScale = input.b * Math.max(solution.points[0]?.jAbs ?? 0, right, TINY) * 2 * input.a;
    const error = inet.abs / Math.max(surfaceScale, TINY);
    items.push({
      label: "模式 B 零净传输电流",
      status: statusByError(error, 1e-3, 1e-2),
      detail: `|Inet|/典型尺度 = ${error.toExponential(2)}`,
    });

    let maxAntiSymmetry = 0;
    const n = solution.points.length;
    for (let i = 0; i < Math.floor(n / 2); i += 1) {
      const left = solution.points[i].jz;
      const right = solution.points[n - 1 - i].jz;
      const error = abs({ re: left.re + right.re, im: left.im + right.im }) / Math.max(abs(left), abs(right), TINY);
      maxAntiSymmetry = Math.max(maxAntiSymmetry, error);
    }
    items.push({
      label: "模式 B 涡流反对称",
      status: statusByError(maxAntiSymmetry, 2e-3, 2e-2),
      detail: `J_z(x)+J_z(-x) 的最大相对残差 = ${maxAntiSymmetry.toExponential(2)}`,
    });
  }

  if (solution.input.a / solution.delta < 0.1 && losses.racOverRdc !== null) {
    const error = Math.abs(losses.racOverRdc - 1);
    items.push({
      label: "低频极限 Rac/Rdc",
      status: statusByError(error, 5e-3, 3e-2),
      detail: `Rac/Rdc = ${losses.racOverRdc.toFixed(5)}`,
    });
  } else {
    items.push({
      label: "低频极限 Rac/Rdc",
      status: "warn",
      detail: "当前 a/δ 不在 < 0.1 的低频检验区间",
    });
  }

  items.push({
    label: "损耗非负",
    status: losses.pac >= -1e-15 ? "pass" : "fail",
    detail: `Pac' = ${losses.pac.toExponential(3)} W/m`,
  });

  const leftPoint = solution.points[0];
  const rightPoint = solution.points[solution.points.length - 1];
  const leftResidual = leftPoint ? abs(sub(leftPoint.hy, solution.boundaries.hl)) : Number.POSITIVE_INFINITY;
  const rightResidual = rightPoint ? abs(sub(rightPoint.hy, solution.boundaries.hr)) : Number.POSITIVE_INFINITY;
  const boundaryScale = Math.max(abs(solution.boundaries.hl), abs(solution.boundaries.hr), 1);
  const boundaryRelative = Math.max(leftResidual, rightResidual) / boundaryScale;
  items.push({
    label: "边界条件残差",
    status: statusByError(boundaryRelative, 1e-7, 1e-4),
    detail: `max(|H_y(±a)-H_{L/R}|)/尺度 = ${boundaryRelative.toExponential(2)}`,
  });

  if (ratio > 5) {
    const strongSkinOk = losses.racOverRdc === null ? null : losses.racOverRdc > 1.1;
    items.push({
      label: "强集肤趋势",
      status: strongSkinOk === null ? "warn" : strongSkinOk ? "pass" : "fail",
      detail:
        strongSkinOk === null
          ? "当前处于强集肤区，但无端子净电流，R_ac/R_dc 不定义；请主要观察涡流损耗与 |J_z| 表面集中。"
          : `当前 a/δ = ${ratio.toFixed(2)}，R_ac/R_dc = ${losses.racOverRdc?.toFixed(3)}，应明显大于 1 并随 a/δ 增大而继续上升。`,
    });
  }

  if (input.mode === "A" && input.h0 === 0) {
    let maxRelative = 0;
    const n = solution.points.length;
    for (let i = 0; i < Math.floor(n / 2); i += 1) {
      const left = solution.points[i].jAbs;
      const right = solution.points[n - 1 - i].jAbs;
      maxRelative = Math.max(maxRelative, Math.abs(left - right) / Math.max(left, right, TINY));
    }
    items.push({
      label: "模式 A 幅值对称性",
      status: statusByError(maxRelative, 1e-3, 1e-2),
      detail: `最大相对偏差 = ${maxRelative.toExponential(2)}`,
    });
  }

  return items;
};
