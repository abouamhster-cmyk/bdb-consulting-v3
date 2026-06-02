import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Définir les limites par plan
const getPlanLimit = (planName: string): number => {
  switch (planName) {
    case 'pro':
      return 50;
    case 'business':
      return 200;
    default:
      return 0;
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, platform, userId } = body;

    console.log('🔵 API image appelée', { postId, platform, userId });

    if (!postId || !platform || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
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

    // Récupérer le prompt
    const promptField = `image_prompt_${platform}`;
    let imagePrompt = post[promptField];

    if (!imagePrompt) {
      imagePrompt = `Professional image for: ${post.title}. Modern, clean, professional style. Square format 1024x1024.`;
      console.log('⚠️ Utilisation du prompt par défaut');
    }

    // Vérifier les crédits
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('usage_image, plan_name')
      .eq('user_id', userId)
      .maybeSingle();

    const planName = subscription?.plan_name || 'starter';
    const limit = getPlanLimit(planName);
    const currentUsage = subscription?.usage_image || 0;

    console.log(`📊 Plan: ${planName}, Utilisation: ${currentUsage}/${limit}`);

    if (limit === 0) {
      return NextResponse.json({ 
        error: 'Fonctionnalité non disponible. Passez au plan Pro ou Business.' 
      }, { status: 402 });
    }

    if (currentUsage >= limit) {
      return NextResponse.json({ 
        error: `Crédits images épuisés (${currentUsage}/${limit}). Passez au plan supérieur.` 
      }, { status: 402 });
    }

    let imageUrl = '';
    let usedFallback = false;

    try {
      console.log('🎨 Génération avec gpt-image-1...');
      
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
      });

      if (response.data?.[0]?.url) {
        imageUrl = response.data[0].url;
        console.log('✅ Image générée avec succès');
      } else {
        throw new Error('Pas d\'URL dans la réponse');
      }
    } catch (openaiError: any) {
      console.error('❌ Erreur OpenAI:', openaiError.message);
      
      // Tentative avec gpt-image-1-mini
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
        console.error('❌ Échec des deux modèles, utilisation fallback');
        imageUrl = `https://picsum.photos/seed/${postId}-${platform}-${Date.now()}/1024/1024`;
        usedFallback = true;
      }
    }

    // Incrémenter le compteur seulement si DALL-E a fonctionné
    if (!usedFallback) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ usage_image: currentUsage + 1 })
        .eq('user_id', userId);
    }

    // Sauvegarder l'URL
    const updateData: Record<string, string> = {
      [`image_url_${platform}`]: imageUrl,
      [`status_image_${platform}`]: 'completed',
      updated_at: new Date().toISOString()
    };

    await supabaseAdmin
      .from('post_skeleton')
      .update(updateData)
      .eq('id', postId);

    console.log(`✅ Image sauvegardée pour ${platform}`);

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      fallback: usedFallback
    });

  } catch (error: any) {
    console.error('❌ Erreur générale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
