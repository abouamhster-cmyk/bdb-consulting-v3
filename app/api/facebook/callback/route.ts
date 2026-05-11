import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/settings/integrations?error=facebook_failed', request.url));
  }

  try {
    // Échanger le code contre un token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        code: code,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI!
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error?.message || 'Erreur authentification');
    }

    // Récupérer les pages Facebook
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`);
    const pagesData = await pagesResponse.json();

    // Récupérer l'utilisateur
    const { data: { user } } = await supabaseAdmin.auth.getUser();

    if (user && pagesData.data && pagesData.data.length > 0) {
      const page = pagesData.data[0];
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

      await supabaseAdmin
        .from('facebook_accounts')
        .upsert({
          user_id: user.id,
          account_id: page.id,
          account_name: page.name,
          page_id: page.id,
          page_name: page.name,
          access_token: page.access_token,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    }

    return NextResponse.redirect(new URL('/settings/integrations?success=facebook', request.url));

  } catch (error) {
    console.error('Erreur Facebook:', error);
    return NextResponse.redirect(new URL('/settings/integrations?error=facebook_failed', request.url));
  }
}