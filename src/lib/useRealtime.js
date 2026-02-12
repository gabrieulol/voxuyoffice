import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'
import { timeNow } from './constants'

// ═══════════════════════════════════════════
// useRealtime — Multiplayer sync via Supabase
// Uses Presence for position/status + Broadcast for chat/reactions
// ═══════════════════════════════════════════

export function useRealtime(userId, profile) {
  const [peers, setPeers] = useState({})       // { oderId: { x, y, status, name, emoji, ... } }
  const [messages, setMessages] = useState([])  // chat messages
  const [reactions, setReactions] = useState({}) // { oderId: emoji }
  const channelRef = useRef(null)
  const presenceRef = useRef(null)

  // Initialize channel
  useEffect(() => {
    if (!userId || !profile) {
      console.log('[Realtime] Skipping init - userId:', userId, 'profile:', !!profile)
      return
    }

    console.log('[Realtime] Initializing channel for user:', userId)

    const channel = supabase.channel('stone-hq-office', {
      config: { presence: { key: userId } },
    })

    // ─── PRESENCE (position, status, avatar) ───
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      console.log('[Realtime] Presence sync - raw state keys:', Object.keys(state))
      const newPeers = {}
      Object.entries(state).forEach(([key, presences]) => {
        if (key === userId) return // skip self
        // Get the most recent presence (last in array)
        const p = presences[presences.length - 1]
        if (p) {
          console.log('[Realtime] Adding peer:', key, p.display_name, 'at', p.x, p.y)
          newPeers[key] = p
        }
      })
      console.log('[Realtime] Peers found after sync:', Object.keys(newPeers).length, Object.keys(newPeers))
      setPeers(newPeers)
    })

    // Handle individual peer joins (more reliable than sync alone)
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (key === userId) return // skip self
      const p = newPresences[newPresences.length - 1]
      if (p) {
        console.log('[Realtime] Peer joined:', key, p.display_name, 'at', p.x, p.y)
        setPeers(prev => ({ ...prev, [key]: p }))
      }
    })

    // Handle individual peer leaves
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (key === userId) return
      console.log('[Realtime] Peer left:', key)
      // Only remove if no presences left for this key
      const state = channel.presenceState()
      if (!state[key] || state[key].length === 0) {
        setPeers(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }
    })

    // ─── BROADCAST: Chat messages ───
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      console.log('[Realtime] Received chat from:', payload.senderName)
      if (payload.userId === userId) return // skip own (already added locally)
      setMessages(prev => [...prev.slice(-200), {
        text: payload.text,
        isMe: false,
        sender: payload.senderName,
        time: payload.time,
        channel: payload.channel,
        userId: payload.userId,
      }])
    })

    // ─── BROADCAST: Reactions ───
    channel.on('broadcast', { event: 'reaction' }, ({ payload }) => {
      setReactions(prev => ({ ...prev, [payload.userId]: payload.emoji }))
      setTimeout(() => {
        setReactions(prev => {
          const n = { ...prev }
          delete n[payload.userId]
          return n
        })
      }, 3000)
    })

    // Subscribe
    channel.subscribe(async (status, err) => {
      console.log('[Realtime] Channel status:', status, err ? `Error: ${err.message}` : '')
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Tracking presence for:', profile.display_name, 'at', profile.x, profile.y)
        try {
          await channel.track({
            x: profile.x,
            y: profile.y,
            status: profile.status || 'available',
            display_name: profile.display_name || 'Anônimo',
            emoji: profile.emoji || '😊',
            avatar_url: profile.avatar_url || null,
            role: profile.role || '',
            team: profile.team || '',
            activity: profile.activity || 'Online',
            avatar_idx: profile.avatar_idx ?? 0,
          })
          console.log('[Realtime] Presence tracked successfully')
        } catch (trackErr) {
          console.error('[Realtime] Failed to track presence:', trackErr)
        }
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel error:', err)
      } else if (status === 'TIMED_OUT') {
        console.error('[Realtime] Channel timed out')
      }
    })

    channelRef.current = channel
    presenceRef.current = channel

    // Load recent messages from DB
    supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          const msgs = data.reverse().map(m => ({
            text: m.text,
            isMe: m.user_id === userId,
            sender: m.sender_name,
            time: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            channel: m.channel,
            userId: m.user_id,
          }))
          setMessages(msgs)
        }
      })

    return () => {
      console.log('[Realtime] Unsubscribing from channel')
      channel.unsubscribe()
    }
  }, [userId, profile?.display_name]) // only reinit on user change

  // Update presence (position, status, etc)
  const updatePresence = useCallback((data) => {
    if (channelRef.current) {
      console.log('[Realtime] Updating presence:', data.x, data.y, data.display_name)
      channelRef.current.track(data)
    } else {
      console.warn('[Realtime] Cannot update presence - channel not ready')
    }
  }, [])

  // Send chat message (broadcast + persist)
  const sendMessage = useCallback((text, channel = 'geral') => {
    if (!channelRef.current || !userId) return

    const msg = {
      text,
      channel,
      userId,
      senderName: profile?.display_name || 'Anônimo',
      time: timeNow(),
    }

    // Add locally immediately
    setMessages(prev => [...prev.slice(-200), {
      text: msg.text,
      isMe: true,
      sender: 'Você',
      time: msg.time,
      channel: msg.channel,
      userId,
    }])

    // Broadcast to others
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: msg,
    })

    // Persist to DB
    supabase.from('messages').insert({
      user_id: userId,
      sender_name: msg.senderName,
      channel: msg.channel,
      text: msg.text,
    }).then(() => {})

  }, [userId, profile?.display_name])

  // Send reaction (broadcast only, no persist)
  const sendReaction = useCallback((emoji) => {
    if (!channelRef.current || !userId) return

    // Add locally
    setReactions(prev => ({ ...prev, [userId]: emoji }))
    setTimeout(() => {
      setReactions(prev => { const n = { ...prev }; delete n[userId]; return n })
    }, 3000)

    // Broadcast
    channelRef.current.send({
      type: 'broadcast',
      event: 'reaction',
      payload: { userId, emoji },
    })
  }, [userId])

  return { peers, messages, reactions, updatePresence, sendMessage, sendReaction }
}
