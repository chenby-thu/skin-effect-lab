export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const linspace = (min: number, max: number, count: number): number[] => {
  const n = Math.max(2, Math.floor(count));
  const step = (max - min) / (n - 1);
  return Array.from({ length: n }, (_, index) => min + step * index);
};

export const logToValue = (logValue: number): number => 10 ** logValue;
export const valueToLog = (value: number): number => Math.log10(value);

export const trapezoid = (xs: number[], ys: number[]): number => {
  let sum = 0;
  for (let i = 1; i < xs.length; i += 1) {
    sum += 0.5 * (ys[i - 1] + ys[i]) * (xs[i] - xs[i - 1]);
  }
  return sum;
};
