import { TILE, MAP_COLS, MAP_ROWS, T, getRoom } from '../lib/constants'

export default function OfficeTile({ type, x, y }) {
  const base = { position: 'absolute', left: x * TILE, top: y * TILE, width: TILE, height: TILE, boxSizing: 'border-box', overflow: 'hidden' }
  const floorBg = '#181820', floorLine = '#222230'
  const fOv = <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${floorLine} 1px,transparent 1px),linear-gradient(90deg,${floorLine} 1px,transparent 1px)`, backgroundSize: `${TILE}px ${TILE}px`, opacity: 0.4 }} />

  switch (type) {
    // Floor
    case 0: return <div style={{ ...base, background: floorBg }}>{fOv}</div>

    // Wall
    case 1: return <div style={{ ...base, background: 'linear-gradient(180deg,#1a1a24,#14141c)', borderBottom: '3px solid #0c0c12', borderRight: '2px solid #0c0c12' }}><div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg,transparent,transparent 11px,rgba(255,255,255,0.02) 11px,rgba(255,255,255,0.02) 12px)' }} /></div>

    // Door
    case 8: return <div style={{ ...base, background: '#1e1e28', border: '1px solid #2a2a36' }}><div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: TILE * 0.6, height: 6, background: 'linear-gradient(90deg,#40405a,#50506a,#40405a)', borderRadius: 4 }} /></div></div>

    // Desk with monitor
    case 2: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', left: 4, top: 6, right: 4, bottom: 10, background: 'linear-gradient(135deg,#3a3530,#2e2a25)', borderRadius: 6, border: '1px solid #4a4540', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}><div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', width: 24, height: 18, background: 'linear-gradient(135deg,#2a2a34,#222230)', borderRadius: 4, border: '1px solid #3a3a48' }}><div style={{ position: 'absolute', inset: 2, background: 'linear-gradient(135deg,#0d1117,#161b22)', borderRadius: 3 }}><div style={{ position: 'absolute', top: 2, left: 2, width: 5, height: 3, background: T.accent, opacity: 0.4, borderRadius: 1 }} /><div style={{ position: 'absolute', top: 6, left: 2, right: 4, height: 1, background: '#3a3a45', borderRadius: 1 }} /></div></div><div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50)', width: 20, height: 7, background: '#1e1e26', borderRadius: 3, border: '1px solid #2a2a34' }} /></div></div>

    // Big plant
    case 3: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 20, height: 14, background: 'linear-gradient(180deg,#5a4538,#4a3828)', borderRadius: '4px 4px 8px 8px', border: '1px solid #6a5548' }} /><svg style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }} width={34} height={34} viewBox="0 0 34 34"><ellipse cx={17} cy={20} rx={7} ry={12} fill="#1a5a2a" transform="rotate(-18 17 20)" /><ellipse cx={17} cy={20} rx={7} ry={12} fill="#1d6530" transform="rotate(18 17 20)" /><ellipse cx={17} cy={18} rx={6} ry={10} fill="#22703a" transform="rotate(-6 17 18)" /></svg></div>

    // Meeting table
    case 4: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', inset: 3, background: 'linear-gradient(135deg,#1e2848,#182040)', borderRadius: 10, border: '1px solid #2a3858', boxShadow: 'inset 0 2px 16px rgba(99,102,241,0.08)' }} /></div>

    // Kitchen counter
    case 5: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', left: 3, top: 5, right: 3, bottom: 5, background: 'linear-gradient(180deg,#303038,#262630)', borderRadius: 8, border: '1px solid #404050' }}><div style={{ position: 'absolute', top: 5, left: 7, width: 12, height: 12, borderRadius: '50%', border: '3px solid #505060', background: '#1e1e26' }} /></div></div>

    // Sofa
    case 6: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', left: 3, top: 8, right: 3, bottom: 4, background: 'linear-gradient(135deg,#6d28d9,#5b21b6)', borderRadius: 10, border: '1px solid #7c3aed', boxShadow: '0 4px 12px rgba(109,40,217,0.3)' }}><div style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: 6 }} /></div></div>

    // Whiteboard
    case 7: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', left: 5, top: 3, right: 5, bottom: 7, background: '#f5f5f0', borderRadius: 5, border: '3px solid #8888', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}><div style={{ position: 'absolute', top: 5, left: 5, width: 10, height: 2, background: '#3b82f6', borderRadius: 2 }} /><div style={{ position: 'absolute', top: 10, left: 5, width: 18, height: 2, background: '#ef4444', borderRadius: 2 }} /><div style={{ position: 'absolute', top: 15, left: 5, width: 14, height: 2, background: '#10b981', borderRadius: 2 }} /></div></div>

    // Server rack
    case 9: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', left: 7, top: 2, right: 7, bottom: 2, background: '#0e0e16', borderRadius: 5, border: '1px solid #2a2a36' }}>{[0, 1, 2, 3].map(i => <div key={i} style={{ position: 'absolute', top: 4 + i * 9, left: 3, right: 3, height: 6, background: '#18181e', borderRadius: 3, border: '1px solid #262630' }}><div style={{ position: 'absolute', top: 1, right: 3, width: 4, height: 4, borderRadius: '50%', background: i % 2 === 0 ? T.accent : T.warn, boxShadow: `0 0 6px ${i % 2 === 0 ? T.accent : T.warn}`, animation: `pulse ${1.5 + i * 0.4}s infinite` }} /></div>)}</div></div>

    // Bookshelf
    case 10: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', left: 3, top: 2, right: 3, bottom: 3, background: '#352a20', borderRadius: 5, border: '1px solid #453a28' }}>{[0, 1, 2].map(i => <div key={i} style={{ position: 'absolute', top: 3 + i * 13, left: 3, right: 3, height: 11, borderBottom: '2px solid #453a28', display: 'flex', gap: 2, padding: 2 }}>{[...Array(4)].map((_, j) => <div key={j} style={{ flex: 1, background: ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#84cc16'][(i * 4 + j) % 6], borderRadius: 2, opacity: 0.6 }} />)}</div>)}</div></div>

    // Carpet purple accent
    case 11: return <div style={{ ...base, background: '#1a1a26' }}><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(99,102,241,0.03))' }} /><div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(99,102,241,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.08) 1px,transparent 1px)`, backgroundSize: `${TILE}px ${TILE}px` }} /></div>

    // Rug pink accent
    case 12: return <div style={{ ...base, background: '#1c1822' }}><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(217,70,239,0.06),rgba(217,70,239,0.03))' }} /></div>

    // Coffee machine
    case 13: return <div style={{ ...base, background: '#1a1a26' }}><div style={{ position: 'absolute', left: 10, top: 5, right: 10, bottom: 5, background: 'linear-gradient(180deg,#2e2e38,#222228)', borderRadius: 8, border: '1px solid #404050' }}><div style={{ position: 'absolute', top: 3, right: 4, width: 4, height: 4, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444', animation: 'pulse 2.5s infinite' }} /></div></div>

    // Water cooler
    case 14: return <div style={{ ...base, background: '#1a1a26' }}><div style={{ position: 'absolute', left: 13, top: 4, right: 13, bottom: 4, background: 'linear-gradient(180deg,#3b82f640,#2a2a34)', borderRadius: 10, border: '1px solid #3b82f650' }} /></div>

    // Printer
    case 15: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', left: 5, top: 9, right: 5, bottom: 5, background: 'linear-gradient(180deg,#303038,#262630)', borderRadius: 5, border: '1px solid #404050' }}><div style={{ position: 'absolute', top: -4, left: 4, right: 4, height: 5, background: '#f5f5f0', borderRadius: '4px 4px 0 0' }} /></div></div>

    // Small plant
    case 16: return <div style={{ ...base }}><div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 14, height: 10, background: 'linear-gradient(180deg,#6a5548,#5a4538)', borderRadius: '3px 3px 5px 5px' }} /><svg style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)' }} width={22} height={20} viewBox="0 0 22 20"><ellipse cx={11} cy={12} rx={5} ry={8} fill="#22703a" transform="rotate(-12 11 12)" /><ellipse cx={11} cy={12} rx={5} ry={8} fill="#1d6530" transform="rotate(12 11 12)" /></svg></div>

    // Lamp
    case 17: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,191,36,0.12),transparent 70%)' }} /><div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 2, height: 30, background: 'linear-gradient(180deg,#605a50,#403a30)' }} /><div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 16, height: 12, background: 'linear-gradient(180deg,#fbbf2430,#fbbf2418)', borderRadius: '50%', border: '1px solid #fbbf2440' }} /></div>

    // TV
    case 19: return <div style={{ ...base, background: floorBg }}>{fOv}<div style={{ position: 'absolute', left: 4, top: 8, right: 4, bottom: 10, background: '#0a0a10', borderRadius: 6, border: '2px solid #303040', boxShadow: '0 0 20px rgba(99,102,241,0.15)' }}><div style={{ position: 'absolute', inset: 3, background: 'linear-gradient(135deg,#6366f122,#0a0a10)', borderRadius: 4 }} /></div></div>

    // Window
    case 20: return <div style={{ ...base, background: 'linear-gradient(180deg,#1a1a24,#14141c)', borderBottom: '3px solid #0c0c12' }}><div style={{ position: 'absolute', left: 6, top: 4, right: 6, bottom: 8, background: 'linear-gradient(180deg,#2d3748,#1a202c)', borderRadius: 4, border: '2px solid #48597a', boxShadow: 'inset 0 0 20px rgba(99,166,241,0.1)' }}><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent,rgba(99,166,241,0.05))' }} /></div></div>

    default: return <div style={{ ...base, background: floorBg }} />
  }
}
