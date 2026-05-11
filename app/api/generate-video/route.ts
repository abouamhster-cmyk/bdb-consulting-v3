import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  let postId: string = '';
  let userId: string = '';
  let script: string = '';

  try {
    const body = await request.json();
    postId = body.postId;
    userId = body.userId;
    script = body.script;

    if (!postId || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    console.log('🎬 Génération vidéo pour post:', postId);

    // Récupérer le post
    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('title, hook, video_script')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Utiliser le script fourni ou celui en base
    const finalScript = script || post.video_script || `${post.hook} ${post.title}`;

    // Vérifier les tokens vidéo
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('usage_video, plan_name')
      .eq('user_id', userId)
      .maybeSingle();

    const planLimits: Record<string, number> = { starter: 0, pro: 0, business: 50 };
    const planName = subscription?.plan_name || 'starter';
    const limit = planLimits[planName] || 0;
    const currentUsage = subscription?.usage_video || 0;

    if (limit === 0) {
      return NextResponse.json({ error: 'Fonctionnalité non disponible. Passez au plan Business.' }, { status: 402 });
    }

    if (currentUsage >= limit) {
      return NextResponse.json({ error: 'Crédits vidéos épuisés' }, { status: 402 });
    }

    // Générer une URL de vidéo (placeholder - sera remplacée par une vraie API vidéo)
    const videoUrl = `https://placehold.co/1280x720/1a237e/white?text=${encodeURIComponent(finalScript.substring(0, 50))}`;

    // Incrémenter le compteur
    await supabaseAdmin
      .from('subscriptions')
      .update({ usage_video: currentUsage + 1 })
      .eq('user_id', userId);

    // Mettre à jour le post
    await supabaseAdmin
      .from('post_skeleton')
      .update({ 
        video_url: videoUrl,
        video_script: finalScript,
        status_video: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    console.log(`✅ Vidéo générée - Nouveau total: ${currentUsage + 1}/${limit}`);

    return NextResponse.json({ 
      success: true, 
      videoUrl,
      script: finalScript,
      remaining: limit - (currentUsage + 1)
    });

  } catch (error: any) {
    console.error('❌ Erreur generate-video:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération' },
      { status: 500 }
    );
  }
}