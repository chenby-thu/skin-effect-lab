export type MaterialKey = "copper" | "aluminum" | "steel" | "custom";

export type Material = {
  key: MaterialKey;
  name: string;
  sigma: number;
  muR: number;
};

export const MATERIALS: Material[] = [
  { key: "copper", name: "Copper 铜", sigma: 5.8e7, muR: 1 },
  { key: "aluminum", name: "Aluminum 铝", sigma: 3.5e7, muR: 1 },
  { key: "steel", name: "Steel-like 简化钢", sigma: 1.0e7, muR: 100 },
  { key: "custom", name: "Custom 自定义", sigma: 5.8e7, muR: 1 },
];

export const getMaterial = (key: MaterialKey): Material =>
  MATERIALS.find((material) => material.key === key) ?? MATERIALS[0];
