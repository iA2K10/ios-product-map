import { Handle, Position } from '@xyflow/react'

interface ScreenNodeData {
  id: string
  screen_name: string
  screen_number: number
  screenshotPath: string
}

export function ScreenNode({ data }: { data: ScreenNodeData }) {
  return (
    <div style={{
      width: 160,
      background: '#13151e',
      border: '1px solid #2a2d3a',
      borderRadius: 10,
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#4a5068'
      e.currentTarget.style.transform = 'scale(1.02)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#2a2d3a'
      e.currentTarget.style.transform = 'scale(1)'
    }}>
      <div style={{
        width: '100%',
        height: 200,
        background: '#0a0c14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <img
          src={data.screenshotPath}
          alt={data.screen_name}
          style={{
            height: '100%',
            objectFit: 'contain',
          }}
          loading="lazy"
        />
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{
          fontSize: 9,
          color: '#60a5fa',
          fontWeight: 600,
          fontFamily: 'monospace',
          marginBottom: 3,
        }}>
          {data.id}
        </div>
        <div style={{
          fontSize: 10,
          color: '#8b91a5',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          Screen {data.screen_number}
        </div>
      </div>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} id="top" />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} id="bottom" />
    </div>
  )
}
