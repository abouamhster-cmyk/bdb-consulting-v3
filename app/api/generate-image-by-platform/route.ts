import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type PlanLimits = {
  starter: number;
  pro: number;
  business: number;
};

const planLimits: PlanLimits = {
  starter: 0,
  pro: 50,
  business: 200
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
      imagePrompt = `Image professionnelle pour illustrer ce post: ${post.title}. Style moderne, épuré, professionnel. Format carré.`;
      console.log('⚠️ Utilisation du prompt par défaut');
    }

    // Vérifier les crédits
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('usage_image, plan_name')
      .eq('user_id', userId)
      .maybeSingle();

    const planName = (subscription?.plan_name || 'starter') as keyof PlanLimits;
    const limit = planLimits[planName] || 0;
    const currentUsage = subscription?.usage_image || 0;

    if (limit === 0 || currentUsage >= limit) {
      return NextResponse.json({ 
        error: `Crédits images épuisés (${currentUsage}/${limit})` 
      }, { status: 402 });
    }

    // Appel à DALL-E 2 (plus stable et disponible sur tous les comptes)
    console.log('🤖 Appel à DALL-E 2...');
    let imageUrl = '';

    try {
      const response = await openai.images.generate({
        model: 'dall-e-2',        // ← Changé de dall-e-3 à dall-e-2
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
      });

      if (response.data?.[0]?.url) {
        imageUrl = response.data[0].url;
        console.log('✅ Image générée avec succès via DALL-E 2');
      } else {
        throw new Error('Pas d\'URL dans la réponse');
      }
    } catch (openaiError: any) {
      console.error('❌ Erreur OpenAI:', openaiError.message);
      if (openaiError.response?.data) {
        console.error('Détails:', JSON.stringify(openaiError.response.data, null, 2));
      }
      // Fallback: image placeholder
      imageUrl = `https://picsum.photos/seed/${postId}-${platform}-${Date.now()}/1024/1024`;
      console.log('⚠️ Fallback utilisé');
    }

    // Mettre à jour les crédits
    await supabaseAdmin
      .from('subscriptions')
      .update({ usage_image: currentUsage + 1 })
      .eq('user_id', userId);

    // Sauvegarder l'image
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

    return NextResponse.json({ success: true, imageUrl });

  } catch (error: any) {
    console.error('❌ Erreur générale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
