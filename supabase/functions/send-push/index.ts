// Supabase Edge Function: send-push
// Deploy this to your Supabase project: supabase functions deploy send-push

// You need to set these environment variables in your Supabase project:
// - VAPID_PRIVATE_KEY (from https://vapidkeys.com/)
// - VAPID_PUBLIC_KEY
// - VAPID_EMAIL (your email)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webPush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { targetUserId, notification } = await req.json()

        if (!targetUserId || !notification) {
            return new Response(
                JSON.stringify({ error: 'Missing targetUserId or notification' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get push subscription for target user
        const { data: subscription, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', targetUserId)
            .single()

        if (error || !subscription) {
            return new Response(
                JSON.stringify({ error: 'User has no push subscription', details: error }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Configure web-push
        webPush.setVapidDetails(
            `mailto:${Deno.env.get('VAPID_EMAIL')}`,
            Deno.env.get('VAPID_PUBLIC_KEY')!,
            Deno.env.get('VAPID_PRIVATE_KEY')!
        )

        // Build push subscription object
        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
            }
        }

        // Send push notification
        const result = await webPush.sendNotification(
            pushSubscription,
            JSON.stringify(notification)
        )

        return new Response(
            JSON.stringify({ success: true, result }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Push notification error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
