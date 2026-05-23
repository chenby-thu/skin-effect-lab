import { C, Complex } from "./complex";
import { MU0, TWO_PI } from "./constants";

export const omegaFromFrequency = (frequency: number): number => TWO_PI * frequency;
export const permeability = (muR: number): number => MU0 * muR;

export const skinDepth = (frequency: number, sigma: number, muR: number): number => {
  const omega = omegaFromFrequency(frequency);
  const mu = permeability(muR);
  return Math.sqrt(2 / (omega * mu * sigma));
};

export const propagationGamma = (delta: number): Complex => C(1 / delta, 1 / delta);
