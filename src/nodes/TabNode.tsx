import { Handle, Position } from '@xyflow/react'

interface TabNodeData {
  label: string
  icon: string
  groupCount: number
  screenCount: number
  color: string
}

export function TabNode({ data }: { data: TabNodeData }) {
  return (
    <div style={{
      padding: '14px 22px',
      background: '#1a1d27',
      border: `1.5px solid ${data.color}50`,
      borderRadius: 14,
      cursor: 'pointer',
      transition: 'all 0.2s',
      minWidth: 220,
      boxShadow: `0 0 20px ${data.color}10`,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = `${data.color}90`
      e.currentTarget.style.boxShadow = `0 0 25px ${data.color}25`
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = `${data.color}50`
      e.currentTarget.style.boxShadow = `0 0 20px ${data.color}10`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
      }}>
        <div style={{ fontSize: 20 }}>{data.icon}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e1e4ea' }}>
          {data.label}
        </div>
      </div>
      {data.groupCount > 0 ? (
        <div style={{ fontSize: 11, color: '#6b7280', paddingLeft: 30 }}>
          {data.groupCount} group{data.groupCount !== 1 ? 's' : ''} &middot; {data.screenCount} screens
        </div>
      ) : (
        <div style={{ fontSize: 11, color: '#4a4f5e', paddingLeft: 30, fontStyle: 'italic' }}>
          No screens mapped yet
        </div>
      )}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
