export function ModelSchematic() {
  return (
    <section className="panel schematic-panel" aria-labelledby="schematic-title">
      <h2 id="schematic-title">截面方向示意图</h2>
      <div className="schematic-wrap">
        <svg viewBox="0 0 760 300" role="img" aria-label="一维平板模型截面示意图">
          <defs>
            <marker id="arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M0,0 L8,4 L0,8 Z" fill="#172033" />
            </marker>
          </defs>
          <rect x="230" y="78" width="300" height="130" rx="6" className="schematic-conductor" />
          <line x1="230" x2="530" y1="226" y2="226" className="schematic-dim" />
          <line x1="230" x2="230" y1="218" y2="234" className="schematic-dim" />
          <line x1="530" x2="530" y1="218" y2="234" className="schematic-dim" />
          <text x="380" y="252" textAnchor="middle" className="schematic-label">厚度 2a，x ∈ [-a, a]</text>

          <line x1="380" x2="530" y1="42" y2="42" className="schematic-dim" />
          <line x1="380" x2="380" y1="34" y2="50" className="schematic-dim" />
          <line x1="530" x2="530" y1="34" y2="50" className="schematic-dim" />
          <text x="455" y="30" textAnchor="middle" className="schematic-label">半厚度 a</text>

          <line x1="128" x2="206" y1="143" y2="143" className="schematic-axis" markerEnd="url(#arrow)" />
          <text x="124" y="132" textAnchor="end" className="schematic-label">x 方向</text>
          <line x1="572" x2="672" y1="143" y2="143" className="schematic-axis" markerEnd="url(#arrow)" />
          <text x="682" y="147" className="schematic-label">J_z 电流方向</text>
          <line x1="574" x2="574" y1="194" y2="104" className="schematic-axis" markerEnd="url(#arrow)" />
          <text x="590" y="102" className="schematic-label">H_y(x)</text>

          <text x="214" y="150" textAnchor="end" className="schematic-boundary">H_L</text>
          <text x="546" y="150" className="schematic-boundary">H_R</text>
          <text x="380" y="150" textAnchor="middle" className="schematic-core">导体板</text>

          <path d="M250 116 C310 94, 450 94, 510 116" className="schematic-field" />
          <path d="M250 171 C310 193, 450 193, 510 171" className="schematic-field" />
          <text x="380" y="282" textAnchor="middle" className="schematic-label">宽度 b 沿纸面外方向；本模型只解析厚度方向上的一维分布</text>
        </svg>
      </div>
    </section>
  );
}
