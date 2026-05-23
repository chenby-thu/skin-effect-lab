import { TINY } from "./constants";
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
