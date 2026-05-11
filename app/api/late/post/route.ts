import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { late } from '@/lib/late';

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

    console.log(`📅 Programmation sur ${platform}, post:`, postId);

    // 1. Récupérer le post
    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // 2. Récupérer le texte spécifique à la plateforme
    const textField = `text_${platform}`;
    const content = post[textField] || `${post.hook}\n\n${post.title}\n\n${post.cta}`;

    // 3. Récupérer l'image spécifique à la plateforme
    const imageField = `image_url_${platform}`;
    const imageUrl = post[imageField] || null;

    // 4. Récupérer le compte Late correspondant à la plateforme
    const { data: account, error: accountError } = await supabaseAdmin
      .from('late_accounts')
      .select('account_id')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('is_active', true)
      .maybeSingle();

    if (accountError || !account) {
      return NextResponse.json({ 
        error: `Compte ${platform} non connecté. Veuillez d'abord connecter votre compte dans Paramètres > Réseaux sociaux.` 
      }, { status: 400 });
    }

    // 5. Créer le post dans Late API
    const result = await late.createPost({
      content: content,
      platforms: [{ 
        platform: platform as 'linkedin' | 'instagram' | 'facebook' | 'twitter', 
        accountId: account.account_id 
      }],
      scheduledFor: scheduledDate || new Date().toISOString(),
      media: imageUrl ? [imageUrl] : undefined
    });

    if (!result || !result.id) {
      throw new Error('Erreur lors de la création du post dans Late API');
    }

    // 6. Mettre à jour le statut dans notre base
    await supabaseAdmin
      .from('post_skeleton')
      .update({ 
        status_scheduled: 'completed',
        scheduled_at: scheduledDate,
        late_post_id: result.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    console.log(`✅ Post programmé sur ${platform} avec Late API, ID: ${result.id}`);

    return NextResponse.json({ 
      success: true, 
      lateId: result.id,
      message: `Post programmé sur ${platform}`
    });

  } catch (error: any) {
    console.error('❌ Erreur Late API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la programmation' },
      { status: 500 }
    );
  }
}