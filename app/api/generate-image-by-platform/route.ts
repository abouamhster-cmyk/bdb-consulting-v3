import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  console.log('🖼️ API generate-image-by-platform appelée');

  try {
    const body = await request.json();
    const { postId, platform, userId } = body;

    console.log('📥 Paramètres reçus:', { postId, platform, userId });

    // Vérification des paramètres
    if (!postId || !platform || !userId) {
      console.error('❌ Paramètres manquants');
      return NextResponse.json(
        { error: 'Données manquantes', details: { postId, platform, userId } },
        { status: 400 }
      );
    }

    // Vérification de l'utilisateur
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !user) {
      console.error('❌ Utilisateur non trouvé:', userId);
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }
    console.log('✅ Utilisateur trouvé:', user.user?.email);

    // Récupération du post
    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('id, title, hook, cta, content_type')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('❌ Post non trouvé:', postId);
      return NextResponse.json(
        { error: 'Post non trouvé' },
        { status: 404 }
      );
    }
    console.log('✅ Post trouvé:', post.title);

    // Récupération du prompt spécifique à la plateforme
    const { data: postData } = await supabaseAdmin
      .from('post_skeleton')
      .select('image_prompt_linkedin, image_prompt_instagram, image_prompt_facebook, image_prompt_twitter')
      .eq('id', postId)
      .single();

    let imagePrompt = '';
    
    // Récupérer le prompt correspondant à la plateforme
    switch (platform) {
      case 'linkedin':
        imagePrompt = postData?.image_prompt_linkedin || '';
        break;
      case 'instagram':
        imagePrompt = postData?.image_prompt_instagram || '';
        break;
      case 'facebook':
        imagePrompt = postData?.image_prompt_facebook || '';
        break;
      case 'twitter':
        imagePrompt = postData?.image_prompt_twitter || '';
        break;
      default:
        imagePrompt = '';
    }

    // Si pas de prompt personnalisé, utiliser un prompt par défaut
    if (!imagePrompt) {
      imagePrompt = `Image professionnelle pour post ${platform} intitulé: ${post.title}. Style moderne et épuré, adapté aux réseaux sociaux. Format carré 1024x1024. Qualité HD.`;
    }

    console.log('🎨 Prompt utilisé:', imagePrompt.substring(0, 100) + '...');

    // Vérification des crédits
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('usage_image, plan_name')
      .eq('user_id', userId)
      .maybeSingle();

    const planLimits: Record<string, number> = { 
      starter: 0, 
      pro: 50, 
      business: 200 
    };
    const planName = subscription?.plan_name || 'starter';
    const limit = planLimits[planName] || 0;
    const currentUsage = subscription?.usage_image || 0;

    console.log(`📊 Plan: ${planName}, Utilisation: ${currentUsage}/${limit}`);

    if (limit === 0) {
      return NextResponse.json(
        { error: 'Fonctionnalité non disponible. Passez au plan Pro ou Business.' },
        { status: 402 }
      );
    }

    if (currentUsage >= limit) {
      return NextResponse.json(
        { error: `Crédits images épuisés (${currentUsage}/${limit}). Passez au plan supérieur.` },
        { status: 402 }
      );
    }

    // Génération de l'image
    let imageUrl = '';
    let usedFallback = false;

    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OPENAI_API_KEY non configurée, utilisation fallback');
      imageUrl = `https://picsum.photos/seed/${postId}-${platform}/1024/1024`;
      usedFallback = true;
    } else {
      console.log('🤖 Appel DALL-E 3 pour générer l\'image...');
      
      try {
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          style: 'vivid',
        });
        
        if (response?.data?.[0]?.url) {
          imageUrl = response.data[0].url;
          console.log('✅ Image générée avec succès');
        } else {
          console.warn('⚠️ Aucune image générée par DALL-E, utilisation fallback');
          imageUrl = `https://picsum.photos/seed/${postId}-${platform}/1024/1024`;
          usedFallback = true;
        }
      } catch (openaiError: any) {
        console.error('❌ Erreur OpenAI:', openaiError.message);
        imageUrl = `https://picsum.photos/seed/${postId}-${platform}/1024/1024`;
        usedFallback = true;
      }
    }

    // Incrémentation du compteur d'utilisation
    await supabaseAdmin
      .from('subscriptions')
      .update({ usage_image: currentUsage + 1 })
      .eq('user_id', userId);

    // Sauvegarde de l'URL dans le post
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    updateData[`image_url_${platform}`] = imageUrl;
    updateData[`status_image_${platform}`] = 'completed';

    await supabaseAdmin
      .from('post_skeleton')
      .update(updateData)
      .eq('id', postId);

    console.log(`✅ Image sauvegardée pour ${platform}`);

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      remaining: limit - (currentUsage + 1),
      fallback: usedFallback
    });

  } catch (error: any) {
    console.error('❌ Erreur generate-image-by-platform:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de l\'image' },
      { status: 500 }
    );
  }
}
