import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// ═══════════════════════════════════════════════════════════
// usePushNotifications — Web Push API for background notifications
// ═══════════════════════════════════════════════════════════

// VAPID public key - Generate yours at https://vapidkeys.com/
// You'll need to set the private key in your Supabase Edge Function
const VAPID_PUBLIC_KEY = 'BK2GYySvYUzC4J99R_A75DpZCf3q--jITPd4ienMZKeqzj4P0gzpCItnrzb06qNry9Fzns8alRlmjXT04s7bbPQ'

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function usePushNotifications(userId) {
    const [isSupported, setIsSupported] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscription, setSubscription] = useState(null)
    const [registration, setRegistration] = useState(null)

    // Check if push notifications are supported
    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window
        setIsSupported(supported)

        if (supported) {
            // Register service worker
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    console.log('[Push] Service worker registered')
                    setRegistration(reg)
                    return reg.pushManager.getSubscription()
                })
                .then(sub => {
                    if (sub) {
                        console.log('[Push] Already subscribed')
                        setSubscription(sub)
                        setIsSubscribed(true)
                    }
                })
                .catch(err => console.error('[Push] SW registration failed:', err))
        }
    }, [])

    // Subscribe to push notifications
    const subscribe = useCallback(async () => {
        if (!registration || !userId) return false

        try {
            // Request notification permission
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                console.log('[Push] Permission denied')
                return false
            }

            // Subscribe to push manager
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            })

            console.log('[Push] Subscribed:', sub)
            setSubscription(sub)
            setIsSubscribed(true)

            // Save subscription to database for this user
            const subJson = sub.toJSON()
            await supabase.from('push_subscriptions').upsert({
                user_id: userId,
                endpoint: subJson.endpoint,
                p256dh: subJson.keys.p256dh,
                auth: subJson.keys.auth,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })

            console.log('[Push] Subscription saved to database')
            return true
        } catch (err) {
            console.error('[Push] Subscribe failed:', err)
            return false
        }
    }, [registration, userId])

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        if (!subscription || !userId) return false

        try {
            await subscription.unsubscribe()
            setSubscription(null)
            setIsSubscribed(false)

            // Remove from database
            await supabase.from('push_subscriptions').delete().eq('user_id', userId)

            console.log('[Push] Unsubscribed')
            return true
        } catch (err) {
            console.error('[Push] Unsubscribe failed:', err)
            return false
        }
    }, [subscription, userId])

    // Send push notification to a specific user (via Edge Function)
    const sendPushToUser = useCallback(async (targetUserId, notification) => {
        try {
            const { data, error } = await supabase.functions.invoke('send-push', {
                body: {
                    targetUserId,
                    notification: {
                        title: notification.title || 'Voxuy Office',
                        body: notification.body,
                        tag: notification.tag || 'voxuy-notification',
                        requireInteraction: notification.requireInteraction || false,
                        url: notification.url || '/',
                        callerId: notification.callerId,
                        roomId: notification.roomId,
                        actions: notification.actions || []
                    }
                }
            })

            if (error) throw error
            return data
        } catch (err) {
            console.error('[Push] Send failed:', err)
            return null
        }
    }, [])

    return {
        isSupported,
        isSubscribed,
        subscribe,
        unsubscribe,
        sendPushToUser
    }
}
