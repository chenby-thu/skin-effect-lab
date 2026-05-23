export const formatSci = (value: number, digits = 3): string => {
  if (!Number.isFinite(value)) return "不可用";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e4 || abs < 1e-2) return value.toExponential(digits);
  return value.toLocaleString("zh-CN", { maximumSignificantDigits: digits + 1 });
};

export const formatFixed = (value: number, digits = 3): string => {
  if (!Number.isFinite(value)) return "不可用";
  return value.toLocaleString("zh-CN", { maximumFractionDigits: digits });
};

export const formatPhase = (radians: number): string => `${formatFixed((radians * 180) / Math.PI, 1)}°`;

export const formatMm = (meters: number): string => `${formatFixed(meters * 1e3, 3)} mm`;

export const downloadJson = (filename: string, data: unknown): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
