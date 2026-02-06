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
  if (callState === 'idle') return null

  const connectedPeers = Object.entries(callPeers).filter(([_, p]) => p.connected)
  const totalInCall = connectedPeers.length + 1
  const font = "'JetBrains Mono',monospace"
  const isSelfSpeaking = speakingUsers.has(player?.id)
  const anyoneHasVideo = !isCamOff || connectedPeers.some(([_, p]) => !p.camOff)
  const remoteScreenCount = remoteScreenStreams ? Object.keys(remoteScreenStreams).length : 0
  const hasScreenShare = isScreenSharing || remoteScreenCount > 0

  return (
    <div className="voice-call-bar" style={{
      position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)',
      borderRadius: 16, border: `1px solid ${T.accent}33`,
      boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 20px ${T.accent}11`,
      zIndex: 60, animation: 'fadeIn 0.25s ease',
      minWidth: 220, maxWidth: hasScreenShare && expanded ? 800 : (anyoneHasVideo && expanded ? 600 : 500),
      transition: 'max-width 0.3s ease',
    }}>
      {/* Header */}
      <div onClick={() => setExpanded(p => !p)} style={{
        padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', borderBottom: expanded ? `1px solid ${T.border}` : 'none',
      }}>
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
            return room ? room.label : '🔊 Chamada'
          })()}
        </span>
        <span style={{ fontSize: 9, color: T.textDim, fontFamily: font }}>
          {totalInCall} {totalInCall === 1 ? 'pessoa' : 'pessoas'}
        </span>
        <span style={{ fontSize: 10, color: T.textDim, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </div>

      {/* Video Grid + Avatar bubbles */}
      {expanded && callState === 'active' && (
        <div style={{ padding: '8px 10px' }}>
          {/* Screen Share Display - Local */}
          {isScreenSharing && (
            <div style={{ marginBottom: 8 }}>
              <ScreenShareTile
                stream={screenStream}
                label="Sua tela"
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
                />
              </div>
            )
          })}

          {anyoneHasVideo || hasScreenShare ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: totalInCall <= 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: 6,
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
      background: '#111', aspectRatio: '4/3', minHeight: 80,
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
function ScreenShareTile({ stream, label }) {
  const videoRef = useRef(null)
  const fullscreenVideoRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    if (fullscreenVideoRef.current && stream && isFullscreen) {
      fullscreenVideoRef.current.srcObject = stream
    }
  }, [stream, isFullscreen])

  // Handle escape key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFullscreen])

  return (
    <>
      <div style={{
        position: 'relative', borderRadius: 12, overflow: 'hidden',
        background: '#111', width: '100%', aspectRatio: '16/9',
        border: `2px solid ${T.accent}44`,
        cursor: 'pointer',
      }} onClick={() => setIsFullscreen(true)}>
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
          <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textDim }}>Clique para expandir ⤢</span>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 20, cursor: 'zoom-out',
          }}
        >
          <div style={{
            position: 'absolute', top: 20, left: 20, right: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,0,0,0.6)', padding: '8px 14px', borderRadius: 8,
            }}>
              <span style={{ fontSize: 16 }}>💻</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono',monospace" }}>{label}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(false) }}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: T.danger, color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              ✕ Fechar (ESC)
            </button>
          </div>

          {stream && (
            <video
              ref={fullscreenVideoRef}
              autoPlay
              playsInline
              muted
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '95vw', maxHeight: '85vh',
                objectFit: 'contain', borderRadius: 12,
                border: `2px solid ${T.accent}44`,
                cursor: 'default',
              }}
            />
          )}

          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            color: T.textDim, fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
          }}>
            Pressione ESC ou clique fora para fechar
          </div>
        </div>
      )}
    </>
  )
}
