import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'

// ═══════════════════════════════════════════════════════════
// useVoiceCall — WebRTC P2P Audio + Video via Supabase signaling
// ═══════════════════════════════════════════════════════════

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

// Request notification permission on load
if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission()
}

// Show browser notification for incoming call
function showCallNotification(callerName) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (document.hasFocus()) return // Don't show if window is focused

  const notification = new Notification('📞 Chamada recebida', {
    body: `${callerName} está te ligando...`,
    icon: '/favicon.svg',
    tag: 'incoming-call',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }

  // Auto close after 30s
  setTimeout(() => notification.close(), 30000)
}

// Play ringtone sound
let ringtoneAudio = null
function playRingtone() {
  try {
    if (ringtoneAudio) {
      ringtoneAudio.pause()
      ringtoneAudio.currentTime = 0
    }
    // Create a simple ringtone using Web Audio API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const playTone = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration - 0.05)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    // Ring pattern
    const now = audioCtx.currentTime
    for (let i = 0; i < 3; i++) {
      playTone(440, now + i * 0.4, 0.15)
      playTone(523, now + i * 0.4 + 0.15, 0.15)
    }
  } catch (e) {
    console.warn('Could not play ringtone:', e)
  }
}

function stopRingtone() {
  if (ringtoneAudio) {
    ringtoneAudio.pause()
    ringtoneAudio.currentTime = 0
  }
}

