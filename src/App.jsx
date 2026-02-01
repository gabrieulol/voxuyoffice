import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { useRealtime } from './lib/useRealtime'
import { TILE, MAP_COLS, MAP_ROWS, PROXIMITY_RANGE, VIDEO_RANGE, T, STATUS, PALETTES, MAP, ROOMS, SPAWN_POINTS, dist, canWalk, getRoom, timeNow } from './lib/constants'
import AuthScreen from './components/AuthScreen'
import OfficeTile from './components/OfficeTile'

// ═══════════ MAP AVATAR (SVG) ═══════════
function MapAvatar({ person, isPlayer, isNearby, isVideo, isSpeaking, onClick, reaction }) {
  const px = person.x * TILE + TILE / 2, py = person.y * TILE + TILE / 2
  const [c1, c2] = PALETTES[(person.avatar_idx || 0) % PALETTES.length]
  const st = STATUS[person.status] || STATUS.available
  const r = isPlayer ? 16 : 14
  const cid = `clip-${person.id || 'p'}-${Math.random().toString(36).slice(2,6)}`
  const gid = `grad-${person.id || 'p'}-${Math.random().toString(36).slice(2,6)}`

  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {isVideo && !isPlayer && <circle cx={px} cy={py} r={r + 11} fill="none" stroke={T.accent} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.3}><animateTransform attributeName="transform" type="rotate" values={`0 ${px} ${py};360 ${px} ${py}`} dur="8s" repeatCount="indefinite" /></circle>}
      {isNearby && !isPlayer && <circle cx={px} cy={py} r={r + 7} fill={T.accent} opacity={0.05}><animate attributeName="opacity" values="0.05;0.02;0.05" dur="3s" repeatCount="indefinite" /></circle>}
      {isSpeaking && <circle cx={px} cy={py} r={r + 9} fill="none" stroke={T.accent} strokeWidth={1.5} opacity={0.5}><animate attributeName="r" values={`${r + 9};${r + 15};${r + 9}`} dur="0.8s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0;0.5" dur="0.8s" repeatCount="indefinite" /></circle>}
      <ellipse cx={px} cy={py + r + 3} rx={r * 0.65} ry={3} fill="rgba(0,0,0,0.5)" />
      <defs>
        <clipPath id={cid}><circle cx={px} cy={py} r={r} /></clipPath>
        <radialGradient id={gid} cx="35%" cy="35%"><stop offset="0%" stopColor={c2} /><stop offset="100%" stopColor={c1} /></radialGradient>
      </defs>
      <circle cx={px} cy={py} r={r} fill={`url(#${gid})`} stroke={isPlayer ? T.accent : 'rgba(255,255,255,0.12)'} strokeWidth={isPlayer ? 2.5 : 1} />
      {person.avatar_url ? (
        <><image href={person.avatar_url} x={px - r} y={py - r} width={r * 2} height={r * 2} clipPath={`url(#${cid})`} preserveAspectRatio="xMidYMid slice" /><circle cx={px} cy={py} r={r} fill="none" stroke={isPlayer ? T.accent : 'rgba(255,255,255,0.15)'} strokeWidth={isPlayer ? 2.5 : 1.5} /></>
      ) : (
        <text x={px} y={py + 5} textAnchor="middle" fontSize={r * 1.1} style={{ pointerEvents: 'none' }}>{person.emoji || '😊'}</text>
      )}
      <circle cx={px + r * 0.65} cy={py - r * 0.65} r={4.5} fill={st.color} stroke={T.bg} strokeWidth={2.5} />
      {reaction && <g><rect x={px + 8} y={py - r - 20} width={24} height={24} rx={12} fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.1)" strokeWidth={1} /><text x={px + 20} y={py - r - 5} textAnchor="middle" fontSize={14}>{reaction}</text></g>}
      <foreignObject x={px - 45} y={py - r - 17} width={90} height={14}>
        <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: isPlayer ? T.accent : T.textMuted, textShadow: `0 1px 5px ${T.bg},0 0 10px ${T.bg}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.03em' }}>
          {isPlayer ? 'VOCÊ' : (person.display_name || 'Anon').split(' ')[0].toUpperCase()}
        </div>
      </foreignObject>
    </g>
  )
}

// ═══════════ MINIMAP ═══════════
function Minimap({ player, peersArr }) {
  const sc = 3.5
  return (
    <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.85)', borderRadius: 10, padding: 5, backdropFilter: 'blur(8px)', border: `1px solid ${T.border}` }}>
      <svg width={MAP_COLS * sc} height={MAP_ROWS * sc}>
        {MAP.map((row, ry) => row.map((t, rx) => <rect key={`${rx}-${ry}`} x={rx * sc} y={ry * sc} width={sc} height={sc} fill={t === 1 ? '#222' : '#18181e'} stroke="#111" strokeWidth={0.3} />))}
        {peersArr.map(c => <circle key={c.id} cx={c.x * sc + sc / 2} cy={c.y * sc + sc / 2} r={1.5} fill={(STATUS[c.status] || STATUS.available).color} opacity={0.8} />)}
        <circle cx={player.x * sc + sc / 2} cy={player.y * sc + sc / 2} r={2.5} fill={T.accent} stroke={T.bg} strokeWidth={0.5}><animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" /></circle>
      </svg>
    </div>
  )
}

// ═══════════ CHAT ═══════════
function ChatPanel({ messages, onSend, nearbyNames, activeChannel, onChannelChange, channels }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [messages])
  const send = () => { if (!text.trim()) return; onSend(text.trim(), activeChannel); setText('') }
  const filtered = messages.filter(m => m.channel === activeChannel)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg }}>
      <div style={{ display: 'flex', gap: 4, padding: '8px 10px', borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {channels.map(ch => (
          <button key={ch.id} onClick={() => onChannelChange(ch.id)} style={{ padding: '4px 10px', borderRadius: 8, border: activeChannel === ch.id ? `1px solid ${T.accent}` : '1px solid transparent', background: activeChannel === ch.id ? T.accentDim : 'transparent', color: activeChannel === ch.id ? T.accent : T.textDim, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>
            {ch.icon} {ch.label}
          </button>
        ))}
      </div>
      {nearbyNames.length > 0 && activeChannel === 'proximity' && (
        <div style={{ padding: '6px 12px', background: T.accentDim, fontSize: 10, color: T.accent, fontFamily: "'JetBrains Mono',monospace", borderBottom: `1px solid ${T.border}` }}>
          ● Próximos: {nearbyNames.join(', ')}
        </div>
      )}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 && <div style={{ textAlign: 'center', color: T.textDim, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", marginTop: 40 }}><div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>◇</div>{activeChannel === 'proximity' ? 'Ande até alguém' : 'Sem mensagens'}</div>}
        {filtered.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.isMe ? 'flex-end' : 'flex-start' }}>
            {!m.isMe && <span style={{ fontSize: 9, color: T.textDim, marginBottom: 1, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{m.sender}</span>}
            <div style={{ background: m.isMe ? '#1a2a1a' : '#1e1e24', color: m.isMe ? T.accent : T.text, padding: '7px 12px', borderRadius: m.isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px', maxWidth: '85%', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.5, wordBreak: 'break-word', border: m.isMe ? `1px solid ${T.accent}22` : `1px solid ${T.border}` }}>{m.text}</div>
            <span style={{ fontSize: 8, color: T.textDim, marginTop: 1, fontFamily: "'JetBrains Mono',monospace" }}>{m.time}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 10, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
        <input type="text" placeholder="Mensagem..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1, padding: '9px 14px', border: `1px solid ${T.border}`, borderRadius: 10, outline: 'none', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, background: T.surface, color: T.text }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.border} />
        <button onClick={send} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: text.trim() ? T.accent : T.borderLight, color: text.trim() ? T.bg : T.textDim, fontSize: 14, cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>↑</button>
      </div>
    </div>
  )
}

// ═══════════ PEOPLE LIST ═══════════
function PeopleList({ peersArr, player, onSelect }) {
  const [search, setSearch] = useState('')
  const all = peersArr.filter(c => !search || (c.display_name || '').toLowerCase().includes(search.toLowerCase()))
  const grouped = {}; Object.keys(STATUS).forEach(s => grouped[s] = []); all.forEach(c => grouped[c.status]?.push(c))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg }}>
      <div style={{ padding: 10, borderBottom: `1px solid ${T.border}` }}><input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, outline: 'none', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, background: T.surface, color: T.text }} /></div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {Object.entries(STATUS).map(([key, cfg]) => grouped[key]?.length > 0 && (
          <div key={key}>
            <div style={{ padding: '10px 12px 4px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
              <span style={{ color: cfg.color }}>{cfg.icon}</span> {cfg.label} ({grouped[key].length})
            </div>
            {grouped[key].map(c => {
              const near = dist(player, c) <= PROXIMITY_RANGE
              const [cc1, cc2] = PALETTES[(c.avatar_idx || 0) % PALETTES.length]
              return (
                <div key={c.id} onClick={() => onSelect(c)} style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: near ? T.accentDim : 'transparent', borderLeft: near ? `2px solid ${T.accent}` : '2px solid transparent', transition: 'all 0.15s' }} onMouseEnter={e => { if (!near) e.currentTarget.style.background = T.surface }} onMouseLeave={e => { if (!near) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg,${cc1},${cc2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, overflow: 'hidden', border: `1.5px solid ${cfg.color}44` }}>
                    {c.avatar_url ? <img src={c.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.emoji || '😊')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono',monospace" }}>{(c.display_name || 'Anon').split(' ')[0]}</div>
                    <div style={{ fontSize: 9, color: T.textDim, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.activity || c.role || 'Online'}</div>
                  </div>
                  {near && <div style={{ fontSize: 8, padding: '2px 6px', background: T.accent, color: T.bg, borderRadius: 6, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>PERTO</div>}
                </div>
              )
            })}
          </div>
        ))}
        {peersArr.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: T.textDim, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>Ninguém online ainda.<br />Convide seu time! 🚀</div>}
      </div>
    </div>
  )
}

// ═══════════ AVATAR EDITOR ═══════════
function AvatarEditor({ currentPhoto, currentEmoji, onSave, onClose }) {
  const [tab, setTab] = useState(currentPhoto ? 'photo' : 'emoji')
  const [photo, setPhoto] = useState(currentPhoto)
  const [emoji, setEmoji] = useState(currentEmoji || '😊')
  const fileRef = useRef(null)
  const emojis = '😊😎🤓🧑‍💻👨‍💼👩‍💼🦊🐱🐶🐸🦄🐨🎯🔥⚡🚀💎🌟🎮🎸☕🌿🎨🛠📊💡🏗🧪🔄✏'.match(/./gu)
  const handleFile = e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { setPhoto(ev.target.result); setTab('photo') }; r.readAsDataURL(f) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ width: 380, background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono',monospace" }}>Editar Avatar</span><button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button></div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', border: `3px solid ${T.accent}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#6366f1,#818cf8)', fontSize: 40, boxShadow: `0 0 20px ${T.accent}33` }}>
            {tab === 'photo' && photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{emoji}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', margin: '0 20px', borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
          {[{ k: 'photo', l: '📷 Foto' }, { k: 'emoji', l: '😊 Emoji' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, padding: '9px 0', border: 'none', background: tab === t.k ? T.accentDim : 'transparent', color: tab === t.k ? T.accent : T.textDim, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>{t.l}</button>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          {tab === 'photo' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
              <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '16px 0', borderRadius: 12, border: `2px dashed ${T.borderLight}`, background: 'transparent', color: T.textMuted, fontSize: 12, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>📷 {photo ? 'Trocar foto' : 'Escolher foto'}</button>
              {photo && <button onClick={() => setPhoto(null)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.danger}33`, background: 'transparent', color: T.danger, fontSize: 10, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>Remover foto</button>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
              {emojis.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{ width: '100%', aspectRatio: '1', borderRadius: 10, border: emoji === e ? `2px solid ${T.accent}` : `1px solid ${T.border}`, background: emoji === e ? T.accentDim : 'transparent', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{e}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>Cancelar</button>
          <button onClick={() => onSave({ photo: tab === 'photo' ? photo : null, emoji: tab === 'emoji' ? emoji : currentEmoji })} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: T.accent, color: T.bg, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState(null)
  const [rightPanel, setRightPanel] = useState('chat')
  const [showProfile, setShowProfile] = useState(null)
  const [showReactions, setShowReactions] = useState(false)
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [activeChannel, setActiveChannel] = useState('geral')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [notification, setNotification] = useState(null)
  const mapRef = useRef(null)
  const notifRef = useRef(null)

  // ─── AUTH CHECK ───
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id) }
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id) }
      else { setUser(null); setProfile(null); setPlayer(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) {
      setProfile(data)
      const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)]
      setPlayer({
        id: uid, x: spawn.x, y: spawn.y,
        status: data.status || 'available',
        display_name: data.display_name,
        emoji: data.emoji || '😊',
        avatar_url: data.avatar_url,
        role: data.role || '',
        team: data.team || '',
        activity: data.activity || 'Online',
        avatar_idx: uid.charCodeAt(0) % PALETTES.length,
      })
    }
    setLoading(false)
  }

  // ─── REALTIME ───
  const { peers, messages, reactions, updatePresence, sendMessage, sendReaction } = useRealtime(
    user?.id,
    player
  )

  // Convert peers map to array for rendering
  const peersArr = Object.entries(peers).map(([id, p]) => ({ id, ...p, x: Number(p.x), y: Number(p.y) }))

  const nearbyPeople = peersArr.filter(c => player && dist(player, c) <= PROXIMITY_RANGE)
  const currentRoom = player ? getRoom(player.x, player.y) : null
  const channels = [
    { id: 'geral', label: 'Geral', icon: '#' },
    { id: 'proximity', label: 'Próximos', icon: '●' },
    { id: 'ofertas', label: 'Ofertas', icon: '◆' },
    { id: 'random', label: 'Random', icon: '~' },
  ]

  const showNotif = useCallback(msg => {
    setNotification(msg)
    if (notifRef.current) clearTimeout(notifRef.current)
    notifRef.current = setTimeout(() => setNotification(null), 3000)
  }, [])

  // ─── BROADCAST POSITION on move ───
  useEffect(() => {
    if (!player || !user) return
    updatePresence({
      x: player.x, y: player.y, status: player.status,
      display_name: player.display_name, emoji: player.emoji,
      avatar_url: player.avatar_url, role: player.role,
      team: player.team, activity: player.activity,
      avatar_idx: player.avatar_idx,
    })
  }, [player?.x, player?.y, player?.status, player?.emoji, player?.avatar_url])

  // ─── KEYBOARD ───
  useEffect(() => {
    if (!player) return
    const h = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || showProfile || showAvatarEditor) return
      let nx = player.x, ny = player.y
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': ny--; break
        case 'ArrowDown': case 's': case 'S': ny++; break
        case 'ArrowLeft': case 'a': case 'A': nx--; break
        case 'ArrowRight': case 'd': case 'D': nx++; break
        case 'e': case 'E': if (nearbyPeople.length > 0) setShowProfile(nearbyPeople[0]); return
        case 'r': case 'R': setShowReactions(p => !p); return
        default: return
      }
      e.preventDefault()
      if (canWalk(nx, ny)) setPlayer(p => ({ ...p, x: nx, y: ny }))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [player, showProfile, showAvatarEditor, nearbyPeople])

  const handleMapClick = e => {
    if (!player || !mapRef.current || showProfile) return
    const rect = mapRef.current.getBoundingClientRect()
    const tx = Math.floor((e.clientX - rect.left) / TILE)
    const ty = Math.floor((e.clientY - rect.top) / TILE)
    if (canWalk(tx, ty)) setPlayer(p => ({ ...p, x: tx, y: ty }))
  }

  const handleStatusChange = (st) => {
    setPlayer(p => ({ ...p, status: st }))
    supabase.from('profiles').update({ status: st }).eq('id', user.id)
  }

  const handleAvatarSave = async ({ photo, emoji }) => {
    setPlayer(p => ({ ...p, avatar_url: photo, emoji: emoji || p.emoji }))
    setShowAvatarEditor(false)
    showNotif('✅ Avatar atualizado!')
    await supabase.from('profiles').update({ avatar_url: photo, emoji: emoji || player.emoji }).eq('id', user.id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setPlayer(null)
  }

  // ─── LOADING / AUTH ───
  if (loading) return <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, color: T.accent, fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>Carregando...</div>
  if (!user) return <AuthScreen onAuth={u => { setUser(u); loadProfile(u.id) }} />
  if (!player) return <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, color: T.accent, fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>Preparando escritório...</div>

  const mapW = MAP_COLS * TILE, mapH = MAP_ROWS * TILE

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: "'JetBrains Mono',monospace", overflow: 'hidden', color: T.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap');@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}`}</style>

      {/* HEADER */}
      <header style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: `1px solid ${T.border}`, background: T.bg, gap: 10, flexShrink: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${T.accent},#00b37e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: T.bg }}>S</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 6 }}>Stone HQ<span style={{ fontSize: 8, padding: '2px 6px', background: T.accentDim, color: T.accent, borderRadius: 4, fontWeight: 600 }}>LIVE</span></div>
            <div style={{ fontSize: 9, color: T.textDim }}>{currentRoom ? `${currentRoom.icon} ${currentRoom.label}` : '...'}</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowAvatarEditor(true)} style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.accent}44`, background: 'linear-gradient(135deg,#6366f1,#818cf8)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }} title="Editar avatar">
          {player.avatar_url ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : player.emoji}
        </button>
        <div style={{ display: 'flex', gap: 3 }}>
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} onClick={() => handleStatusChange(k)} title={v.label} style={{ width: 26, height: 26, borderRadius: 7, border: player.status === k ? `1.5px solid ${v.color}` : `1px solid ${T.border}`, background: player.status === k ? `${v.color}18` : 'transparent', color: v.color, fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{v.icon}</button>
          ))}
        </div>
        <div style={{ width: 1, height: 18, background: T.border }} />
        <div style={{ fontSize: 10, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: T.accent, fontSize: 8 }}>●</span><b>{peersArr.length + 1}</b> on</div>
        <button onClick={handleLogout} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.textDim, fontSize: 9, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }} title="Sair">Sair</button>
      </header>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#0a0a0e', overflow: 'hidden' }}>
          <div ref={mapRef} onClick={handleMapClick} style={{ width: mapW, height: mapH, position: 'relative', cursor: 'crosshair', borderRadius: 4, overflow: 'hidden' }}>
            {MAP.map((row, ry) => row.map((t, rx) => <OfficeTile key={`${rx}-${ry}`} type={t} x={rx} y={ry} />))}
            {ROOMS.map((r, i) => <div key={i} style={{ position: 'absolute', left: (r.x + 0.3) * TILE, top: (r.y - 0.05) * TILE, fontSize: 8, fontWeight: 700, color: `${r.color}55`, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap', pointerEvents: 'none', fontFamily: "'JetBrains Mono',monospace" }}>{r.icon} {r.label}</div>)}

            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={mapW} height={mapH}>
              <rect x={(player.x - PROXIMITY_RANGE) * TILE} y={(player.y - PROXIMITY_RANGE) * TILE} width={(PROXIMITY_RANGE * 2 + 1) * TILE} height={(PROXIMITY_RANGE * 2 + 1) * TILE} fill={T.accentDim} stroke={T.accent} strokeWidth={0.5} strokeDasharray="6 4" rx={6} opacity={0.25} />
              {peersArr.map(c => <MapAvatar key={c.id} person={c} isPlayer={false} isNearby={dist(player, c) <= PROXIMITY_RANGE} isVideo={dist(player, c) <= VIDEO_RANGE} isSpeaking={false} onClick={() => setShowProfile(c)} reaction={reactions[c.id]} />)}
              <MapAvatar person={player} isPlayer={true} isNearby={false} isVideo={false} isSpeaking={false} reaction={reactions[user.id]} />
            </svg>

            {notification && <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.9)', color: T.accent, padding: '7px 16px', borderRadius: 8, fontSize: 11, fontWeight: 600, backdropFilter: 'blur(8px)', zIndex: 50, animation: 'fadeIn 0.2s ease', whiteSpace: 'nowrap', border: `1px solid ${T.accent}33` }}>{notification}</div>}
            <Minimap player={player} peersArr={peersArr} />

            {/* Toolbar */}
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, background: 'rgba(0,0,0,0.85)', borderRadius: 14, padding: '6px 10px', backdropFilter: 'blur(8px)', border: `1px solid ${T.border}`, zIndex: 40 }}>
              {[
                { i: micOn ? '🎤' : '🔇', a: () => setMicOn(p => !p), on: micOn, c: micOn ? T.accent : T.danger },
                { i: camOn ? '📷' : '📷', a: () => setCamOn(p => !p), on: camOn, c: camOn ? T.accent : T.textDim },
                { i: '🖥', a: () => showNotif('🖥 Screen share (em breve)'), on: false, c: T.textMuted },
                { i: '😊', a: () => setShowReactions(p => !p), on: false, c: T.textMuted },
              ].map((b, i) => <button key={i} onClick={b.a} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${b.on ? b.c + '44' : T.border}`, background: b.on ? `${b.c}15` : 'transparent', color: T.text, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.i}</button>)}
            </div>

            {showReactions && (
              <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', background: T.surface, borderRadius: 14, padding: '8px 10px', display: 'flex', gap: 4, border: `1px solid ${T.border}`, boxShadow: '0 8px 30px rgba(0,0,0,0.4)', zIndex: 50, animation: 'fadeIn 0.15s ease' }}>
                {'👋👍❤️😂🔥🎉👀💡☕🚀'.match(/./gu).map(r => (
                  <button key={r} onClick={() => { sendReaction(r); setShowReactions(false) }} style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r}</button>
                ))}
              </div>
            )}

            {/* Profile card */}
            {showProfile && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 300, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', zIndex: 70, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease' }}>
                {(() => { const [c1, c2] = PALETTES[(showProfile.avatar_idx || 0) % PALETTES.length]; const st = STATUS[showProfile.status] || STATUS.available; return (<>
                  <div style={{ height: 60, background: `linear-gradient(135deg,${c1}22,${c2}22)`, position: 'relative' }}><button onClick={() => setShowProfile(null)} style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 12, cursor: 'pointer' }}>✕</button></div>
                  <div style={{ padding: '0 20px 20px', marginTop: -28 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg,${c1},${c2})`, border: `3px solid ${T.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 10, overflow: 'hidden' }}>{showProfile.avatar_url ? <img src={showProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (showProfile.emoji || '😊')}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{showProfile.display_name || 'Anon'}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{showProfile.role || 'Membro'} · {showProfile.team || 'Time'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: st.color }} /><span style={{ fontSize: 11, color: st.color, fontWeight: 600 }}>{st.label}</span></div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button onClick={() => { if (canWalk(showProfile.x + 1, showProfile.y)) setPlayer(p => ({ ...p, x: showProfile.x + 1, y: showProfile.y })); setShowProfile(null); showNotif(`📍 Indo até ${(showProfile.display_name || '').split(' ')[0]}`) }} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${T.borderLight}`, background: 'transparent', color: T.text, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>📍 Ir até</button>
                      <button onClick={() => { setActiveChannel('proximity'); setRightPanel('chat'); setShowProfile(null) }} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${T.borderLight}`, background: 'transparent', color: T.text, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>💬 Msg</button>
                    </div>
                  </div>
                </>)})()}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ width: 280, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', background: T.bg, flexShrink: 0 }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
            {[{ key: 'chat', label: 'Chat', icon: '◈' }, { key: 'people', label: 'Pessoas', icon: '◉' }].map(t => (
              <button key={t.key} onClick={() => setRightPanel(t.key)} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: rightPanel === t.key ? T.accent : T.textDim, borderBottom: rightPanel === t.key ? `2px solid ${T.accent}` : '2px solid transparent', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em' }}>{t.icon} {t.label}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {rightPanel === 'chat' ? (
              <ChatPanel messages={messages} onSend={sendMessage} nearbyNames={nearbyPeople.map(p => (p.display_name || 'Anon').split(' ')[0])} activeChannel={activeChannel} onChannelChange={setActiveChannel} channels={channels} />
            ) : (
              <PeopleList peersArr={peersArr} player={player} onSelect={c => setShowProfile(c)} />
            )}
          </div>
        </div>
      </div>

      {showAvatarEditor && <AvatarEditor currentPhoto={player.avatar_url} currentEmoji={player.emoji} onSave={handleAvatarSave} onClose={() => setShowAvatarEditor(false)} />}
    </div>
  )
}
