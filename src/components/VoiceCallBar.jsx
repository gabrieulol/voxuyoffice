import { useState, useRef, useEffect } from 'react'
import { T, PALETTES, ROOMS } from '../lib/constants'

// ═══════════════════════════════════════════
// CallBar — Floating call UI with video grid
// ═══════════════════════════════════════════

export default function VoiceCallBar({
  callState, callPeers, callRoom, isMuted, isCamOff, isScreenSharing,
  onToggleMute, onToggleCamera, onToggleScreenShare, onLeaveCall,
  peersMap, player, speakingUsers,
  remoteStreams, remoteScreenStreams, localStream, screenStream,
}) {
  const [expanded, setExpanded] = useState(true)
  const [position, setPosition] = useState({ x: null, y: 56 }) // null x = centered
  const [size, setSize] = useState({ width: 400, height: null }) // null height = auto
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeEdge, setResizeEdge] = useState(null) // 'e', 'w', 's', 'se', 'sw', etc.
  const dragOffset = useRef({ x: 0, y: 0 })
  const initialSize = useRef({ width: 0, height: 0 })
  const initialPos = useRef({ x: 0, y: 0 })
  const barRef = useRef(null)

  // Dragging logic
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'BUTTON') return // Don't drag when clicking buttons
    setIsDragging(true)
    const rect = barRef.current?.getBoundingClientRect()
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
  }

  // Resize logic
  const handleResizeStart = (e, edge) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeEdge(edge)
    const rect = barRef.current?.getBoundingClientRect()
    if (rect) {
      initialSize.current = { width: rect.width, height: rect.height }
      initialPos.current = { x: rect.left, y: rect.top }
      dragOffset.current = { x: e.clientX, y: e.clientY }
    }
  }

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.current.x
        const newY = e.clientY - dragOffset.current.y
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 220, newX)),
          y: Math.max(0, Math.min(window.innerHeight - 100, newY))
        })
      }

      if (isResizing && resizeEdge) {
        const deltaX = e.clientX - dragOffset.current.x
        const deltaY = e.clientY - dragOffset.current.y

        let newWidth = initialSize.current.width
        let newHeight = initialSize.current.height
        let newX = position.x !== null ? position.x : initialPos.current.x
        let newY = position.y

        // Handle horizontal resize
        if (resizeEdge.includes('e')) {
          newWidth = Math.max(280, Math.min(1200, initialSize.current.width + deltaX))
        }
        if (resizeEdge.includes('w')) {
          newWidth = Math.max(280, Math.min(1200, initialSize.current.width - deltaX))
          newX = initialPos.current.x + (initialSize.current.width - newWidth)
        }

        // Handle vertical resize
        if (resizeEdge.includes('s')) {
          newHeight = Math.max(150, Math.min(window.innerHeight - 40, initialSize.current.height + deltaY))
        }
        if (resizeEdge.includes('n')) {
          newHeight = Math.max(150, Math.min(window.innerHeight - 40, initialSize.current.height - deltaY))
          newY = initialPos.current.y + (initialSize.current.height - newHeight)
        }

        setSize({ width: newWidth, height: newHeight })
        if (resizeEdge.includes('w') || resizeEdge.includes('n')) {
          setPosition(prev => ({
            x: resizeEdge.includes('w') ? Math.max(0, newX) : prev.x,
            y: resizeEdge.includes('n') ? Math.max(0, newY) : prev.y
          }))
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeEdge(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, resizeEdge, position.x])

  if (callState === 'idle') return null

  const connectedPeers = Object.entries(callPeers).filter(([_, p]) => p.connected)
  const totalInCall = connectedPeers.length + 1
  const font = "'JetBrains Mono',monospace"
  const isSelfSpeaking = speakingUsers.has(player?.id)
  const anyoneHasVideo = !isCamOff || connectedPeers.some(([_, p]) => !p.camOff)
  const remoteScreenCount = remoteScreenStreams ? Object.keys(remoteScreenStreams).length : 0
  const hasScreenShare = isScreenSharing || remoteScreenCount > 0

  // Calculate position style - ensure window stays within viewport
  const positionStyle = position.x !== null
    ? { left: position.x, top: position.y, transform: 'none' }
    : { left: '50%', top: position.y, transform: 'translateX(-50%)' }

  // Calculate max height to stay within viewport
  const maxHeight = typeof window !== 'undefined' ? window.innerHeight - position.y - 20 : 600

  return (
    <div ref={barRef} className="voice-call-bar" style={{
      position: 'absolute',
      ...positionStyle,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)',
      borderRadius: 16, border: `1px solid ${T.accent}33`,
      boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 20px ${T.accent}11`,
      zIndex: 60, animation: 'fadeIn 0.25s ease',
      width: size.width,
      minWidth: 280,
      maxWidth: 1200,
      height: expanded && size.height ? size.height : 'auto',
      maxHeight: expanded ? maxHeight : 'auto',
      display: 'flex', flexDirection: 'column',
      transition: (isDragging || isResizing) ? 'none' : 'box-shadow 0.3s ease',
      cursor: isDragging ? 'grabbing' : 'default',
    }}>
      {/* Resize handles */}
      {expanded && (
        <>
          {/* Top edge */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'n')}
            style={{
              position: 'absolute', top: -4, left: 20, right: 20, height: 8,
              cursor: 'ns-resize', zIndex: 10,
            }}
          />
          {/* Right edge */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            style={{
              position: 'absolute', right: -4, top: 20, bottom: 20, width: 8,
              cursor: 'ew-resize', zIndex: 10,
            }}
          />
          {/* Bottom edge */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 's')}
            style={{
              position: 'absolute', bottom: -4, left: 20, right: 20, height: 8,
              cursor: 'ns-resize', zIndex: 10,
            }}
          />
          {/* Left edge */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'w')}
            style={{
              position: 'absolute', left: -4, top: 20, bottom: 20, width: 8,
              cursor: 'ew-resize', zIndex: 10,
            }}
          />
          {/* Top-left corner */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            style={{
              position: 'absolute', left: -4, top: -4, width: 16, height: 16,
              cursor: 'nw-resize', zIndex: 11,
            }}
          />
          {/* Top-right corner */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            style={{
              position: 'absolute', right: -4, top: -4, width: 16, height: 16,
              cursor: 'ne-resize', zIndex: 11,
            }}
          />
          {/* Bottom-right corner */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            style={{
              position: 'absolute', right: -4, bottom: -4, width: 16, height: 16,
              cursor: 'se-resize', zIndex: 11,
            }}
          />
          {/* Bottom-left corner */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            style={{
              position: 'absolute', left: -4, bottom: -4, width: 16, height: 16,
              cursor: 'sw-resize', zIndex: 11,
            }}
          />
        </>
      )}

      {/* Header - Draggable */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
          cursor: isDragging ? 'grabbing' : 'grab',
          borderBottom: expanded ? `1px solid ${T.border}` : 'none',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: callState === 'active' ? T.accent : T.warn,
          boxShadow: `0 0 6px ${callState === 'active' ? T.accent : T.warn}`,
          animation: callState === 'joining' ? 'pulse 1s infinite' : 'none',
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: font, flex: 1 }}>
          {callState === 'joining' ? 'Conectando...' : (() => {
            const roomId = callRoom?.replace('room-', '')
            const room = ROOMS.find(r => r.id === roomId)
            return room ? room.label : 'Chamada'
          })()}
        </span>
        <span style={{ fontSize: 9, color: T.textDim, fontFamily: font }}>
          {totalInCall} {totalInCall === 1 ? 'pessoa' : 'pessoas'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(p => !p) }}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px',
            fontSize: 10, color: T.textDim, transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >▾</button>
      </div>

      {/* Video Grid + Avatar bubbles */}
      {expanded && callState === 'active' && (
        <div style={{ padding: '8px 10px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {/* Screen Share Display - Local */}
          {isScreenSharing && (
            <div style={{ marginBottom: 8 }}>
              <ScreenShareTile
                stream={screenStream}
                label="Sua tela"
                isMuted={isMuted}
                isCamOff={isCamOff}
                isScreenSharing={isScreenSharing}
                onToggleMute={onToggleMute}
                onToggleCamera={onToggleCamera}
                onToggleScreenShare={onToggleScreenShare}
                onLeaveCall={onLeaveCall}
              />
            </div>
          )}

          {/* Screen Share Display - Remote */}
          {remoteScreenStreams && Object.entries(remoteScreenStreams).map(([peerId, stream]) => {
            const peerData = peersMap[peerId] || {}
            const peerName = (peerData.display_name || 'Alguém').split(' ')[0]
            return (
              <div key={`screen-${peerId}`} style={{ marginBottom: 8 }}>
                <ScreenShareTile
                  stream={stream}
                  label={`Tela de ${peerName}`}
                  isMuted={isMuted}
                  isCamOff={isCamOff}
                  isScreenSharing={isScreenSharing}
                  onToggleMute={onToggleMute}
                  onToggleCamera={onToggleCamera}
                  onToggleScreenShare={onToggleScreenShare}
                  onLeaveCall={onLeaveCall}
                />
              </div>
            )
          })}

          {anyoneHasVideo || hasScreenShare ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: totalInCall <= 2 ? 'repeat(2, 1fr)' : totalInCall <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: 8,
            }}>
              {/* Self */}
              <VideoTile
                name="Você"
                emoji={player?.emoji || '😊'}
                avatarUrl={player?.avatar_url}
                avatarIdx={player?.avatar_idx || 0}
                speaking={isSelfSpeaking}
                muted={isMuted}
                camOff={isCamOff}
                stream={localStream}
                isSelf={true}
              />
              {/* Remote */}
              {connectedPeers.map(([peerId, peerState]) => {
                const pd = peersMap[peerId] || {}
                return (
                  <VideoTile
                    key={peerId}
                    name={(pd.display_name || 'Anon').split(' ')[0]}
                    emoji={pd.emoji || '😊'}
                    avatarUrl={pd.avatar_url}
                    avatarIdx={pd.avatar_idx || 0}
                    speaking={peerState.speaking}
                    muted={peerState.muted}
                    camOff={peerState.camOff === true}
                    stream={remoteStreams[peerId]}
                    isSelf={false}
                  />
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              <AvatarBubble name="Você" emoji={player?.emoji || '😊'} avatarUrl={player?.avatar_url} avatarIdx={player?.avatar_idx || 0} speaking={isSelfSpeaking} muted={isMuted} />
              {connectedPeers.map(([peerId, peerState]) => {
                const pd = peersMap[peerId] || {}
                return <AvatarBubble key={peerId} name={(pd.display_name || 'Anon').split(' ')[0]} emoji={pd.emoji || '😊'} avatarUrl={pd.avatar_url} avatarIdx={pd.avatar_idx || 0} speaking={peerState.speaking} muted={peerState.muted} />
              })}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{
        padding: '8px 14px', display: 'flex', gap: 6, justifyContent: 'center',
        borderTop: expanded ? `1px solid ${T.border}` : 'none',
        flexShrink: 0,
      }}>
        <CallBtn active={!isMuted} danger={isMuted} onClick={onToggleMute} icon={isMuted ? '🔇' : '🎙'} label={isMuted ? 'Mutado' : 'Mic'} />
        <CallBtn active={!isCamOff} onClick={onToggleCamera} icon={isCamOff ? '📵' : '📹'} label={isCamOff ? 'Cam off' : 'Cam'} />
        <CallBtn active={isScreenSharing} onClick={onToggleScreenShare} icon="💻" label={isScreenSharing ? 'Parando' : 'Tela'} />
        <CallBtn danger onClick={onLeaveCall} icon="❌" label="Sair" />
      </div>
    </div>
  )
}

// ─── Control button ───
function CallBtn({ active, danger, onClick, icon, label }) {
  const bg = danger ? `${T.danger}22` : active ? `${T.accent}18` : 'transparent'
  const border = danger ? `${T.danger}55` : active ? `${T.accent}44` : T.border
  const color = danger ? T.danger : active ? T.accent : T.textDim
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 10, border: `1px solid ${border}`,
      background: bg, color, fontSize: 10, fontWeight: 700, cursor: 'pointer',
      fontFamily: "'JetBrains Mono',monospace", display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {icon} {label}
    </button>
  )
}

// ─── Video tile (with or without video) ───
function VideoTile({ name, emoji, avatarUrl, avatarIdx, speaking, muted, camOff, stream, isSelf }) {
  const videoRef = useRef(null)
  const [c1, c2] = PALETTES[avatarIdx % PALETTES.length]
  const [hasActiveVideo, setHasActiveVideo] = useState(false)

  // Assign stream to video element and handle track changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (stream) {
      video.srcObject = stream

      // Check if video tracks are available
      const checkVideo = () => {
        const videoTracks = stream.getVideoTracks()
        const hasVideo = videoTracks.length > 0 && videoTracks.some(t => t.enabled && t.readyState === 'live')
        setHasActiveVideo(hasVideo)
      }

      checkVideo()

      // Force play on stream assignment
      video.play().catch(() => {
        // Autoplay blocked, will show avatar instead
      })

      // Listen for track changes
      const handleTrackChange = () => {
        checkVideo()
      }

      stream.addEventListener('addtrack', handleTrackChange)
      stream.addEventListener('removetrack', handleTrackChange)

      // Also listen for track state changes
      stream.getVideoTracks().forEach(track => {
        track.onmute = handleTrackChange
        track.onunmute = handleTrackChange
        track.onended = handleTrackChange
      })

      return () => {
        stream.removeEventListener('addtrack', handleTrackChange)
        stream.removeEventListener('removetrack', handleTrackChange)
      }
    } else {
      video.srcObject = null
      setHasActiveVideo(false)
    }
  }, [stream])

  // Re-check video availability when camOff changes
  useEffect(() => {
    if (stream) {
      const videoTracks = stream.getVideoTracks()
      const hasVideo = videoTracks.length > 0 && videoTracks.some(t => t.enabled && t.readyState === 'live')
      setHasActiveVideo(hasVideo && !camOff)
    }
  }, [camOff, stream])

  return (
    <div style={{
      position: 'relative', borderRadius: 12, overflow: 'hidden',
      background: '#111', aspectRatio: '4/3', minWidth: 140, minHeight: 105,
      border: speaking ? `2px solid ${T.accent}` : '2px solid #222',
      transition: 'border-color 0.2s',
    }}>
      {/* Always render video element to maintain stream connection */}
      <video
        ref={videoRef}
        autoPlay playsInline muted={isSelf}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: isSelf ? 'scaleX(-1)' : 'none',
          display: hasActiveVideo && !camOff ? 'block' : 'none',
        }}
      />

      {/* Show avatar when no video */}
      {(!hasActiveVideo || camOff) && (
        <div style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg,${c1}22,${c2}22)`,
          position: 'absolute', inset: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: `linear-gradient(135deg,${c1},${c2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, overflow: 'hidden',
            border: speaking ? `2px solid ${T.accent}` : '2px solid transparent',
          }}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emoji}
          </div>
        </div>
      )}

      {/* Name + indicators overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '4px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {speaking && <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, flexShrink: 0 }} />}
        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono',monospace", flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        {muted && <span style={{ fontSize: 8, opacity: 0.7 }}>🔇</span>}
      </div>
    </div>
  )
}

// ─── Avatar bubble (audio-only view) ───
function AvatarBubble({ name, emoji, avatarUrl, avatarIdx, speaking, muted }) {
  const [c1, c2] = PALETTES[avatarIdx % PALETTES.length]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 12, background: speaking ? `${T.accent}12` : 'transparent' }}>
      <div style={{ position: 'relative' }}>
        {speaking && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${T.accent}`, animation: 'pulse 0.8s infinite' }} />}
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${c1},${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden', border: speaking ? `2px solid ${T.accent}` : '2px solid transparent', opacity: muted ? 0.5 : 1 }}>
          {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emoji}
        </div>
        {muted && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: T.danger, border: `2px solid ${T.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7 }}>🔇</div>}
      </div>
      <span style={{ fontSize: 8, fontWeight: 700, color: speaking ? T.accent : T.textDim, fontFamily: "'JetBrains Mono',monospace", maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </div>
  )
}

// ─── Screen Share Tile ───
function ScreenShareTile({ stream, label, isMuted, isCamOff, isScreenSharing, onToggleMute, onToggleCamera, onToggleScreenShare, onLeaveCall }) {
  const videoRef = useRef(null)
  const floatVideoRef = useRef(null)
  const floatWindowRef = useRef(null)
  const [isFloating, setIsFloating] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  // Position and size state for floating window
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [size, setSize] = useState({ width: 900, height: 550 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeEdge, setResizeEdge] = useState(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const initialSize = useRef({ width: 0, height: 0 })
  const initialPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    if (floatVideoRef.current && stream && isFloating) {
      floatVideoRef.current.srcObject = stream
    }
  }, [stream, isFloating])

  // Handle escape key
  useEffect(() => {
    if (!isFloating) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isMaximized) setIsMaximized(false)
        else setIsFloating(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFloating, isMaximized])

  // Dragging logic
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'BUTTON') return
    if (isMaximized) return
    setIsDragging(true)
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  // Resize start
  const handleResizeStart = (e, edge) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeEdge(edge)
    initialSize.current = { width: size.width, height: size.height }
    initialPos.current = { x: position.x, y: position.y }
    dragOffset.current = { x: e.clientX, y: e.clientY }
  }

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.current.y))
        })
      }
      if (isResizing && resizeEdge) {
        const deltaX = e.clientX - dragOffset.current.x
        const deltaY = e.clientY - dragOffset.current.y

        let newWidth = initialSize.current.width
        let newHeight = initialSize.current.height
        let newX = initialPos.current.x
        let newY = initialPos.current.y

        // Handle horizontal resize
        if (resizeEdge.includes('e')) {
          newWidth = Math.max(320, Math.min(window.innerWidth - 20, initialSize.current.width + deltaX))
        }
        if (resizeEdge.includes('w')) {
          newWidth = Math.max(320, Math.min(window.innerWidth - 20, initialSize.current.width - deltaX))
          newX = initialPos.current.x + (initialSize.current.width - newWidth)
        }

        // Handle vertical resize
        if (resizeEdge.includes('s')) {
          newHeight = Math.max(200, Math.min(window.innerHeight - 20, initialSize.current.height + deltaY))
        }
        if (resizeEdge.includes('n')) {
          newHeight = Math.max(200, Math.min(window.innerHeight - 20, initialSize.current.height - deltaY))
          newY = initialPos.current.y + (initialSize.current.height - newHeight)
        }

        setSize({ width: newWidth, height: newHeight })
        setPosition({ x: Math.max(0, newX), y: Math.max(0, newY) })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeEdge(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, resizeEdge, size])

  return (
    <>
      {/* Inline preview - larger and resizable */}
      <div style={{
        position: 'relative', borderRadius: 12, overflow: 'hidden',
        background: '#111', width: '100%', minHeight: 200, aspectRatio: '16/9',
        border: `2px solid ${T.accent}44`,
        cursor: 'pointer',
        resize: 'both',
      }} onClick={() => { setIsFloating(true); setIsMaximized(false) }}>
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: T.textDim,
          }}>
            <span style={{ fontSize: 32, marginBottom: 8 }}>💻</span>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>Aguardando tela...</span>
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '6px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 12 }}>💻</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono',monospace" }}>{label}</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textDim }}>Clique para expandir</span>
        </div>
      </div>

      {/* Floating Window */}
      {isFloating && (
        <>
          {/* Backdrop when maximized */}
          {isMaximized && (
            <div
              onClick={() => setIsMaximized(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
              }}
            />
          )}

          {/* Floating window */}
          <div
            ref={floatWindowRef}
            style={{
              position: 'fixed',
              zIndex: 9999,
              ...(isMaximized ? {
                inset: 20,
                width: 'auto',
                height: 'auto',
              } : {
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
              }),
              background: 'rgba(0,0,0,0.95)',
              borderRadius: 12,
              border: `2px solid ${T.accent}66`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Resize handles (only when not maximized) */}
            {!isMaximized && (
              <>
                {/* Edges */}
                <div onMouseDown={(e) => handleResizeStart(e, 'n')} style={{ position: 'absolute', top: -4, left: 16, right: 16, height: 8, cursor: 'ns-resize', zIndex: 10 }} />
                <div onMouseDown={(e) => handleResizeStart(e, 's')} style={{ position: 'absolute', bottom: -4, left: 16, right: 16, height: 8, cursor: 'ns-resize', zIndex: 10 }} />
                <div onMouseDown={(e) => handleResizeStart(e, 'w')} style={{ position: 'absolute', left: -4, top: 16, bottom: 16, width: 8, cursor: 'ew-resize', zIndex: 10 }} />
                <div onMouseDown={(e) => handleResizeStart(e, 'e')} style={{ position: 'absolute', right: -4, top: 16, bottom: 16, width: 8, cursor: 'ew-resize', zIndex: 10 }} />
                {/* Corners */}
                <div onMouseDown={(e) => handleResizeStart(e, 'nw')} style={{ position: 'absolute', top: -4, left: -4, width: 16, height: 16, cursor: 'nw-resize', zIndex: 11 }} />
                <div onMouseDown={(e) => handleResizeStart(e, 'ne')} style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, cursor: 'ne-resize', zIndex: 11 }} />
                <div onMouseDown={(e) => handleResizeStart(e, 'sw')} style={{ position: 'absolute', bottom: -4, left: -4, width: 16, height: 16, cursor: 'sw-resize', zIndex: 11 }} />
                <div onMouseDown={(e) => handleResizeStart(e, 'se')} style={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, cursor: 'se-resize', zIndex: 11 }} />
              </>
            )}

            {/* Title bar - draggable */}
            <div
              onMouseDown={handleMouseDown}
              style={{
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.9)',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: isMaximized ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                userSelect: 'none',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 14 }}>💻</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono',monospace", flex: 1 }}>
                {label}
              </span>

              {/* Window controls */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized) }}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: 'none',
                  background: T.accent + '33', color: T.accent,
                  cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title={isMaximized ? 'Restaurar' : 'Maximizar'}
              >
                {isMaximized ? '⧉' : '⤢'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsFloating(false) }}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: 'none',
                  background: T.danger + '33', color: T.danger,
                  cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Fechar (ESC)"
              >
                ✕
              </button>
            </div>

            {/* Video content */}
            <div style={{ flex: 1, background: '#000', position: 'relative', minHeight: 0 }}>
              {stream && (
                <video
                  ref={floatVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>

            {/* Controls bar - always visible */}
            <div style={{
              padding: '10px 16px',
              background: 'rgba(0,0,0,0.95)',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              flexShrink: 0,
            }}>
              <CallBtn active={!isMuted} danger={isMuted} onClick={onToggleMute} icon={isMuted ? '🔇' : '🎙'} label={isMuted ? 'Mutado' : 'Mic'} />
              <CallBtn active={!isCamOff} onClick={onToggleCamera} icon={isCamOff ? '📵' : '📹'} label={isCamOff ? 'Cam off' : 'Cam'} />
              <CallBtn active={isScreenSharing} onClick={onToggleScreenShare} icon="💻" label={isScreenSharing ? 'Parando' : 'Tela'} />
              <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />
              <CallBtn danger onClick={onLeaveCall} icon="❌" label="Sair" />
            </div>

            {/* Status bar */}
            <div style={{
              padding: '4px 10px',
              background: 'rgba(0,0,0,0.9)',
              borderTop: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 10,
              color: T.textDim,
              fontFamily: "'JetBrains Mono',monospace",
              flexShrink: 0,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.danger, animation: 'pulse 1.5s infinite' }} />
                Ao vivo
              </span>
              <span style={{ marginLeft: 'auto' }}>Arraste para mover • Redimensione pelas bordas • ESC para fechar</span>
            </div>
          </div>
        </>
      )}
    </>
  )
}
