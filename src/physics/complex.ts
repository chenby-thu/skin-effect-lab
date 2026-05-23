export type Complex = {
  re: number;
  im: number;
};

export const C = (re = 0, im = 0): Complex => ({ re, im });

export const add = (a: Complex, b: Complex): Complex => C(a.re + b.re, a.im + b.im);
export const sub = (a: Complex, b: Complex): Complex => C(a.re - b.re, a.im - b.im);
export const scale = (a: Complex, k: number): Complex => C(a.re * k, a.im * k);

export const mul = (a: Complex, b: Complex): Complex =>
  C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);

export const div = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) return C(Number.NaN, Number.NaN);
  return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};

export const abs = (a: Complex): number => Math.hypot(a.re, a.im);
export const arg = (a: Complex): number => Math.atan2(a.im, a.re);

export const exp = (a: Complex): Complex => {
  const er = Math.exp(a.re);
  return C(er * Math.cos(a.im), er * Math.sin(a.im));
};

export const sinh = (a: Complex): Complex =>
  C(Math.sinh(a.re) * Math.cos(a.im), Math.cosh(a.re) * Math.sin(a.im));

export const cosh = (a: Complex): Complex =>
  C(Math.cosh(a.re) * Math.cos(a.im), Math.sinh(a.re) * Math.sin(a.im));

export const fromPolar = (r: number, theta: number): Complex =>
  C(r * Math.cos(theta), r * Math.sin(theta));

export const conj = (a: Complex): Complex => C(a.re, -a.im);
export const isFiniteComplex = (a: Complex): boolean => Number.isFinite(a.re) && Number.isFinite(a.im);
