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
  surfaceHeatRatio: number;
  maxCurrentPosition: number;
  maxCurrentDensity: number;
  centerHeat: number;
  surfaceHeat: number;
};

export const integrateComplexJ = (solution: SlabSolution) => {
  const xs = solution.points.map((point) => point.x);
  const re = trapezoid(xs, solution.points.map((point) => point.jz.re)) * solution.input.b;
  const im = trapezoid(xs, solution.points.map((point) => point.jz.im)) * solution.input.b;
  return { re, im, abs: Math.hypot(re, im) };
};

export const computeLosses = (solution: SlabSolution): LossResults => {
  const input = solution.input;
  const xs = solution.points.map((point) => point.x);
  const heatIntegral = trapezoid(xs, solution.points.map((point) => point.jAbs * point.jAbs));
  const pac = (input.b / input.sigma) * heatIntegral;
  const rdc = 1 / (input.sigma * 2 * input.a * input.b);
  const rac = input.current > 0 ? pac / (input.current * input.current) : null;
  const racOverRdc = rac === null ? null : rac / rdc;
  const inet = integrateComplexJ(solution);

  const leftHeat = solution.points[0]?.heat ?? 0;
  const rightHeat = solution.points[solution.points.length - 1]?.heat ?? 0;
  const surfaceHeat = Math.max(leftHeat, rightHeat);
  const center = solution.points[Math.floor(solution.points.length / 2)]?.heat ?? 0;
  const maxPoint = solution.points.reduce((best, point) => (point.jAbs > best.jAbs ? point : best), solution.points[0]);

  return {
    rdc,
    pac: Math.max(0, pac),
    rac,
    racOverRdc,
    inetAbs: inet.abs,
    inetRe: inet.re,
    inetIm: inet.im,
    surfaceHeatRatio: surfaceHeat / Math.max(center, TINY),
    maxCurrentPosition: maxPoint.x,
    maxCurrentDensity: maxPoint.jAbs,
    centerHeat: center,
    surfaceHeat,
  };
};

export const currentBalanceError = (solution: SlabSolution): number => {
  const inet = integrateComplexJ(solution);
  const target = solution.input.current;
  return abs(sub({ re: inet.re, im: inet.im }, { re: target, im: 0 })) / Math.max(target, TINY);
};

export const buildResistanceCurve = (samples = 140): { ratio: number; value: number }[] => {
  const min = -2;
  const max = 1.2;
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
        samples: 300,
      },
      0,
    );
    const losses = computeLosses(solution);
    return { ratio, value: losses.racOverRdc ?? Number.NaN };
  });
};
