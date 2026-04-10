import { Handle, Position } from '@xyflow/react'

interface CategoryData {
  label: string
  flowCount: number
  screenCount: number
  color: string
}

export function CategoryNode({ data }: { data: CategoryData }) {
  return (
    <div style={{
      padding: '12px 20px',
      background: '#1a1d27',
      border: `1.5px solid ${data.color}40`,
      borderRadius: 12,
      cursor: 'pointer',
      transition: 'all 0.2s',
      minWidth: 200,
      boxShadow: `0 0 15px ${data.color}10`,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = `${data.color}80`
      e.currentTarget.style.boxShadow = `0 0 20px ${data.color}20`
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = `${data.color}40`
      e.currentTarget.style.boxShadow = `0 0 15px ${data.color}10`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: data.color,
          flexShrink: 0,
        }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e1e4ea' }}>
          {data.label}
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', paddingLeft: 16 }}>
        {data.flowCount} flows &middot; {data.screenCount} screens
      </div>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} id="top" />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} id="bottom" />
    </div>
  )
}
