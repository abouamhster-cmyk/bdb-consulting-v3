import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const accountId = searchParams.get('accountId');
  const accountName = searchParams.get('accountName');

  // Récupérer l'utilisateur depuis la session
  const { data: { user } } = await supabaseAdmin.auth.getUser();

  if (user && platform && accountId) {
    await supabaseAdmin
      .from('late_accounts')
      .upsert({
        user_id: user.id,
        platform: platform,
        account_id: accountId,
        account_name: accountName,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform'
      });
  }

  return NextResponse.redirect(new URL('/settings/social?success=true', request.url));
}