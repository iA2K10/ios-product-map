import { Handle, Position } from '@xyflow/react'

export function CenterNode({ data }: { data: { label: string } }) {
  return (
    <div style={{
      padding: '16px 32px',
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      border: '2px solid #3b82f6',
      borderRadius: 16,
      cursor: 'default',
      boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)',
      textAlign: 'center',
      minWidth: 200,
    }}>
      <div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
        Product Map
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} id="right" />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} id="bottom" />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} id="left" />
    </div>
  )
}
