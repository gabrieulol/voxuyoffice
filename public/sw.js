// Service Worker for Push Notifications
// This runs in the background even when the app is closed

const CACHE_NAME = 'voxuy-office-v1'

// Install event
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...')
    self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...')
    event.waitUntil(clients.claim())
})

// Push event - triggered when a push notification is received
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event)

    let data = { title: 'Voxuy Office', body: 'Nova notificação' }

    if (event.data) {
        try {
            data = event.data.json()
        } catch (e) {
            data.body = event.data.text()
        }
    }

    const options = {
        body: data.body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: data.tag || 'voxuy-notification',
        requireInteraction: data.requireInteraction || false,
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
            callerId: data.callerId,
            roomId: data.roomId,
        },
        actions: data.actions || []
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event)
    event.notification.close()

    const data = event.notification.data || {}
    const urlToOpen = data.url || '/'

    // Handle action buttons
    if (event.action === 'accept') {
        // User clicked accept - open app and auto-accept call
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                // Try to focus existing window
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.postMessage({ type: 'ACCEPT_CALL', callerId: data.callerId, roomId: data.roomId })
                        return client.focus()
                    }
                }
                // Open new window if no existing window
                return clients.openWindow(urlToOpen + '?accept_call=' + data.roomId)
            })
        )
    } else if (event.action === 'decline') {
        // User clicked decline - just close notification
        return
    } else {
        // Default click - open app
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus()
                    }
                }
                return clients.openWindow(urlToOpen)
            })
        )
    }
})

// Message from main app
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data)

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})
