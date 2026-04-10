interface ScreenData {
  id: string
  flow: string
  flow_number: number
  screen_number: number
  screen_name: string
  file: string
  filename: string
}

interface FlowData {
  name: string
  flowNumber: number
  screens: ScreenData[]
}

interface Props {
  screen: ScreenData
  flow: FlowData
  onClose: () => void
  onNavigate: (screen: ScreenData) => void
}

export function ScreenPanel({ screen, flow, onClose, onNavigate }: Props) {
  const currentIndex = flow.screens.findIndex(s => s.id === screen.id)
  const prevScreen = currentIndex > 0 ? flow.screens[currentIndex - 1] : null
  const nextScreen = currentIndex < flow.screens.length - 1 ? flow.screens[currentIndex + 1] : null
  const BASE = import.meta.env.BASE_URL
  const screenshotPath = `${BASE}screens/${screen.file.replace('screens_extracted/', '')}`

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: 380,
      height: '100%',
      background: 'rgba(15, 17, 23, 0.95)',
      borderLeft: '1px solid #2a2d3a',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #2a2d3a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, fontFamily: 'monospace', marginBottom: 4 }}>
            {screen.id}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e1e4ea' }}>
            {screen.screen_name}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Flow: {flow.name}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3a',
            borderRadius: 8,
            color: '#6b7280',
            cursor: 'pointer',
            padding: '6px 10px',
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      {/* Screenshot */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 300,
          background: '#0a0c14',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #2a2d3a',
        }}>
          <img
            src={screenshotPath}
            alt={screen.screen_name}
            style={{ width: '100%', display: 'block' }}
          />
        </div>

        {/* Flow position indicator */}
        <div style={{
          width: '100%',
          padding: '12px 16px',
          background: '#1a1d27',
          borderRadius: 10,
          border: '1px solid #2a2d3a',
        }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
            Flow Position
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {flow.screens.map((s, i) => (
              <div
                key={s.id}
                onClick={() => onNavigate(s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  background: s.id === screen.id ? '#3b82f6' : '#252836',
                  color: s.id === screen.id ? '#fff' : '#6b7280',
                  border: s.id === screen.id ? '1px solid #60a5fa' : '1px solid #2a2d3a',
                  transition: 'all 0.15s',
                }}>
                  {i + 1}
                </div>
                {i < flow.screens.length - 1 && (
                  <div style={{ color: '#3a3f50', fontSize: 10 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div style={{
          width: '100%',
          padding: '12px 16px',
          background: '#1a1d27',
          borderRadius: 10,
          border: '1px solid #2a2d3a',
        }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
            Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Screen ID', screen.id],
              ['Flow', flow.name],
              ['Flow #', String(flow.flowNumber)],
              ['Screen #', String(screen.screen_number)],
              ['Position', `${currentIndex + 1} of ${flow.screens.length}`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{ color: '#c8cdd8', fontFamily: 'monospace', fontSize: 11 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid #2a2d3a',
        display: 'flex',
        gap: 8,
      }}>
        <button
          disabled={!prevScreen}
          onClick={() => prevScreen && onNavigate(prevScreen)}
          style={{
            flex: 1,
            padding: '10px',
            background: prevScreen ? '#1a1d27' : '#13151e',
            border: '1px solid #2a2d3a',
            borderRadius: 8,
            color: prevScreen ? '#e1e4ea' : '#3a3f50',
            cursor: prevScreen ? 'pointer' : 'not-allowed',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          ← Previous
        </button>
        <button
          disabled={!nextScreen}
          onClick={() => nextScreen && onNavigate(nextScreen)}
          style={{
            flex: 1,
            padding: '10px',
            background: nextScreen ? '#3b82f6' : '#13151e',
            border: '1px solid transparent',
            borderRadius: 8,
            color: nextScreen ? '#fff' : '#3a3f50',
            cursor: nextScreen ? 'pointer' : 'not-allowed',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
