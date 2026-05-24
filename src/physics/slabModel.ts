import {
  C,
  Complex,
  abs,
  add,
  cosh,
  div,
  exp,
  finiteOrZero,
  mul,
  scale,
  sinh,
  sub,
} from "./complex";
import { propagationGamma, skinDepth } from "./skinDepth";
import { generateSmartMesh } from "../utils/sampling";

export type Mode = "A" | "B" | "C";

export type ModelInput = {
  sigma: number;
  muR: number;
  frequency: number;
  a: number;
  b: number;
  current: number;
  h0: number;
  mode: Mode;
  samples: number;
};

export type SamplePoint = {
  x: number;
  xOverA: number;
  hy: Complex;
  jz: Complex;
  jAbs: number;
  jPhase: number;
  hyAbs: number;
  hyPhase: number;
  heat: number;
  instantJ: number;
};

export type BoundaryConditions = {
  hl: Complex;
  hr: Complex;
};

export type SlabSolution = {
  input: ModelInput;
  delta: number;
  gamma: Complex;
  boundaries: BoundaryConditions;
  points: SamplePoint[];
  integrationPoints: SamplePoint[];
};

export const boundaryConditions = (input: ModelInput): BoundaryConditions => {
  const injected = input.current / (2 * input.b);
  if (input.mode === "A") return { hl: C(-injected, 0), hr: C(injected, 0) };
  if (input.mode === "B") return { hl: C(input.h0, 0), hr: C(input.h0, 0) };
  return { hl: C(input.h0 - injected, 0), hr: C(input.h0 + injected, 0) };
};

const directSafeLimit = 50;

const sinhOverSinh = (gamma: Complex, y: number, total: number): Complex => {
  const gy = scale(gamma, y);
  const gTotal = scale(gamma, total);
  if (abs(gTotal) < directSafeLimit) return div(sinh(gy), sinh(gTotal));

  const leading = exp(sub(gy, gTotal));
  const top = sub(C(1, 0), exp(scale(gy, -2)));
  const bottom = sub(C(1, 0), exp(scale(gTotal, -2)));
  return finiteOrZero(mul(leading, div(top, bottom)));
};

const coshOverSinh = (gamma: Complex, y: number, total: number): Complex => {
  const gy = scale(gamma, y);
  const gTotal = scale(gamma, total);
  if (abs(gTotal) < directSafeLimit) return div(cosh(gy), sinh(gTotal));

  const leading = exp(sub(gy, gTotal));
  const top = add(C(1, 0), exp(scale(gy, -2)));
  const bottom = sub(C(1, 0), exp(scale(gTotal, -2)));
  return finiteOrZero(mul(leading, div(top, bottom)));
};

export const solveAt = (
  x: number,
  a: number,
  gamma: Complex,
  boundaries: BoundaryConditions,
  sigma: number,
  phase = 0,
): SamplePoint => {
  const total = 2 * a;
  const leftY = a - x;
  const rightY = x + a;
  const leftH = scale(finiteOrZero(sinhOverSinh(gamma, leftY, total)), boundaries.hl.re);
  const rightH = scale(finiteOrZero(sinhOverSinh(gamma, rightY, total)), boundaries.hr.re);
  const hy = add(leftH, rightH);

  const leftJ = scale(finiteOrZero(mul(gamma, coshOverSinh(gamma, leftY, total))), -boundaries.hl.re);
  const rightJ = scale(finiteOrZero(mul(gamma, coshOverSinh(gamma, rightY, total))), boundaries.hr.re);
  const jz = add(leftJ, rightJ);
  const jAbs = Number.isFinite(abs(jz)) ? abs(jz) : 0;

  return {
    x,
    xOverA: x / a,
    hy,
    jz,
    jAbs,
    jPhase: Math.atan2(jz.im, jz.re),
    hyAbs: abs(hy),
    hyPhase: Math.atan2(hy.im, hy.re),
    heat: (jAbs * jAbs) / sigma,
    instantJ: jz.re * Math.cos(phase) - jz.im * Math.sin(phase),
  };
};

export const solveSlab = (input: ModelInput, phaseFraction = 0): SlabSolution => {
  const delta = skinDepth(input.frequency, input.sigma, input.muR);
  const gamma = propagationGamma(delta);
  const boundaries = boundaryConditions(input);
  const phase = 2 * Math.PI * phaseFraction;
  const xs = generateSmartMesh(input.a, delta, "display", input.samples);
  const integrationXs = generateSmartMesh(input.a, delta, "integration", Math.max(input.samples, 1200));
  const points = xs.map((x) => solveAt(x, input.a, gamma, boundaries, input.sigma, phase));
  const integrationPoints = integrationXs.map((x) => solveAt(x, input.a, gamma, boundaries, input.sigma, phase));
  return { input, delta, gamma, boundaries, points, integrationPoints };
};
