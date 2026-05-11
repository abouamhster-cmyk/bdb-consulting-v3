import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase-admin';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, title, body, url } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const { data: subscription } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json({ message: 'Aucun abonnement push' });
    }

    await webpush.sendNotification(
      subscription.subscription,
      JSON.stringify({ title, body, url: url || '/dashboard' })
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erreur push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}