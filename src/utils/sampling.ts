export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const linspace = (min: number, max: number, count: number): number[] => {
  const n = Math.max(2, Math.floor(count));
  const step = (max - min) / (n - 1);
  return Array.from({ length: n }, (_, index) => min + step * index);
};

export const uniqueSorted = (values: number[], tolerance = 1e-12): number[] => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const result: number[] = [];
  for (const value of sorted) {
    const previous = result[result.length - 1];
    const scale = Math.max(1, Math.abs(value), Math.abs(previous ?? 0));
    if (previous === undefined || Math.abs(value - previous) > tolerance * scale) {
      result.push(value);
    }
  }
  return result;
};

export type SmartMeshMode = "display" | "integration";

export const generateSmartMesh = (a: number, delta: number, mode: SmartMeshMode = "display", samples = 400): number[] => {
  const safeA = Math.max(a, Number.EPSILON);
  const safeDelta = Math.max(delta, Number.EPSILON);
  const baseCount = Math.max(mode === "integration" ? 300 : 80, Math.floor(samples));
  const values = linspace(-safeA, safeA, baseCount);

  const surfaceDepth = Math.min(8 * safeDelta, 2 * safeA);
  const surfaceCount = Math.max(18, Math.ceil((surfaceDepth / safeDelta) * 30) + 1);
  for (let index = 0; index < surfaceCount; index += 1) {
    const s = (surfaceDepth * index) / Math.max(surfaceCount - 1, 1);
    values.push(-safeA + s, safeA - s);
  }

  values.push(-safeA, 0, safeA);
  return uniqueSorted(values).map((x) => clamp(x, -safeA, safeA));
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
