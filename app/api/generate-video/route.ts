import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VIDEO_BUCKET = 'generated-videos';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getPlanLimit = (planName: string): number => {
  switch (planName) {
    case 'business':
      return 50;
    default:
      return 0;
  }
};

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { postId, userId, script } = body;

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    console.log('🎬 Génération vidéo pour post:', postId);

    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('title, hook, video_script')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post non trouvé' },
        { status: 404 }
      );
    }

    const { data: companyConfig } = await supabaseAdmin
      .from('company_config')
      .select('company_name, graphic_charter, brand_positioning, logo_url')
      .eq('user_id', userId)
      .maybeSingle();

    const finalScript =
      script ||
      post.video_script ||
      `${post.hook || ''} ${post.title || ''}`;

    const cleanPrompt = `
Créer une vidéo marketing professionnelle pour les réseaux sociaux.

ENTREPRISE :
- Nom : ${companyConfig?.company_name || 'Entreprise'}
- Positionnement : ${companyConfig?.brand_positioning || 'Premium et professionnel'}
- Charte graphique : ${companyConfig?.graphic_charter || 'Style moderne, propre et professionnel'}
- Logo disponible dans l'application : ${companyConfig?.logo_url ? 'oui' : 'non'}

SUJET PRINCIPAL :
${post.title}

SCRIPT / IDÉE :
${finalScript}

STYLE VISUEL :
- vidéo business moderne
- visuel propre, premium et crédible
- mouvement fluide
- lumière professionnelle
- qualité cinéma
- composition claire
- ambiance professionnelle et inspirante
- format paysage 1280x720

RÈGLES STRICTES :
- Ne jamais inventer de logo.
- Ne jamais créer de symbole de marque.
- Ne jamais afficher un faux logo.
- Ne jamais afficher le logo de l'entreprise.
- Ne jamais afficher le nom de l'entreprise sous forme de texte dans la vidéo.
- Ne jamais afficher de texte lisible.
- Ne jamais afficher d'enseigne, panneau, badge, watermark ou marque fictive.
- Ne pas générer de visage réel identifiable.
- Prévoir une zone visuelle propre en bas à droite.
- Le vrai logo sera ajouté automatiquement par l'application après génération.
`;

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('usage_video, plan_name')
      .eq('user_id', userId)
      .maybeSingle();

    const planName = subscription?.plan_name || 'starter';
    const limit = getPlanLimit(planName);
    const currentUsage = subscription?.usage_video || 0;

    console.log(`📊 Plan: ${planName}, Limite: ${limit}, Utilisation: ${currentUsage}`);

    if (limit === 0) {
      return NextResponse.json(
        { error: 'Fonctionnalité non disponible. Passez au plan Business.' },
        { status: 402 }
      );
    }

    if (currentUsage >= limit) {
      return NextResponse.json(
        { error: 'Crédits vidéos épuisés' },
        { status: 402 }
      );
    }

    await supabaseAdmin
      .from('post_skeleton')
      .update({
        status_video: 'processing',
        video_script: finalScript,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    console.log('🚀 Création du job vidéo OpenAI...');

    let video = await openai.videos.create({
      model: 'sora-2',
      prompt: cleanPrompt,
      size: '1280x720',
      seconds: '15',
    });

    console.log('🟡 Job vidéo créé:', video.id, video.status);

    const maxAttempts = 60;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (video.status === 'completed') {
        break;
      }

      if (video.status === 'failed') {
        console.error('❌ Génération vidéo échouée:', video);
        throw new Error('La génération vidéo OpenAI a échoué.');
      }

      console.log(
        `⏳ Vidéo en cours... tentative ${attempt}/${maxAttempts}, statut: ${video.status}, progression: ${video.progress ?? 0}%`
      );

      await sleep(10000);

      video = await openai.videos.retrieve(video.id);
    }

    if (video.status !== 'completed') {
      throw new Error('La vidéo prend trop de temps à générer. Réessayez plus tard.');
    }

    console.log('✅ Vidéo générée, téléchargement du MP4...');

    const content = await openai.videos.downloadContent(video.id);
    const arrayBuffer = await content.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    const fileName = `videos/${userId}/${postId}-${Date.now()}.mp4`;

    console.log('☁️ Upload vers Supabase Storage...');

    const { error: uploadError } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Erreur upload Supabase:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .getPublicUrl(fileName);

    const videoUrl = publicUrlData.publicUrl;

    await supabaseAdmin
      .from('subscriptions')
      .update({ usage_video: currentUsage + 1 })
      .eq('user_id', userId);

    await supabaseAdmin
      .from('post_skeleton')
      .update({
        video_url: videoUrl,
        video_script: finalScript,
        status_video: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    const duration = Date.now() - startTime;

    console.log(`✅ Vidéo sauvegardée durée: ${duration}ms`);

    return NextResponse.json({
      success: true,
      videoUrl,
      script: finalScript,
      remaining: limit - (currentUsage + 1),
    });

  } catch (error: any) {
    console.error('❌ Erreur generate-video:', error);

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération vidéo' },
      { status: 500 }
    );
  }
}
