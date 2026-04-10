interface ViewToggleProps {
  activeView: 'feature' | 'roadmap'
  onToggle: (view: 'feature' | 'roadmap') => void
}

export function ViewToggle({ activeView, onToggle }: ViewToggleProps) {
  return (
    <div style={{
      display: 'flex',
      background: '#13151e',
      borderRadius: 8,
      border: '1px solid #2a2d3a',
      overflow: 'hidden',
    }}>
      {(['feature', 'roadmap'] as const).map((view) => (
        <button
          key={view}
          onClick={() => onToggle(view)}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 500,
            background: activeView === view ? '#3b82f6' : 'transparent',
            border: 'none',
            color: activeView === view ? '#fff' : '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {view === 'feature' ? 'Feature View' : 'Product Map'}
        </button>
      ))}
    </div>
  )
}
