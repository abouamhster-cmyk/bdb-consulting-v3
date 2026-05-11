import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 });
  }

  const accessToken = process.env.BUFFER_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({ error: 'Buffer non configuré' }, { status: 500 });
  }

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
    console.log('Organization ID:', organizationId);

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

    // Sauvegarder les profils
    let savedCount = 0;
    for (const channel of channels) {
      const { error } = await supabaseAdmin
        .from('buffer_accounts')
        .upsert({
          user_id: userId,
          profile_id: channel.id,
          profile_name: channel.name,
          profile_service: channel.service,
          organization_id: organizationId,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,profile_id'
        });

      if (!error) {
        savedCount++;
      }
    }

    console.log(`${savedCount} canaux sauvegardés pour user ${userId}`);

    return NextResponse.json({ 
      success: true, 
      profiles: channels,
      count: savedCount,
      message: `${savedCount} réseaux sociaux connectés avec succès`
    });

  } catch (error) {
    console.error('Erreur Buffer:', error);
    return NextResponse.json({ error: 'Erreur Buffer' }, { status: 500 });
  }
}