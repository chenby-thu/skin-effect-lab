import { abs, sub } from "./complex";
import { SlabSolution, solveSlab } from "./slabModel";
import { MU0, TINY } from "./constants";
import { trapezoid } from "../utils/sampling";

export type LossResults = {
  rdc: number;
  pac: number;
  rac: number | null;
  racOverRdc: number | null;
  inetAbs: number;
  inetRe: number;
  inetIm: number;
  maxHeatDensity: number;
  surfaceHeatRatio: number;
  maxCurrentPosition: number;
  maxCurrentDensity: number;
  centerHeat: number;
  surfaceHeat: number;
  asymmetryIndex: number;
  racDefined: boolean;
};

export const integrateComplexJ = (solution: SlabSolution) => {
  const points = solution.integrationPoints ?? solution.points;
  const xs = points.map((point) => point.x);
  const re = trapezoid(xs, points.map((point) => point.jz.re)) * solution.input.b;
  const im = trapezoid(xs, points.map((point) => point.jz.im)) * solution.input.b;
  return { re, im, abs: Math.hypot(re, im) };
};

export const computeLosses = (solution: SlabSolution): LossResults => {
  const input = solution.input;
  const points = solution.integrationPoints ?? solution.points;
  const xs = points.map((point) => point.x);
  const heatIntegral = trapezoid(xs, points.map((point) => point.jAbs * point.jAbs));
  const pac = (input.b / input.sigma) * heatIntegral;
  const rdc = 1 / (input.sigma * 2 * input.a * input.b);
  const racDefined = input.mode !== "B" && input.current > TINY;
  const rac = racDefined ? pac / (input.current * input.current) : null;
  const racOverRdc = rac === null ? null : rac / rdc;
  const inet = integrateComplexJ(solution);

  const leftHeat = points[0]?.heat ?? 0;
  const rightHeat = points[points.length - 1]?.heat ?? 0;
  const surfaceHeat = Math.max(leftHeat, rightHeat);
  const centerPoint = points.reduce((best, point) => (Math.abs(point.x) < Math.abs(best.x) ? point : best), points[0]);
  const center = centerPoint?.heat ?? 0;
  const maxPoint = points.reduce((best, point) => (point.jAbs > best.jAbs ? point : best), points[0]);
  const maxHeatDensity = points.reduce((best, point) => Math.max(best, point.heat), 0);
  const asymmetryIndex = computeAsymmetryIndex(points);

  return {
    rdc,
    pac: Math.max(0, pac),
    rac,
    racOverRdc,
    inetAbs: inet.abs,
    inetRe: inet.re,
    inetIm: inet.im,
    maxHeatDensity,
    surfaceHeatRatio: surfaceHeat / Math.max(center, TINY),
    maxCurrentPosition: maxPoint.x,
    maxCurrentDensity: maxPoint.jAbs,
    centerHeat: center,
    surfaceHeat,
    asymmetryIndex,
    racDefined,
  };
};

const computeAsymmetryIndex = (points: SlabSolution["points"]): number => {
  let numerator = 0;
  let denominator = 0;
  const n = points.length;
  for (let index = 0; index < Math.floor(n / 2); index += 1) {
    const left = points[index]?.jAbs ?? 0;
    const right = points[n - 1 - index]?.jAbs ?? 0;
    numerator = Math.max(numerator, Math.abs(left - right));
    denominator = Math.max(denominator, left, right);
  }
  return numerator / Math.max(denominator, TINY);
};

export const currentBalanceError = (solution: SlabSolution): number => {
  const inet = integrateComplexJ(solution);
  const target = solution.input.current;
  return abs(sub({ re: inet.re, im: inet.im }, { re: target, im: 0 })) / Math.max(target, TINY);
};

export type ResistanceCurvePoint = {
  ratio: number;
  value: number;
};

export const buildResistanceCurve = (currentRatio?: number, samples = 160): ResistanceCurvePoint[] => {
  const minRatio = 0.01;
  const baseMaxRatio = 10 ** 1.2;
  const maxRatio = Math.max(baseMaxRatio, Number.isFinite(currentRatio ?? Number.NaN) ? (currentRatio ?? 0) * 1.2 : baseMaxRatio);
  const min = Math.log10(minRatio);
  const max = Math.log10(maxRatio);
  return Array.from({ length: samples }, (_, index) => {
    const ratio = 10 ** (min + ((max - min) * index) / (samples - 1));
    const solution = solveSlab(
      {
        sigma: 1,
        muR: 1,
        frequency: 1 / (Math.PI * MU0),
        a: ratio,
        b: 1,
        current: 1,
        h0: 0,
        mode: "A",
        samples: 360,
      },
      0,
    );
    const losses = computeLosses(solution);
    return { ratio, value: losses.racOverRdc ?? Number.NaN };
  });
};

export const interpolateResistanceCurve = (curve: ResistanceCurvePoint[], ratio: number): number | null => {
  if (curve.length < 2 || ratio <= 0 || !Number.isFinite(ratio)) return null;
  const x = Math.log10(ratio);
  for (let index = 1; index < curve.length; index += 1) {
    const left = curve[index - 1];
    const right = curve[index];
    const leftX = Math.log10(left.ratio);
    const rightX = Math.log10(right.ratio);
    if (x >= leftX && x <= rightX) {
      const fraction = (x - leftX) / (rightX - leftX || 1);
      return left.value + (right.value - left.value) * fraction;
    }
  }
  return null;
};
