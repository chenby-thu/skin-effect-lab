import { SlidersHorizontal } from "lucide-react";
import { MATERIALS, MaterialKey, getMaterial } from "../physics/materials";
import { Mode, ModelInput } from "../physics/slabModel";
import { formatSci } from "../utils/format";
import { logToValue, valueToLog } from "../utils/sampling";

type ControlPanelProps = {
  input: ModelInput;
  material: MaterialKey;
  normalized: boolean;
  showLimits: boolean;
  phaseFraction: number;
  onInputChange: (next: Partial<ModelInput>) => void;
  onMaterialChange: (key: MaterialKey) => void;
  onNormalizedChange: (value: boolean) => void;
  onShowLimitsChange: (value: boolean) => void;
  onPhaseChange: (value: number) => void;
};

const modeLabels: Record<Mode, string> = {
  A: "A 端子注入电流",
  B: "B 外加磁场涡流",
  C: "C 注入 + 外磁场",
};

export function ControlPanel({
  input,
  material,
  normalized,
  showLimits,
  phaseFraction,
  onInputChange,
  onMaterialChange,
  onNormalizedChange,
  onShowLimitsChange,
  onPhaseChange,
}: ControlPanelProps) {
  const setNumber = (key: keyof ModelInput, value: number) => onInputChange({ [key]: value } as Partial<ModelInput>);

  return (
    <section className="control-panel">
      <div className="panel-title">
        <SlidersHorizontal size={18} />
        <h2>参数控制</h2>
      </div>

      <label>
        材料
        <select value={material} onChange={(event) => onMaterialChange(event.target.value as MaterialKey)}>
          {MATERIALS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        电导率 σ (S/m)
        <input
          type="number"
          min="1000"
          value={input.sigma}
          onChange={(event) => {
            onMaterialChange("custom");
            setNumber("sigma", Number(event.target.value));
          }}
        />
      </label>

      <label>
        相对磁导率 μr
        <input
          type="number"
          min="1"
          value={input.muR}
          onChange={(event) => {
            onMaterialChange("custom");
            setNumber("muR", Number(event.target.value));
          }}
        />
      </label>

      <label>
        频率 f: {formatSci(input.frequency)} Hz
        <input
          type="range"
          min={valueToLog(50)}
          max={valueToLog(1e7)}
          step="0.005"
          value={valueToLog(input.frequency)}
          onChange={(event) => setNumber("frequency", logToValue(Number(event.target.value)))}
        />
      </label>

      <label>
        导体半厚度 a: {(input.a * 1e3).toFixed(3)} mm
        <input
          type="range"
          min="0.05"
          max="20"
          step="0.01"
          value={input.a * 1e3}
          onChange={(event) => setNumber("a", Number(event.target.value) * 1e-3)}
        />
      </label>

      <label>
        导体宽度 b: {(input.b * 1e3).toFixed(1)} mm
        <input
          type="range"
          min="1"
          max="200"
          step="0.5"
          value={input.b * 1e3}
          onChange={(event) => setNumber("b", Number(event.target.value) * 1e-3)}
        />
      </label>

      <label>
        注入电流 Irms (A)
        <input type="number" min="0" value={input.current} onChange={(event) => setNumber("current", Number(event.target.value))} />
      </label>

      <label>
        外加磁场 H0,rms (A/m)
        <input type="number" value={input.h0} onChange={(event) => setNumber("h0", Number(event.target.value))} />
      </label>

      <label>
        模式选择
        <select value={input.mode} onChange={(event) => onInputChange({ mode: event.target.value as Mode })}>
          {(["A", "B", "C"] as Mode[]).map((mode) => (
            <option key={mode} value={mode}>
              {modeLabels[mode]}
            </option>
          ))}
        </select>
      </label>

      <label>
        采样点数 N: {input.samples}
        <input type="range" min="100" max="1000" step="20" value={input.samples} onChange={(event) => setNumber("samples", Number(event.target.value))} />
      </label>

      <label>
        动画相位 t/T: {phaseFraction.toFixed(3)}
        <input type="range" min="0" max="1" step="0.005" value={phaseFraction} onChange={(event) => onPhaseChange(Number(event.target.value))} />
      </label>

      <div className="switch-row">
        <label className="checkbox-label">
          <input type="checkbox" checked={normalized} onChange={(event) => onNormalizedChange(event.target.checked)} />
          显示归一化结果
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={showLimits} onChange={(event) => onShowLimitsChange(event.target.checked)} />
          显示理论极限提示
        </label>
      </div>

      <p className="tiny-note">当前材料基准：σ = {formatSci(getMaterial(material).sigma)} S/m, μr = {getMaterial(material).muR}</p>
    </section>
  );
}
