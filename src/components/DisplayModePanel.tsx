import { Eye, ScanSearch } from "lucide-react";
import { AmplitudeMode, DisplayOptions, ScaleMode, SurfaceSide, ViewMode } from "./displayTypes";

type DisplayModePanelProps = {
  options: DisplayOptions;
  onChange: (next: Partial<DisplayOptions>) => void;
};

type SegmentProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

function Segment<T extends string>({ label, value, options, onChange }: SegmentProps<T>) {
  return (
    <div className="segment-block">
      <span>{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            className={option.value === value ? "active" : ""}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DisplayModePanel({ options, onChange }: DisplayModePanelProps) {
  return (
    <section className="panel display-panel">
      <div className="panel-title">
        <Eye size={18} />
        <h2>显示模式</h2>
      </div>
      <Segment<ViewMode>
        label="视图"
        value={options.viewMode}
        options={[
          { value: "full", label: "全厚度" },
          { value: "surface", label: "表面放大" },
          { value: "both", label: "双视图" },
        ]}
        onChange={(viewMode) => onChange({ viewMode })}
      />
      <Segment<ScaleMode>
        label="纵轴"
        value={options.scaleMode}
        options={[
          { value: "linear", label: "线性" },
          { value: "log", label: "log" },
        ]}
        onChange={(scaleMode) => onChange({ scaleMode })}
      />
      <Segment<AmplitudeMode>
        label="幅值"
        value={options.amplitudeMode}
        options={[
          { value: "absolute", label: "绝对值" },
          { value: "normalized", label: "归一化" },
        ]}
        onChange={(amplitudeMode) => onChange({ amplitudeMode })}
      />
      <Segment<SurfaceSide>
        label="表面"
        value={options.surfaceSide}
        options={[
          { value: "left", label: "左" },
          { value: "right", label: "右" },
          { value: "both", label: "双侧" },
        ]}
        onChange={(surfaceSide) => onChange({ surfaceSide })}
      />
      <p className="tiny-note display-note">
        <ScanSearch size={14} />
        a/δ &gt; 5 时优先看表面放大，主要变化集中在约 1~3 个 δ 内。
      </p>
    </section>
  );
}
