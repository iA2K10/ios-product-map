interface ViewToggleProps {
  activeView: 'feature' | 'roadmap'
  onToggle: (view: 'feature' | 'roadmap') => void
}

export function ViewToggle({ activeView, onToggle }: ViewToggleProps) {
  return (
    <div style={{
      display: 'flex',
      background: 'rgba(26, 29, 39, 0.95)',
      borderRadius: 999,
      border: '1px solid #2a2d3a',
      padding: 4,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    }}>
      {(['feature', 'roadmap'] as const).map((view) => (
        <button
          key={view}
          onClick={() => onToggle(view)}
          style={{
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 600,
            background: activeView === view ? '#3b82f6' : 'transparent',
            border: 'none',
            borderRadius: 999,
            color: activeView === view ? '#fff' : '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {view === 'feature' ? 'Feature View' : 'Product Map'}
        </button>
      ))}
    </div>
  )
}
