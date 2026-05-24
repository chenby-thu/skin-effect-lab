import { lazy, Suspense, useMemo, useState } from "react";
import { AnimationPanel } from "./components/AnimationPanel";
import { ControlPanel } from "./components/ControlPanel";
import { DerivationPanel } from "./components/DerivationPanel";
import { DisplayModePanel } from "./components/DisplayModePanel";
import { DisplayOptions } from "./components/displayTypes";
import { ExportPanel } from "./components/ExportPanel";
import { FieldPlots } from "./components/FieldPlots";
import { HeatMap } from "./components/HeatMap";
import { Layout } from "./components/Layout";
import { ModelLimitsPanel } from "./components/ModelLimitsPanel";
import { ModelSchematic } from "./components/ModelSchematic";
import { PhysicsFlow } from "./components/PhysicsFlow";
import { PresetScenarios } from "./components/PresetScenarios";
import { ResistancePanel } from "./components/ResistancePanel";
import { SkinDepthIndicator } from "./components/SkinDepthIndicator";
import { ValidationPanel } from "./components/ValidationPanel";
import { buildResistanceCurve, computeLosses } from "./physics/loss";
import { MaterialKey, getMaterial } from "./physics/materials";
import { ModelInput, solveSlab } from "./physics/slabModel";
import { PresetScenario } from "./physics/teaching";
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
    <details className="panel compact-details">
      <summary>公式与假设</summary>
      <div className="explain-grid">
        <p>集肤效应来自磁扩散方程导致的连续电流重分布。</p>
        <p>delta 是磁场和电流幅值衰减的特征深度，强集肤时主要变化集中在少数几个 delta 内。</p>
        <p>模式 A 的 R_ac 由 P'=b/sigma ∫|J_rms|^2 dx 与 I_rms^2 定义。</p>
        <p>模式 B 无端子净传输电流，只报告涡流损耗；模式 C 报告等效损耗和外场扰动趋势。</p>
      </div>
    </details>
  );
}

export default function App() {
  const [material, setMaterial] = useState<MaterialKey>("copper");
  const [input, setInput] = useState<ModelInput>(defaultInput);
  const [display, setDisplay] = useState<DisplayOptions>({
    viewMode: "both",
    scaleMode: "linear",
    amplitudeMode: "absolute",
    surfaceSide: "both",
  });
  const [showLimits, setShowLimits] = useState(true);
  const [phaseFraction, setPhaseFraction] = useState(0);

  const safeInput = useMemo(() => sanitizeInput(input), [input]);
  const solution = useMemo(() => solveSlab(safeInput, phaseFraction), [safeInput, phaseFraction]);
  const losses = useMemo(() => computeLosses(solution), [solution]);
  const validations = useMemo(() => validateSolution(solution), [solution]);
  const curve = useMemo(() => buildResistanceCurve(solution.input.a / solution.delta), [solution.input.a, solution.delta]);

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

  const handlePresetApply = (scenario: PresetScenario) => {
    const selected = getMaterial(scenario.material);
    setMaterial(scenario.material);
    setInput((previous) =>
      sanitizeInput({
        ...previous,
        sigma: selected.sigma,
        muR: selected.muR,
        ...scenario.input,
      }),
    );
    setShowLimits(true);
    setPhaseFraction(0);
    setDisplay((previous) => ({
      ...previous,
      viewMode: scenario.id === "strong-skin" || scenario.id === "high-mu" ? "both" : previous.viewMode,
      surfaceSide: "both",
    }));
  };

  return (
    <>
      <header className="hero">
        <div>
          <span className="course-tag">电磁场课程可视化微作品</span>
          <h1>从磁扩散到交流损耗</h1>
          <p>集肤效应、涡流损耗与外磁场扰动的一维实验台</p>
        </div>
      </header>

      <Layout
        sidebar={
          <>
            <PresetScenarios onApply={handlePresetApply} />
            <ControlPanel
              input={safeInput}
              material={material}
              showLimits={showLimits}
              phaseFraction={phaseFraction}
              onInputChange={handleInputChange}
              onMaterialChange={handleMaterialChange}
              onShowLimitsChange={setShowLimits}
              onPhaseChange={setPhaseFraction}
            />
            <DisplayModePanel options={display} onChange={(next) => setDisplay((previous) => ({ ...previous, ...next }))} />
          </>
        }
      >
        <PhysicsFlow solution={solution} losses={losses} />
        <SkinDepthIndicator solution={solution} losses={losses} />
        <ResistancePanel solution={solution} losses={losses} showLimits={showLimits} />
        <FieldPlots solution={solution} losses={losses} curve={curve} display={display} />
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
          <div className="visual-side-stack">
            <AnimationPanel solution={solution} normalized={display.amplitudeMode === "normalized"} />
            <HeatMap solution={solution} />
          </div>
        </div>
        <ModelSchematic />
        <DerivationPanel />
        <ExplanationPanel />
        <ModelLimitsPanel mode={safeInput.mode} />
        <ValidationPanel items={validations} />
        <ExportPanel solution={solution} losses={losses} material={material} validations={validations} />
      </Layout>
    </>
  );
}
