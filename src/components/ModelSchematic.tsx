export function ModelSchematic() {
  return (
    <section className="panel schematic-panel" aria-labelledby="schematic-title">
      <h2 id="schematic-title">截面方向示意图</h2>
      <div className="schematic-wrap">
        <svg viewBox="0 0 820 300" role="img" aria-label="一维平板模型截面示意图">
          <defs>
            <marker id="arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M0,0 L8,4 L0,8 Z" fill="#172033" />
            </marker>
          </defs>
          <rect x="250" y="78" width="300" height="130" rx="6" className="schematic-conductor" />
          <line x1="250" x2="550" y1="226" y2="226" className="schematic-dim" />
          <line x1="250" x2="250" y1="218" y2="234" className="schematic-dim" />
          <line x1="550" x2="550" y1="218" y2="234" className="schematic-dim" />
          <text x="400" y="252" textAnchor="middle" className="schematic-label">厚度 2a，x ∈ [-a, a]</text>

          <line x1="400" x2="550" y1="42" y2="42" className="schematic-dim" />
          <line x1="400" x2="400" y1="34" y2="50" className="schematic-dim" />
          <line x1="550" x2="550" y1="34" y2="50" className="schematic-dim" />
          <text x="475" y="30" textAnchor="middle" className="schematic-label">半厚度 a</text>

          <line x1="132" x2="226" y1="143" y2="143" className="schematic-axis" markerEnd="url(#arrow)" />
          <text x="128" y="132" textAnchor="end" className="schematic-label">x 方向</text>
          <line x1="596" x2="718" y1="153" y2="153" className="schematic-axis" markerEnd="url(#arrow)" />
          <text x="657" y="138" textAnchor="middle" className="schematic-label">z 方向 / J_z</text>
          <line x1="588" x2="588" y1="198" y2="104" className="schematic-axis" markerEnd="url(#arrow)" />
          <text x="606" y="104" className="schematic-label">y 方向 / H_y(x)</text>

          <text x="234" y="150" textAnchor="end" className="schematic-boundary">H_L</text>
          <text x="566" y="150" className="schematic-boundary">H_R</text>
          <text x="400" y="144" textAnchor="middle" className="schematic-core">导体板</text>
          <text x="400" y="166" textAnchor="middle" className="schematic-label">宽度 b 沿纸面外方向</text>

          <path d="M270 116 C330 94, 470 94, 530 116" className="schematic-field" />
          <path d="M270 177 C330 197, 470 197, 530 177" className="schematic-field" />
          <text x="410" y="282" textAnchor="middle" className="schematic-label schematic-note">本模型只解析厚度方向上的一维分布</text>
        </svg>
      </div>
    </section>
  );
}
