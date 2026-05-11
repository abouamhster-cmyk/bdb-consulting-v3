import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 });
  }

  // Récupérer le token Buffer de l'utilisateur
  const { data: userBuffer, error: tokenError } = await supabaseAdmin
    .from('buffer_accounts')
    .select('access_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (tokenError || !userBuffer?.access_token) {
    return NextResponse.json({ 
      error: 'Token Buffer non configuré. Veuillez d\'abord connecter votre compte Buffer.' 
    }, { status: 400 });
  }

  const accessToken = userBuffer.access_token;

  try {
    // 1. Récupérer l'account et ses organizations
    const accountQuery = `
      query {
        account {
          id
          name
          organizations {
            id
            name
          }
        }
      }
    `;

    const accountResponse = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: accountQuery })
    });

    const accountResult = await accountResponse.json();

    if (accountResult.errors) {
      console.error('Erreur account:', accountResult.errors);
      return NextResponse.json({ error: accountResult.errors[0].message }, { status: 400 });
    }

    const organizations = accountResult.data?.account?.organizations || [];
    
    if (organizations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        profiles: [], 
        message: 'Aucune organisation trouvée' 
      });
    }

    const organizationId = organizations[0].id;

    // 2. Récupérer les canaux pour cette organisation
    const channelsQuery = `
      query {
        channels(input: { organizationId: "${organizationId}" }) {
          id
          name
          service
        }
      }
    `;

    const channelsResponse = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: channelsQuery })
    });

    const channelsResult = await channelsResponse.json();

    if (channelsResult.errors) {
      console.error('Erreur channels:', channelsResult.errors);
      return NextResponse.json({ error: channelsResult.errors[0].message }, { status: 400 });
    }

    const channels = channelsResult.data?.channels || [];

    // Mettre à jour les profils avec le token
    for (const channel of channels) {
      await supabaseAdmin
        .from('buffer_accounts')
        .upsert({
          user_id: userId,
          profile_id: channel.id,
          profile_name: channel.name,
          profile_service: channel.service,
          organization_id: organizationId,
          access_token: accessToken,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,profile_id'
        });
    }

    return NextResponse.json({ 
      success: true, 
      profiles: channels,
      count: channels.length
    });

  } catch (error) {
    console.error('Erreur Buffer:', error);
    return NextResponse.json({ error: 'Erreur Buffer' }, { status: 500 });
  }
}