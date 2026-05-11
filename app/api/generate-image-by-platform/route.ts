import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type pour les champs dynamiques
type PostWithPromptField = {
  title: string;
  [key: string]: any;
};

export async function POST(request: Request) {
  let postId: string = '';
  let platform: string = '';
  let userId: string = '';

  try {
    const body = await request.json();
    postId = body.postId;
    platform = body.platform;
    userId = body.userId;

    if (!postId || !platform || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    console.log(`🖼️ Génération image pour ${platform}, post:`, postId);

    // Récupérer le titre du post
    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('title')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Récupérer le prompt spécifique à la plateforme
    const promptField = `image_prompt_${platform}`;
    const { data: promptData } = await supabaseAdmin
      .from('post_skeleton')
      .select(promptField)
      .eq('id', postId)
      .single() as { data: PostWithPromptField | null };

    const imagePrompt = (promptData && promptData[promptField]) 
      ? String(promptData[promptField]) 
      : `Image professionnelle pour post ${platform}: ${post.title}`;

    // Vérifier les tokens
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('usage_image, plan_name')
      .eq('user_id', userId)
      .maybeSingle();

    const planLimits: Record<string, number> = { starter: 0, pro: 50, business: 200 };
    const planName = subscription?.plan_name || 'starter';
    const limit = planLimits[planName] || 0;
    const currentUsage = subscription?.usage_image || 0;

    if (limit === 0) {
      return NextResponse.json({ error: 'Fonctionnalité non disponible' }, { status: 402 });
    }

    if (currentUsage >= limit) {
      return NextResponse.json({ error: 'Crédits images épuisés' }, { status: 402 });
    }

    let imageUrl = '';

    if (!process.env.OPENAI_API_KEY) {
      imageUrl = `https://picsum.photos/seed/${postId}-${platform}/1024/1024`;
      console.log('⚠️ Mode fallback - image placeholder');
    } else {
      console.log('🤖 Appel DALL-E 3 pour générer l\'image...');
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
      });
      
      // Vérification sécurisée
      if (response && response.data && response.data.length > 0 && response.data[0] && response.data[0].url) {
        imageUrl = response.data[0].url;
        console.log('✅ Image générée avec succès');
      } else {
        console.warn('⚠️ Aucune image générée, utilisation fallback');
        imageUrl = `https://picsum.photos/seed/${postId}-${platform}/1024/1024`;
      }
    }

    // Incrémenter le compteur
    await supabaseAdmin
      .from('subscriptions')
      .update({ usage_image: currentUsage + 1 })
      .eq('user_id', userId);

    // Sauvegarder l'URL spécifique à la plateforme
    const imageUrlField = `image_url_${platform}`;
    const statusField = `status_image_${platform}`;
    
    await supabaseAdmin
      .from('post_skeleton')
      .update({ 
        [imageUrlField]: imageUrl,
        [statusField]: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    console.log(`✅ Image sauvegardée pour ${platform}`);

    return NextResponse.json({ success: true, imageUrl });

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la génération' }, { status: 500 });
  }
}