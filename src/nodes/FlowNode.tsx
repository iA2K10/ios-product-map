import { Handle, Position } from '@xyflow/react'

interface FlowNodeData {
  label: string
  screenCount: number
  flowNumber: number
  color: string
}

export function FlowNode({ data }: { data: FlowNodeData }) {
  return (
    <div style={{
      padding: '10px 16px',
      background: '#151821',
      border: `1px solid ${data.color}30`,
      borderRadius: 10,
      cursor: 'pointer',
      transition: 'all 0.2s',
      minWidth: 180,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = `${data.color}60`
      e.currentTarget.style.background = '#1a1f2e'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = `${data.color}30`
      e.currentTarget.style.background = '#151821'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          fontSize: 10,
          color: data.color,
          fontWeight: 700,
          background: `${data.color}15`,
          padding: '2px 6px',
          borderRadius: 4,
          flexShrink: 0,
        }}>
          #{data.flowNumber}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#c8cdd8' }}>
          {data.label}
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#555b6e', paddingLeft: 0 }}>
        {data.screenCount} screen{data.screenCount !== 1 ? 's' : ''} &middot; Click to expand
      </div>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} id="top" />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} id="bottom" />
    </div>
  )
}
