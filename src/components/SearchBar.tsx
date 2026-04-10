import { useState, useRef, useEffect, useCallback } from 'react'

interface ScreenResult {
  id: string
  screen_name: string
  flow: string
  flow_number: number
  screen_number: number
  file: string
  filename: string
}

interface Props {
  screens: ScreenResult[]
  onSelect: (screen: ScreenResult) => void
}

export function SearchBar({ screens, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = query.length > 0
    ? screens.filter(s =>
        s.screen_name.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase()) ||
        s.flow.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const item = listRef.current.children[selectedIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleSelect = useCallback((screen: ScreenResult) => {
    onSelect(screen)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }, [onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setQuery('')
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }, [results, selectedIndex, handleSelect])

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-search-bar]')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div data-search-bar style={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      width: 420,
    }}>
      {/* Results dropdown (above input) */}
      {isOpen && results.length > 0 && (
        <div
          ref={listRef}
          style={{
            background: 'rgba(26, 29, 39, 0.95)',
            border: '1px solid #2a2d3a',
            borderBottom: 'none',
            borderRadius: '12px 12px 0 0',
            backdropFilter: 'blur(20px)',
            maxHeight: 320,
            overflow: 'auto',
          }}
        >
          {results.map((screen, i) => (
            <div
              key={screen.id}
              onClick={() => handleSelect(screen)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: i === selectedIndex ? '#252836' : 'transparent',
                borderBottom: '1px solid #1e2030',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: '#60a5fa', fontFamily: 'monospace', fontWeight: 600 }}>
                  {screen.id}
                </span>
                <span style={{ fontSize: 12, color: '#e1e4ea', fontWeight: 500 }}>
                  {screen.screen_name}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#555b6e', paddingLeft: 0 }}>
                Flow: {screen.flow}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(26, 29, 39, 0.95)',
        border: '1px solid #2a2d3a',
        borderRadius: isOpen && results.length > 0 ? '0 0 12px 12px' : 999,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        padding: '0 16px',
        gap: 10,
        transition: 'border-radius 0.15s',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search screens, flows..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e1e4ea',
            fontSize: 13,
            padding: '12px 0',
            fontFamily: 'inherit',
          }}
        />
        <div style={{
          fontSize: 10,
          color: '#555b6e',
          background: '#1a1d27',
          border: '1px solid #2a2d3a',
          borderRadius: 4,
          padding: '2px 6px',
          fontFamily: 'monospace',
          flexShrink: 0,
        }}>
          {'\u2318'}K
        </div>
      </div>
    </div>
  )
}
