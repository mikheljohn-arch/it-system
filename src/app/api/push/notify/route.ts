import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const { title, body } = await req.json()
  const supabase = createClient()

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription')

  if (!subs) return NextResponse.json({ success: false })

  await Promise.all(
    subs.map(({ subscription }) =>
      webpush.sendNotification(subscription, JSON.stringify({ title, body, url: '/dashboard' }))
        .catch(() => {})
    )
  )

  return NextResponse.json({ success: true })
}