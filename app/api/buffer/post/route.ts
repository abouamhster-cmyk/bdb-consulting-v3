import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, platform, userId, scheduledDate } = body;

    if (!postId || !platform || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Récupérer le token Buffer de l'utilisateur et son profile_id
    const { data: account, error: accountError } = await supabaseAdmin
      .from('buffer_accounts')
      .select('access_token, profile_id')
      .eq('user_id', userId)
      .eq('profile_service', platform)
      .eq('is_active', true)
      .maybeSingle();

    if (accountError || !account) {
      return NextResponse.json({ 
        error: `Compte ${platform} non connecté. Veuillez d'abord configurer votre token Buffer dans Paramètres → Intégrations.` 
      }, { status: 400 });
    }

    if (!account.access_token) {
      return NextResponse.json({ 
        error: 'Token Buffer manquant. Veuillez reconnecter votre compte Buffer.' 
      }, { status: 400 });
    }

    const accessToken = account.access_token;

    // Récupérer le post
    const { data: post } = await supabaseAdmin
      .from('post_skeleton')
      .select('*')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Récupérer le texte
    const textField = `text_${platform}`;
    let content = post[textField] || `${post.hook}\n\n${post.title}\n\n${post.cta}`;

    // Récupérer l'image
    const imageField = `image_url_${platform}`;
    const imageUrl = post[imageField];

    // Mutation GraphQL
    const mutation = `
      mutation CreatePost($input: PostInput!) {
        createPost(input: $input) {
          id
          text
          status
          scheduledAt
        }
      }
    `;

    const variables: any = {
      input: {
        text: content,
        channelIds: [account.profile_id]
      }
    };

    if (scheduledDate) {
      variables.input.scheduledAt = scheduledDate;
    }

    if (imageUrl) {
      variables.input.media = [{ url: imageUrl, type: "photo" }];
    }

    const bufferResponse = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const bufferData = await bufferResponse.json();

    if (bufferData.errors) {
      return NextResponse.json({ error: bufferData.errors[0].message }, { status: 400 });
    }

    const bufferPost = bufferData.data?.createPost;

    await supabaseAdmin
      .from('post_skeleton')
      .update({ 
        status_scheduled: 'completed',
        scheduled_at: scheduledDate,
        buffer_update_id: bufferPost.id
      })
      .eq('id', postId);

    return NextResponse.json({ 
      success: true, 
      bufferId: bufferPost.id,
      message: `Post programmé sur ${platform}`
    });

  } catch (error: any) {
    console.error('Erreur Buffer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}