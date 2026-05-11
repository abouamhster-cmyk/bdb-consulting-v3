import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  let postId: string = '';
  let platform: string = '';
  let userId: string = '';
  let scheduledDate: string = '';

  try {
    const body = await request.json();
    postId = body.postId;
    platform = body.platform;
    userId = body.userId;
    scheduledDate = body.scheduledDate;

    if (!postId || !platform || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Récupérer le compte Facebook
    const { data: account, error: accountError } = await supabaseAdmin
      .from('facebook_accounts')
      .select('page_id, access_token')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Compte Facebook non connecté' }, { status: 400 });
    }

    // Récupérer le post
    const { data: post } = await supabaseAdmin
      .from('post_skeleton')
      .select('*')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Préparer le contenu selon la plateforme
    let content = '';
    let imageUrl = null;

    if (platform === 'facebook') {
      content = post.text_facebook || `${post.hook}\n\n${post.title}\n\n${post.cta}`;
      imageUrl = post.image_url_facebook;
    } else if (platform === 'instagram') {
      content = post.text_instagram || `${post.hook}\n\n${post.title}\n\n${post.cta}`;
      imageUrl = post.image_url_instagram;
    }

    // Créer la publication
    let postResponse;
    
    if (imageUrl) {
      // Publication avec image
      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${account.page_id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          url: imageUrl,
          caption: content,
          access_token: account.access_token,
          published: scheduledDate ? 'false' : 'true'
        }).toString()
      });
      postResponse = await mediaResponse.json();
    } else {
      // Publication texte uniquement
      const feedResponse = await fetch(`https://graph.facebook.com/v18.0/${account.page_id}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          message: content,
          access_token: account.access_token,
          published: scheduledDate ? 'false' : 'true'
        }).toString()
      });
      postResponse = await feedResponse.json();
    }

    if (postResponse.error) {
      throw new Error(postResponse.error.message || 'Erreur publication');
    }

    // Programmation différée (si date fournie)
    if (scheduledDate && postResponse.id) {
      const scheduledTimestamp = Math.floor(new Date(scheduledDate).getTime() / 1000);
      await fetch(`https://graph.facebook.com/v18.0/${postResponse.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          scheduled_publish_time: scheduledTimestamp.toString(),
          access_token: account.access_token
        }).toString()
      });
    }

    // Mettre à jour le statut
    await supabaseAdmin
      .from('post_skeleton')
      .update({ 
        status_scheduled: 'completed',
        scheduled_at: scheduledDate,
        facebook_post_id: postResponse.id
      })
      .eq('id', postId);

    return NextResponse.json({ success: true, facebookId: postResponse.id });

  } catch (error: any) {
    console.error('Erreur Facebook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}