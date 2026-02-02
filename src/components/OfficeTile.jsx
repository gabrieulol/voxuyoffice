import { TILE, T, getRoom } from '../lib/constants'

export default function OfficeTile({ type, x, y }) {
  const base = {
    position: 'absolute',
    left: x * TILE,
    top: y * TILE,
    width: TILE,
    height: TILE,
    boxSizing: 'border-box',
    overflow: 'hidden'
  }

  // Clean office floor
  const floorBg = '#f8fafc'
  const floorGrid = (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
      backgroundSize: `${TILE}px ${TILE}px`,
      opacity: 0.5
    }} />
  )

  switch (type) {
    // Floor - clean light tile
    case 0:
      return <div style={{ ...base, background: floorBg }}>{floorGrid}</div>

    // Wall - solid professional gray
    case 1:
      return (
        <div style={{ ...base, background: 'linear-gradient(180deg, #e2e8f0, #cbd5e1)', borderBottom: '2px solid #94a3b8' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,0,0,0.03) 19px, rgba(0,0,0,0.03) 20px)' }} />
        </div>
      )

    // Door - glass door
    case 8:
      return (
        <div style={{ ...base, background: '#e0f2fe', border: '2px solid #0ea5e9' }}>
          <div style={{ position: 'absolute', inset: 6, background: 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', borderRadius: 4 }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 6, height: 6, background: '#0ea5e9', borderRadius: '50%' }} />
        </div>
      )

    // Desk with monitor - white desk
    case 2:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', left: 4, top: 8, right: 4, bottom: 8, background: 'linear-gradient(135deg, #fff, #f1f5f9)', borderRadius: 6, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
            {/* Monitor */}
            <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 22, height: 16, background: '#1e293b', borderRadius: 3, border: '1px solid #334155' }}>
              <div style={{ position: 'absolute', inset: 2, background: 'linear-gradient(135deg, #3b82f6, #1e40af)', borderRadius: 2 }}>
                <div style={{ position: 'absolute', top: 2, left: 2, width: 4, height: 2, background: 'rgba(255,255,255,0.6)', borderRadius: 1 }} />
              </div>
            </div>
            {/* Keyboard */}
            <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 18, height: 6, background: '#64748b', borderRadius: 2 }} />
          </div>
        </div>
      )

    // Chair
    case 18:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 24, height: 24, background: 'linear-gradient(135deg, #4f46e5, #6366f1)', borderRadius: '50%', border: '2px solid #4338ca', boxShadow: '0 2px 8px rgba(79,70,229,0.3)' }} />
        </div>
      )

    // Plant - vibrant green
    case 3:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 18, height: 12, background: 'linear-gradient(180deg, #92400e, #78350f)', borderRadius: '4px 4px 6px 6px' }} />
          <svg style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)' }} width={32} height={32} viewBox="0 0 32 32">
            <ellipse cx={16} cy={18} rx={6} ry={10} fill="#22c55e" transform="rotate(-15 16 18)" />
            <ellipse cx={16} cy={18} rx={6} ry={10} fill="#16a34a" transform="rotate(15 16 18)" />
            <ellipse cx={16} cy={16} rx={5} ry={8} fill="#4ade80" transform="rotate(0 16 16)" />
          </svg>
        </div>
      )

    // Meeting table - clean blue
    case 4:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', inset: 3, background: 'linear-gradient(135deg, #1e40af, #1e3a8a)', borderRadius: 8, boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.2)' }} />
        </div>
      )

    // Kitchen counter - granite look
    case 5:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', left: 3, top: 5, right: 3, bottom: 5, background: 'linear-gradient(180deg, #374151, #1f2937)', borderRadius: 6, border: '1px solid #4b5563' }}>
            <div style={{ position: 'absolute', top: 6, left: 8, width: 10, height: 10, borderRadius: '50%', border: '2px solid #6b7280', background: '#111827' }} />
          </div>
        </div>
      )

    // Sofa - comfortable purple
    case 6:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', left: 3, top: 10, right: 3, bottom: 4, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: 10, border: '2px solid #5b21b6', boxShadow: '0 4px 12px rgba(109,40,217,0.3)' }}>
            <div style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: 6 }} />
          </div>
        </div>
      )

    // Whiteboard - clean white
    case 7:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', left: 5, top: 3, right: 5, bottom: 7, background: '#fff', borderRadius: 4, border: '2px solid #94a3b8', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ position: 'absolute', top: 4, left: 4, width: 12, height: 2, background: '#3b82f6', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 8, left: 4, width: 20, height: 2, background: '#ef4444', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 12, left: 4, width: 16, height: 2, background: '#22c55e', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 16, left: 4, width: 8, height: 2, background: '#f59e0b', borderRadius: 2 }} />
          </div>
        </div>
      )

    // Server rack - tech look
    case 9:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', left: 7, top: 2, right: 7, bottom: 2, background: '#0f172a', borderRadius: 4, border: '1px solid #334155' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ position: 'absolute', top: 4 + i * 8, left: 3, right: 3, height: 5, background: '#1e293b', borderRadius: 2, border: '1px solid #334155' }}>
                <div style={{ position: 'absolute', top: 1, right: 3, width: 3, height: 3, borderRadius: '50%', background: i % 2 === 0 ? '#22c55e' : '#f59e0b', boxShadow: `0 0 4px ${i % 2 === 0 ? '#22c55e' : '#f59e0b'}`, animation: `pulse ${1.5 + i * 0.3}s infinite` }} />
              </div>
            ))}
          </div>
        </div>
      )

    // Bookshelf - warm wood
    case 10:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', left: 3, top: 2, right: 3, bottom: 3, background: '#92400e', borderRadius: 4, border: '1px solid #78350f' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ position: 'absolute', top: 3 + i * 11, left: 3, right: 3, height: 9, borderBottom: '2px solid #78350f', display: 'flex', gap: 2, padding: 2 }}>
                {[...Array(4)].map((_, j) => (
                  <div key={j} style={{ flex: 1, background: ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'][(i * 4 + j) % 6], borderRadius: 1 }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )

    // Carpet blue
    case 11:
      return (
        <div style={{ ...base, background: '#dbeafe' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))' }} />
        </div>
      )

    // Carpet purple
    case 12:
      return (
        <div style={{ ...base, background: '#f3e8ff' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.03))' }} />
        </div>
      )

    // Coffee machine
    case 13:
      return (
        <div style={{ ...base, background: '#f3e8ff' }}>
          <div style={{ position: 'absolute', left: 10, top: 4, right: 10, bottom: 4, background: 'linear-gradient(180deg, #374151, #1f2937)', borderRadius: 6, border: '1px solid #4b5563' }}>
            <div style={{ position: 'absolute', top: 3, right: 4, width: 4, height: 4, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
            <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', fontSize: 8 }}>☕</div>
          </div>
        </div>
      )

    // Water cooler
    case 14:
      return (
        <div style={{ ...base, background: '#f3e8ff' }}>
          <div style={{ position: 'absolute', left: 12, top: 4, right: 12, bottom: 4, background: 'linear-gradient(180deg, #bfdbfe, #93c5fd)', borderRadius: 8, border: '1px solid #3b82f6' }}>
            <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, background: '#60a5fa', borderRadius: '50%', opacity: 0.5 }} />
          </div>
        </div>
      )

    // Printer
    case 15:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', left: 6, top: 10, right: 6, bottom: 6, background: 'linear-gradient(180deg, #f1f5f9, #e2e8f0)', borderRadius: 4, border: '1px solid #cbd5e1' }}>
            <div style={{ position: 'absolute', top: -4, left: 4, right: 4, height: 5, background: '#fff', borderRadius: '3px 3px 0 0', border: '1px solid #e2e8f0' }} />
            <div style={{ position: 'absolute', top: 2, right: 3, width: 3, height: 3, background: '#22c55e', borderRadius: '50%' }} />
          </div>
        </div>
      )

    // Small plant
    case 16:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 14, height: 10, background: 'linear-gradient(180deg, #92400e, #78350f)', borderRadius: '3px 3px 5px 5px' }} />
          <svg style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)' }} width={20} height={18} viewBox="0 0 20 18">
            <ellipse cx={10} cy={10} rx={4} ry={7} fill="#22c55e" transform="rotate(-10 10 10)" />
            <ellipse cx={10} cy={10} rx={4} ry={7} fill="#16a34a" transform="rotate(10 10 10)" />
          </svg>
        </div>
      )

    // Lamp / light
    case 17:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.2), transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 2, height: 28, background: 'linear-gradient(180deg, #78716c, #57534e)' }} />
          <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 14, height: 10, background: 'linear-gradient(180deg, #fef3c7, #fcd34d)', borderRadius: '50%', border: '1px solid #f59e0b' }} />
        </div>
      )

    // TV/Monitor on wall
    case 19:
      return (
        <div style={{ ...base, background: floorBg }}>
          {floorGrid}
          <div style={{ position: 'absolute', left: 4, top: 8, right: 4, bottom: 10, background: '#1e293b', borderRadius: 4, border: '2px solid #0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <div style={{ position: 'absolute', inset: 3, background: 'linear-gradient(135deg, #3b82f6, #1e40af)', borderRadius: 2 }} />
          </div>
        </div>
      )

    // Window - bright daylight
    case 20:
      return (
        <div style={{ ...base, background: 'linear-gradient(180deg, #e2e8f0, #cbd5e1)' }}>
          <div style={{ position: 'absolute', left: 5, top: 4, right: 5, bottom: 6, background: 'linear-gradient(180deg, #bae6fd, #7dd3fc)', borderRadius: 3, border: '2px solid #0284c7', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.5)' }}>
            {/* Window divider */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#0284c7', transform: 'translateX(-50%)' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: '#0284c7', transform: 'translateY(-50%)' }} />
          </div>
        </div>
      )

    default:
      return <div style={{ ...base, background: floorBg }}>{floorGrid}</div>
  }
}
