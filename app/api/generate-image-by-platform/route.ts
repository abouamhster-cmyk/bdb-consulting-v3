import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getPlanLimit = (planName: string): number => {
  switch (planName) {
    case 'pro': return 50;
    case 'business': return 200;
    default: return 0;
  }
};

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { postId, platform, userId } = body;

    console.log('🔵 API image appelée', { postId, platform, userId });
    console.log('⏱️ Étape 1: Paramètres reçus');

    if (!postId || !platform || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Récupérer le post
    console.log('⏱️ Étape 2: Récupération du post...');
    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('❌ Post non trouvé:', postError);
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }
    console.log('✅ Post trouvé:', post.title);
    console.log('⏱️ Étape 3: Post récupéré');

    // Récupérer le prompt
    const promptField = `image_prompt_${platform}`;
    let imagePrompt = post[promptField];
    console.log(`⏱️ Étape 4: Prompt field = ${promptField}, existe = ${!!imagePrompt}`);

    if (!imagePrompt) {
      imagePrompt = `Professional image for: ${post.title}. Modern, clean, professional style. Square format 1024x1024.`;
      console.log('⚠️ Utilisation du prompt par défaut');
    }
    console.log('📝 Prompt:', imagePrompt.substring(0, 100) + '...');

    // Vérifier les crédits
    console.log('⏱️ Étape 5: Vérification des crédits...');
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('usage_image, plan_name')
      .eq('user_id', userId)
      .maybeSingle();

    const planName = subscription?.plan_name || 'starter';
    const limit = getPlanLimit(planName);
    const currentUsage = subscription?.usage_image || 0;

    console.log(`📊 Plan: ${planName}, Limite: ${limit}, Utilisation: ${currentUsage}`);
    console.log('⏱️ Étape 6: Crédits vérifiés');

    if (limit === 0) {
      return NextResponse.json({ error: 'Fonctionnalité non disponible. Passez au plan Pro ou Business.' }, { status: 402 });
    }

    if (currentUsage >= limit) {
      return NextResponse.json({ error: `Crédits images épuisés (${currentUsage}/${limit})` }, { status: 402 });
    }

    // Génération de l'image
    console.log('⏱️ Étape 7: Appel à OpenAI...');
    let imageUrl = '';
    let usedFallback = false;

    try {
      console.log('🎨 Tentative avec gpt-image-1...');
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
      });
      console.log('📦 Réponse OpenAI reçue');

      if (response.data?.[0]?.url) {
        imageUrl = response.data[0].url;
        console.log('✅ Image générée avec succès');
      } else {
        throw new Error('Pas d\'URL dans la réponse');
      }
    } catch (openaiError: any) {
      console.error('❌ Erreur OpenAI (1er essai):', openaiError.message);
      
      try {
        console.log('🔄 Tentative avec gpt-image-1-mini...');
        const response = await openai.images.generate({
          model: 'gpt-image-1-mini',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
        });
        
        if (response.data?.[0]?.url) {
          imageUrl = response.data[0].url;
          console.log('✅ Image générée avec gpt-image-1-mini');
        } else {
          throw new Error('Pas d\'URL');
        }
      } catch (secondError: any) {
        console.error('❌ Échec second essai:', secondError.message);
        imageUrl = `https://picsum.photos/seed/${postId}-${platform}-${Date.now()}/1024/1024`;
        usedFallback = true;
      }
    }

    console.log('⏱️ Étape 8: Mise à jour des crédits...');
    if (!usedFallback) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ usage_image: currentUsage + 1 })
        .eq('user_id', userId);
    }

    console.log('⏱️ Étape 9: Sauvegarde de l\'image...');
    const updateData: Record<string, string> = {
      [`image_url_${platform}`]: imageUrl,
      [`status_image_${platform}`]: 'completed',
      updated_at: new Date().toISOString()
    };

    await supabaseAdmin
      .from('post_skeleton')
      .update(updateData)
      .eq('id', postId);

    const duration = Date.now() - startTime;
    console.log(`✅ Image sauvegardée pour ${platform} (durée: ${duration}ms)`);

    return NextResponse.json({ success: true, imageUrl, fallback: usedFallback });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erreur générale après ${duration}ms:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
