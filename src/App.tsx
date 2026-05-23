import { lazy, Suspense, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";
import { AnimationPanel } from "./components/AnimationPanel";
import { ControlPanel } from "./components/ControlPanel";
import { ExportPanel } from "./components/ExportPanel";
import { FieldPlots } from "./components/FieldPlots";
import { FormulaPanel } from "./components/FormulaPanel";
import { HeatMap } from "./components/HeatMap";
import { Layout } from "./components/Layout";
import { ResistancePanel } from "./components/ResistancePanel";
import { buildResistanceCurve, computeLosses } from "./physics/loss";
import { MaterialKey, getMaterial } from "./physics/materials";
import { ModelInput, solveSlab } from "./physics/slabModel";
import { validateSolution } from "./physics/validation";
import { clamp } from "./utils/sampling";

const defaultInput: ModelInput = {
  sigma: 5.8e7,
  muR: 1,
  frequency: 1e5,
  a: 2e-3,
  b: 20e-3,
  current: 100,
  h0: 0,
  mode: "A",
  samples: 400,
};

const ThreeScenePanel = lazy(() =>
  import("./components/ThreeScenePanel").then((module) => ({ default: module.ThreeScenePanel })),
);

const sanitizeInput = (input: ModelInput): ModelInput => ({
  ...input,
  sigma: Math.max(input.sigma, 1),
  muR: Math.max(input.muR, 1e-6),
  frequency: clamp(input.frequency, 50, 1e7),
  a: clamp(input.a, 0.05e-3, 20e-3),
  b: clamp(input.b, 1e-3, 200e-3),
  current: Math.max(input.current, 0),
  samples: Math.round(clamp(input.samples, 80, 1200)),
});

function ExplanationPanel() {
  return (
    <section className="panel">
      <h2>物理解释</h2>
      <div className="explain-grid">
        <p>集肤效应不是“电流突然只在表面流”，而是磁扩散方程导致的连续分布。</p>
        <p>趋肤深度 δ 是幅值下降到 1/e 的特征深度，同时相位也会随深度滞后。</p>
        <p>交流电阻不是预先给定的电路参数，而是由 J(x) 分布导致的损耗积分决定。</p>
        <p>同一个扩散方程，不同边界条件可以对应端子注入电流的集肤效应、外加磁场的涡流、外界磁场扰动下的一维邻近效应。</p>
        <p>强集肤近似不能滥用，必须检查 a/δ 是否足够大。</p>
        <p>高 μ 或高 σ 会让 δ 变小，磁场更难进入导体，集肤效应更强。</p>
      </div>
    </section>
  );
}

function ValidationPanel({ items }: { items: ReturnType<typeof validateSolution> }) {
  const icon = {
    pass: <CheckCircle2 size={17} />,
    warn: <AlertTriangle size={17} />,
    fail: <CircleAlert size={17} />,
  };

  return (
    <section className="panel">
      <h2>模型校验</h2>
      <div className="validation-list">
        {items.map((item) => (
          <div key={item.label} className={`validation-item ${item.status}`}>
            {icon[item.status]}
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [material, setMaterial] = useState<MaterialKey>("copper");
  const [input, setInput] = useState<ModelInput>(defaultInput);
  const [normalized, setNormalized] = useState(false);
  const [showLimits, setShowLimits] = useState(true);
  const [phaseFraction, setPhaseFraction] = useState(0);

  const safeInput = useMemo(() => sanitizeInput(input), [input]);
  const solution = useMemo(() => solveSlab(safeInput, phaseFraction), [safeInput, phaseFraction]);
  const losses = useMemo(() => computeLosses(solution), [solution]);
  const validations = useMemo(() => validateSolution(solution), [solution]);
  const curve = useMemo(() => buildResistanceCurve(), []);

  const handleMaterialChange = (key: MaterialKey) => {
    setMaterial(key);
    if (key !== "custom") {
      const selected = getMaterial(key);
      setInput((previous) => ({ ...previous, sigma: selected.sigma, muR: selected.muR }));
    }
  };

  const handleInputChange = (next: Partial<ModelInput>) => {
    setInput((previous) => sanitizeInput({ ...previous, ...next }));
  };

  return (
    <>
      <header className="hero">
        <div>
          <span className="course-tag">电磁场课程可视化微作品</span>
          <h1>从磁扩散方程到交流电阻</h1>
          <p>集肤效应、涡流与邻近效应的一维可视化</p>
        </div>
      </header>

      <Layout
        sidebar={
          <ControlPanel
            input={safeInput}
            material={material}
            normalized={normalized}
            showLimits={showLimits}
            phaseFraction={phaseFraction}
            onInputChange={handleInputChange}
            onMaterialChange={handleMaterialChange}
            onNormalizedChange={setNormalized}
            onShowLimitsChange={setShowLimits}
            onPhaseChange={setPhaseFraction}
          />
        }
      >
        <ResistancePanel solution={solution} losses={losses} curve={curve} showLimits={showLimits} />
        <FieldPlots solution={solution} normalized={normalized} />
        <div className="visual-grid">
          <Suspense
            fallback={
              <section className="panel three-panel">
                <h2>三维直观展示</h2>
                <div className="three-loading">正在加载三维视图...</div>
              </section>
            }
          >
            <ThreeScenePanel solution={solution} />
          </Suspense>
          <AnimationPanel solution={solution} normalized={normalized} />
          <HeatMap solution={solution} />
        </div>
        <FormulaPanel />
        <ExplanationPanel />
        <ValidationPanel items={validations} />
        <ExportPanel solution={solution} losses={losses} />
      </Layout>
    </>
  );
}