export function useVoiceCall(userId) {
  const [callState, setCallState] = useState('idle')
  const [callPeers, setCallPeers] = useState({})       // { peerId: { connected, speaking, muted, camOff, screenSharing } }
  const [isMuted, setIsMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)        // camera ON by default
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [speakingUsers, setSpeakingUsers] = useState(new Set())
  const [incomingCall, setIncomingCall] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState({}) // { peerId: MediaStream }
  const [remoteScreenStreams, setRemoteScreenStreams] = useState({}) // { peerId: MediaStream } - remote screen shares
  const [localStream, setLocalStream] = useState(null)  // exposed for local video preview
  const [screenStream, setScreenStream] = useState(null) // screen share stream

  // Device selection
  const [selectedDevices, setSelectedDevices] = useState({
    audioInput: '',
    audioOutput: '',
    videoInput: '',
  })

  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const peersRef = useRef({})
  const remoteAudioRef = useRef({})
  const analyserRef = useRef({})
  const signalChannelRef = useRef(null)
  const callRoomRef = useRef(null)
  const makingOfferRef = useRef({})
  const activeRef = useRef(false)
  const userIdRef = useRef(userId)
  const isCamOffRef = useRef(false)
  const isScreenSharingRef = useRef(false)
  const screenSharePeersRef = useRef(new Set()) // peers currently sharing screen
  userIdRef.current = userId

  // ─── SPEAKING DETECTION ───
  const startSpeakingDetection = useCallback((stream, peerId) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.4
      source.connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const check = () => {
        if (!analyserRef.current[peerId]) return
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        const speaking = avg > 15
        setSpeakingUsers(prev => {
          const next = new Set(prev)
          if (speaking) next.add(peerId); else next.delete(peerId)
          return next
        })
        setCallPeers(prev => {
          if (!prev[peerId] || prev[peerId].speaking === speaking) return prev
          return { ...prev, [peerId]: { ...prev[peerId], speaking } }
        })
        analyserRef.current[peerId] = { audioCtx, animFrame: requestAnimationFrame(check) }
      }
      analyserRef.current[peerId] = { audioCtx, animFrame: requestAnimationFrame(check) }
    } catch (e) { console.warn('Speaking detection failed:', e) }
  }, [])

  const stopSpeakingDetection = useCallback((peerId) => {
    const info = analyserRef.current[peerId]
    if (info) {
      if (info.animFrame) cancelAnimationFrame(info.animFrame)
      if (info.audioCtx?.state !== 'closed') info.audioCtx.close().catch(() => { })
      delete analyserRef.current[peerId]
    }
    setSpeakingUsers(prev => { const n = new Set(prev); n.delete(peerId); return n })
  }, [])

  const sendSignal = useCallback((payload) => {
    signalChannelRef.current?.send({ type: 'broadcast', event: 'voice-signal', payload })
  }, [])

  const cleanupPeer = useCallback((peerId) => {
    const pc = peersRef.current[peerId]
    if (pc) { pc.close(); delete peersRef.current[peerId] }
    const audio = remoteAudioRef.current[peerId]
    if (audio) { audio.srcObject = null; delete remoteAudioRef.current[peerId] }
    stopSpeakingDetection(peerId)
    setCallPeers(prev => { const n = { ...prev }; delete n[peerId]; return n })
    setRemoteStreams(prev => { const n = { ...prev }; delete n[peerId]; return n })
  }, [stopSpeakingDetection])

  // ─── CREATE PEER ───
  const createPeer = useCallback((peerId, isInitiator) => {
    if (peersRef.current[peerId]) peersRef.current[peerId].close()
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    // Add ALL local tracks (audio + video if present)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current))
    }

    // Also add screen share track if we're currently sharing
    if (screenStreamRef.current && isScreenSharingRef.current) {
      const screenTrack = screenStreamRef.current.getVideoTracks()[0]
      if (screenTrack) {
        pc.addTrack(screenTrack, screenStreamRef.current)
        console.log('[VoiceCall] Added screen share track to new peer:', peerId)
      }
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal({ from: userIdRef.current, to: peerId, type: 'ice-candidate', candidate: candidate.toJSON(), room: callRoomRef.current })
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCallPeers(prev => ({ ...prev, [peerId]: { ...prev[peerId], connected: true } }))
      else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) cleanupPeer(peerId)
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      if (!stream) return

      const track = event.track
      const hasVideo = stream.getVideoTracks().length > 0
      const hasAudio = stream.getAudioTracks().length > 0

      // Detect screen share based on track label
      const labelHints = ['screen', 'window', 'display', 'monitor', 'tab', 'entire']
      const label = (track.label || '').toLowerCase()
      const isLabelHint = track.kind === 'video' && labelHints.some(h => label.includes(h))

      // Camera labels usually contain 'camera', 'facetime', 'integrated', etc
      const cameraHints = ['camera', 'facetime', 'integrated', 'webcam', 'built-in', 'usb', 'hd pro']
      const isCameraLabel = track.kind === 'video' && cameraHints.some(h => label.includes(h))

      const isPeerSharing = screenSharePeersRef.current.has(peerId)

      // Is screen share if: label hints match, OR (peer is sharing AND this is NOT a camera track)
      const isScreenShareTrack = track.kind === 'video' && (isLabelHint || (isPeerSharing && !isCameraLabel && !hasAudio))

      if (isScreenShareTrack) {
        console.log('[VoiceCall] Received screen share from', peerId, 'label:', track.label, 'isPeerSharing:', isPeerSharing)

        // Create a new stream with just the video track for screen share
        const screenOnlyStream = new MediaStream([track])
        setRemoteScreenStreams(prev => ({ ...prev, [peerId]: screenOnlyStream }))
        setCallPeers(prev => prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], screenSharing: true } } : prev)

        track.onended = () => {
          console.log('[VoiceCall] Screen share track ended from', peerId)
          setRemoteScreenStreams(prev => {
            const next = { ...prev }
            delete next[peerId]
            return next
          })
          setCallPeers(prev => prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], screenSharing: false } } : prev)
          screenSharePeersRef.current.delete(peerId)
        }

        // If there's also audio in the stream, we still want that
        if (hasAudio) {
          let el = remoteAudioRef.current[peerId]
          if (!el) { el = new Audio(); el.autoplay = true; el.playsInline = true; remoteAudioRef.current[peerId] = el }
          el.srcObject = stream
        }

        return // Don't process video as regular stream
      }

      // Regular audio/video stream
      if (hasAudio) {
        // Setup audio playback
        let el = remoteAudioRef.current[peerId]
        if (!el) { el = new Audio(); el.autoplay = true; el.playsInline = true; remoteAudioRef.current[peerId] = el }
        el.srcObject = stream
        startSpeakingDetection(stream, peerId)
      }

      // Update remote stream (contains both audio+video tracks)
      setRemoteStreams(prev => ({ ...prev, [peerId]: stream }))

      setCallPeers(prev => ({
        ...prev, [peerId]: {
          connected: true,
          speaking: false,
          muted: prev[peerId]?.muted || false,
          camOff: !hasVideo,
          screenSharing: prev[peerId]?.screenSharing || false
        },
      }))

      // Listen for track add/remove to detect cam toggle
      stream.onaddtrack = () => {
        const vid = stream.getVideoTracks().length > 0
        setCallPeers(prev => prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], camOff: !vid } } : prev)
        setRemoteStreams(prev => ({ ...prev, [peerId]: stream }))
      }
      stream.onremovetrack = () => {
        const vid = stream.getVideoTracks().length > 0
        setCallPeers(prev => prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], camOff: !vid } } : prev)
        setRemoteStreams(prev => ({ ...prev, [peerId]: stream }))
      }
    }

    peersRef.current[peerId] = pc

    if (isInitiator) {
      ; (async () => {
        makingOfferRef.current[peerId] = true
        try {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          sendSignal({ from: userIdRef.current, to: peerId, type: 'offer', sdp: pc.localDescription.sdp, room: callRoomRef.current })
        } catch (e) { console.warn('Offer failed:', e) }
        makingOfferRef.current[peerId] = false
      })()
    }
    return pc
  }, [sendSignal, startSpeakingDetection, cleanupPeer])

  // ─── HANDLE SIGNAL ───
  const handleSignal = useCallback(async (payload) => {
    if (payload.from === userId) return
    const peerId = payload.from

    if (payload.type === 'call-invite' && payload.to === userId) {
      if (activeRef.current) return
      setIncomingCall({ from: peerId, fromName: payload.fromName, room: payload.room })
      setCallState('ringing')

      // Show browser notification
      showCallNotification(payload.fromName || 'Alguém')

      // Play ringtone sound
      playRingtone()

      return
    }
    if (payload.type === 'call-declined' && payload.to === userId) return
    if (payload.to !== '*' && payload.to !== userId) return

    if (payload.type === 'peer-joined') {
      console.log('[VoiceCall] Received peer-joined from:', peerId, 'room:', payload.room, 'my room:', callRoomRef.current, 'active:', activeRef.current)
      if (activeRef.current && callRoomRef.current === payload.room && !peersRef.current[peerId]) {
        console.log('[VoiceCall] Creating peer connection with:', peerId)
        createPeer(peerId, true)

        // If we're screen sharing, notify the new peer
        if (isScreenSharingRef.current) {
          setTimeout(() => {
            sendSignal({ from: userId, to: peerId, type: 'screen-state', sharing: true, room: callRoomRef.current })
            console.log('[VoiceCall] Notified new peer of our screen share:', peerId)
          }, 500)
        }
      } else {
        console.log('[VoiceCall] Skipping peer-joined - conditions not met. active:', activeRef.current, 'sameRoom:', callRoomRef.current === payload.room, 'alreadyConnected:', !!peersRef.current[peerId])
      }
      return
    }
    if (payload.type === 'peer-left') { cleanupPeer(peerId); return }
    if (payload.type === 'mute-state') {
      setCallPeers(prev => prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], muted: payload.muted } } : prev)
      return
    }
    if (payload.type === 'cam-state') {
      setCallPeers(prev => prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], camOff: payload.camOff } } : prev)
      return
    }
    if (payload.type === 'screen-state') {
      console.log('[VoiceCall] Received screen-state from', peerId, 'sharing:', payload.sharing)
      setCallPeers(prev => prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], screenSharing: payload.sharing } } : prev)

      // If peer started sharing, try to identify and move their screen stream
      if (payload.sharing) {
        // Mark that this peer is sharing
        screenSharePeersRef.current.add(peerId)

        // Check if we already have a video stream from this peer - the renegotiation might bring a new track
        // We'll handle it when the new track arrives via ontrack
        console.log('[VoiceCall] Peer', peerId, 'started screen sharing, waiting for track')

        // Also check existing peer connection for video tracks that might be screen shares
        const pc = peersRef.current[peerId]
        if (pc) {
          const receivers = pc.getReceivers()
          const videoReceiver = receivers.find(r => r.track && r.track.kind === 'video' && r.track.readyState === 'live')
          if (videoReceiver && videoReceiver.track) {
            // Check if this track looks like a screen share
            const label = (videoReceiver.track.label || '').toLowerCase()
            const labelHints = ['screen', 'window', 'display', 'monitor', 'tab', 'entire']
            if (labelHints.some(h => label.includes(h))) {
              console.log('[VoiceCall] Found existing screen share track from', peerId)
              // Create a new MediaStream with this track
              const screenStream = new MediaStream([videoReceiver.track])
              setRemoteScreenStreams(prev => ({ ...prev, [peerId]: screenStream }))
            }
          }
        }
      } else {
        // Peer stopped sharing, remove their screen stream
        screenSharePeersRef.current.delete(peerId)
        setRemoteScreenStreams(prev => {
          const next = { ...prev }
          delete next[peerId]
          return next
        })
      }
      return
    }

    if (!activeRef.current || payload.room !== callRoomRef.current) return

    if (payload.type === 'offer') {
      let pc = peersRef.current[peerId] || createPeer(peerId, false)
      try {
        const collision = makingOfferRef.current[peerId] || pc.signalingState !== 'stable'
        if (collision && userId > peerId) return
        if (collision) await pc.setLocalDescription({ type: 'rollback' })
        await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp })
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignal({ from: userId, to: peerId, type: 'answer', sdp: pc.localDescription.sdp, room: callRoomRef.current })
      } catch (e) { console.warn('Offer handling error:', e) }
    } else if (payload.type === 'answer') {
      try { await peersRef.current[peerId]?.setRemoteDescription({ type: 'answer', sdp: payload.sdp }) } catch (e) { console.warn('Answer error:', e) }
    } else if (payload.type === 'ice-candidate') {
      try { await peersRef.current[peerId]?.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch (e) { console.warn('ICE error:', e) }
    }
  }, [userId, createPeer, cleanupPeer, sendSignal])

  // ─── GLOBAL SIGNALING CHANNEL ───
  useEffect(() => {
    if (!userId) return
    const ch = supabase.channel('stone-hq-voice-signals', { config: { broadcast: { self: false } } })
    ch.on('broadcast', { event: 'voice-signal' }, ({ payload }) => handleSignal(payload))
    ch.subscribe()
    signalChannelRef.current = ch
    return () => { ch.unsubscribe(); signalChannelRef.current = null }
  }, [userId, handleSignal])

  // ─── ACQUIRE MEDIA (mic always, camera optional) ───
  const acquireMedia = useCallback(async (withVideo = false, devices = null) => {
    const devs = devices || selectedDevices
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(devs.audioInput ? { deviceId: { exact: devs.audioInput } } : {}),
      },
    }
    if (withVideo) {
      constraints.video = {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 24 },
        ...(devs.videoInput ? { deviceId: { exact: devs.videoInput } } : {}),
      }
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    localStreamRef.current = stream
    setLocalStream(stream)
    startSpeakingDetection(stream, userId)
    isCamOffRef.current = !withVideo
    setIsCamOff(!withVideo)
  }, [userId, startSpeakingDetection, selectedDevices])

  // ─── CHANGE DEVICES DURING CALL ───
  const changeDevices = useCallback(async (newDevices) => {
    setSelectedDevices(newDevices)

    // If in a call, replace tracks with new devices
    if (activeRef.current && localStreamRef.current) {
      // Stop old tracks
      localStreamRef.current.getTracks().forEach(t => t.stop())

      // Get new stream with selected devices
      const hasVideo = !isCamOffRef.current
      await acquireMedia(hasVideo, newDevices)

      // Replace tracks in all peer connections
      const newStream = localStreamRef.current
      Object.values(peersRef.current).forEach(pc => {
        const senders = pc.getSenders()
        senders.forEach(sender => {
          if (sender.track?.kind === 'audio') {
            const newAudioTrack = newStream.getAudioTracks()[0]
            if (newAudioTrack) sender.replaceTrack(newAudioTrack)
          } else if (sender.track?.kind === 'video') {
            const newVideoTrack = newStream.getVideoTracks()[0]
            if (newVideoTrack) sender.replaceTrack(newVideoTrack)
          }
        })
      })
    }

    // Set audio output on remote audio elements
    if (newDevices.audioOutput) {
      Object.values(remoteAudioRef.current).forEach(el => {
        if (el.setSinkId) {
          el.setSinkId(newDevices.audioOutput).catch(() => { })
        }
      })
    }
  }, [acquireMedia])

  // ─── JOIN ROOM CALL ───
  // autoJoin: when true, starts with camera OFF (for automatic room calls)
  const joinCall = useCallback(async (roomId, existingPeerIds = [], autoJoin = false) => {
    if (activeRef.current) return
    activeRef.current = true
    setCallState('joining')
    callRoomRef.current = roomId
    try {
      // Auto-join starts with camera OFF for comfort, manual join starts with camera ON
      await acquireMedia(!autoJoin)
      // Broadcast that we joined - peers already in the call will connect to us
      sendSignal({ from: userId, to: '*', type: 'peer-joined', room: roomId })
      // Also try to connect to peers we know are in the room
      existingPeerIds.forEach(pid => {
        if (pid !== userId && !peersRef.current[pid]) {
          createPeer(pid, true)
        }
      })
      setCallState('active')
    } catch (e) {
      activeRef.current = false; callRoomRef.current = null; setCallState('idle'); throw e
    }
  }, [userId, acquireMedia, createPeer, sendSignal])

  // ─── DIRECT CALL ───
  const callPerson = useCallback(async (targetId, myName, onSendPush) => {
    if (activeRef.current) return
    const roomId = `dm-${[userId, targetId].sort().join('-')}`

    // Send signal via realtime for users with the app open
    sendSignal({ from: userId, to: targetId, type: 'call-invite', room: roomId, fromName: myName || 'Alguém' })

    // Also send push notification for users who may have the app closed
    if (onSendPush) {
      onSendPush(targetId, {
        title: '📞 Chamada recebida',
        body: `${myName || 'Alguém'} está te ligando...`,
        tag: 'incoming-call',
        requireInteraction: true,
        callerId: userId,
        roomId: roomId,
        actions: [
          { action: 'accept', title: '✓ Atender' },
          { action: 'decline', title: '✕ Recusar' }
        ]
      })
    }

    activeRef.current = true
    setCallState('joining')
    callRoomRef.current = roomId
    try { await acquireMedia(true); setCallState('active') }
    catch (e) { activeRef.current = false; callRoomRef.current = null; setCallState('idle'); throw e }
  }, [userId, acquireMedia, sendSignal])

  // ─── ACCEPT CALL ───
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return
    stopRingtone()
    const { from: peerId, room: roomId } = incomingCall
    setIncomingCall(null)
    activeRef.current = true
    setCallState('joining')
    callRoomRef.current = roomId
    try {
      await acquireMedia(true)
      sendSignal({ from: userId, to: '*', type: 'peer-joined', room: roomId })
      createPeer(peerId, true)
      setCallState('active')
    } catch (e) { activeRef.current = false; callRoomRef.current = null; setCallState('idle') }
  }, [incomingCall, userId, acquireMedia, createPeer, sendSignal])

  // ─── DECLINE CALL ───
  const declineCall = useCallback(() => {
    if (!incomingCall) return
    stopRingtone()
    sendSignal({ from: userId, to: incomingCall.from, type: 'call-declined', room: incomingCall.room })
    setIncomingCall(null)
    setCallState('idle')
  }, [incomingCall, userId, sendSignal])

  // ─── LEAVE CALL ───
  const leaveCall = useCallback(() => {
    activeRef.current = false
    sendSignal({ from: userId, to: '*', type: 'peer-left', room: callRoomRef.current })
    Object.keys(peersRef.current).forEach(cleanupPeer)
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null }
    setLocalStream(null)
    stopSpeakingDetection(userId)
    Object.keys(analyserRef.current).forEach(stopSpeakingDetection)
    callRoomRef.current = null
    setCallState('idle'); setCallPeers({}); setIsMuted(false); setIsCamOff(false)
    isCamOffRef.current = false
    setSpeakingUsers(new Set()); setRemoteStreams({})
  }, [userId, cleanupPeer, stopSpeakingDetection, sendSignal])

  // ─── TOGGLE MUTE ───
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) {
      console.warn('[VoiceCall] Cannot toggle mute - no local stream')
      return
    }

    const newMuted = !isMuted
    const audioTracks = localStreamRef.current.getAudioTracks()

    console.log('[VoiceCall] Toggle mute:', newMuted, 'tracks:', audioTracks.length)

    // Disable audio tracks on local stream
    audioTracks.forEach(track => {
      track.enabled = !newMuted
      console.log('[VoiceCall] Audio track enabled:', track.enabled, 'id:', track.id)
    })

    // Also disable on all peer connection senders for reliability
    Object.values(peersRef.current).forEach(pc => {
      const audioSender = pc.getSenders().find(s => s.track && s.track.kind === 'audio')
      if (audioSender && audioSender.track) {
        audioSender.track.enabled = !newMuted
        console.log('[VoiceCall] Sender audio track enabled:', audioSender.track.enabled)
      }
    })

    setIsMuted(newMuted)
    sendSignal({ from: userId, to: '*', type: 'mute-state', muted: newMuted, room: callRoomRef.current })
  }, [isMuted, userId, sendSignal])

  // ─── TOGGLE CAMERA ───
  const toggleCamera = useCallback(async () => {
    if (!activeRef.current || !localStreamRef.current) return

    const currentlyOff = isCamOffRef.current

    if (currentlyOff) {
      // Turn camera ON: get video stream and add track to all peers
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } },
        })
        const videoTrack = videoStream.getVideoTracks()[0]

        // Add to local stream
        localStreamRef.current.addTrack(videoTrack)
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()))

        // Add track to all existing peer connections
        Object.entries(peersRef.current).forEach(([peerId, pc]) => {
          try {
            pc.addTrack(videoTrack, localStreamRef.current)
              // Renegotiate
              ; (async () => {
                makingOfferRef.current[peerId] = true
                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)
                sendSignal({ from: userIdRef.current, to: peerId, type: 'offer', sdp: pc.localDescription.sdp, room: callRoomRef.current })
                makingOfferRef.current[peerId] = false
              })()
          } catch (e) { console.warn('Add video track failed for', peerId, e) }
        })

        isCamOffRef.current = false
        setIsCamOff(false)
        sendSignal({ from: userId, to: '*', type: 'cam-state', camOff: false, room: callRoomRef.current })
      } catch (e) {
        console.warn('Failed to get camera:', e)
      }
    } else {
      // Turn camera OFF: remove video tracks
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        // Remove from all peer connections
        Object.values(peersRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track === track)
          if (sender) {
            pc.removeTrack(sender)
            // Renegotiate
            const peerId = Object.entries(peersRef.current).find(([_, p]) => p === pc)?.[0]
            if (peerId) {
              ; (async () => {
                makingOfferRef.current[peerId] = true
                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)
                sendSignal({ from: userIdRef.current, to: peerId, type: 'offer', sdp: pc.localDescription.sdp, room: callRoomRef.current })
                makingOfferRef.current[peerId] = false
              })()
            }
          }
        })
        track.stop()
        localStreamRef.current.removeTrack(track)
      })

      setLocalStream(new MediaStream(localStreamRef.current.getTracks()))
      isCamOffRef.current = true
      setIsCamOff(true)
      sendSignal({ from: userId, to: '*', type: 'cam-state', camOff: true, room: callRoomRef.current })
    }
  }, [userId, sendSignal])

  // ─── TOGGLE SCREEN SHARE ───
  const toggleScreenShare = useCallback(async () => {
    if (!activeRef.current) return

    if (!isScreenSharingRef.current) {
      // Start screen sharing
      try {
        console.log('[ScreenShare] Requesting screen share...')
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        })

        console.log('[ScreenShare] Got stream:', stream.id)
        screenStreamRef.current = stream
        setScreenStream(stream)
        isScreenSharingRef.current = true
        setIsScreenSharing(true)

        const screenTrack = stream.getVideoTracks()[0]
        console.log('[ScreenShare] Track label:', screenTrack.label)

        // Handle user stopping share via browser UI
        screenTrack.onended = () => {
          console.log('[ScreenShare] User stopped sharing via browser UI')
          stopScreenShare()
        }

        // Add screen track to all peer connections and renegotiate
        const peers = Object.entries(peersRef.current)
        console.log('[ScreenShare] Adding track to', peers.length, 'peers')

        for (const [peerId, pc] of peers) {
          try {
            pc.addTrack(screenTrack, stream)
            console.log('[ScreenShare] Added track to peer:', peerId)

            // Renegotiate with this peer
            makingOfferRef.current[peerId] = true
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            sendSignal({
              from: userId,
              to: peerId,
              type: 'offer',
              sdp: pc.localDescription.sdp,
              room: callRoomRef.current
            })
            console.log('[ScreenShare] Sent renegotiation offer to:', peerId)
            makingOfferRef.current[peerId] = false
          } catch (e) {
            console.error('[ScreenShare] Failed to add track to peer:', peerId, e)
            makingOfferRef.current[peerId] = false
          }
        }

        sendSignal({ from: userId, to: '*', type: 'screen-state', sharing: true, room: callRoomRef.current })
        console.log('[ScreenShare] Broadcast screen-state: sharing=true')
      } catch (e) {
        console.warn('[ScreenShare] Cancelled or failed:', e)
      }
    } else {
      stopScreenShare()
    }
  }, [userId, sendSignal])

  const stopScreenShare = useCallback(() => {
    if (!screenStreamRef.current) return

    const screenTrack = screenStreamRef.current.getVideoTracks()[0]

    // Remove screen track from all peer connections
    Object.entries(peersRef.current).forEach(([peerId, pc]) => {
      const sender = pc.getSenders().find(s => s.track === screenTrack)
      if (sender) {
        pc.removeTrack(sender)
          // Renegotiate
          ; (async () => {
            makingOfferRef.current[peerId] = true
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            sendSignal({ from: userId, to: peerId, type: 'offer', sdp: pc.localDescription.sdp, room: callRoomRef.current })
            makingOfferRef.current[peerId] = false
          })()
      }
    })

    screenStreamRef.current.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    setScreenStream(null)
    isScreenSharingRef.current = false
    setIsScreenSharing(false)

    sendSignal({ from: userId, to: '*', type: 'screen-state', sharing: false, room: callRoomRef.current })
  }, [userId, sendSignal])

  useEffect(() => () => {
    activeRef.current = false
    Object.values(peersRef.current).forEach(pc => pc?.close())
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop())
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop())
  }, [])

  return {
    callState, callPeers, isMuted, isCamOff, isScreenSharing, speakingUsers, incomingCall,
    remoteStreams, remoteScreenStreams, localStream, screenStream, selectedDevices,
    joinCall, callPerson, acceptCall, declineCall, leaveCall,
    toggleMute, toggleCamera, toggleScreenShare, changeDevices, callRoom: callRoomRef.current,
  }
}
