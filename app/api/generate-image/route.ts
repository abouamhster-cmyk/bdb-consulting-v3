import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  let postId: string = '';
  let userId: string = '';
  let userPrompt: string = '';

  try {
    const body = await request.json();
    postId = body.postId;
    userId = body.userId;
    userPrompt = body.prompt;

    if (!postId || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    console.log('🖼️ Génération image pour post:', postId);

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

    // Récupérer le post complet
    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('title, hook, cta, content_type, text_linkedin, text_instagram')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Récupérer la config entreprise
    const { data: config } = await supabaseAdmin
      .from('company_config')
      .select('company_name, graphic_charter, brand_positioning')
      .eq('user_id', userId)
      .maybeSingle();

    // Récupérer le texte généré pour le contexte
    const postText = post?.text_linkedin || post?.text_instagram || `${post?.hook} ${post?.title}`;

    // Utiliser le prompt personnalisé ou en générer un
    const finalPrompt = userPrompt || `Crée une image professionnelle de haute qualité pour illustrer ce post marketing:

CONTEXTE:
- Message: "${postText?.substring(0, 300)}"
- Titre: "${post?.title}"
- Call to action: "${post?.cta}"
- Entreprise: ${config?.company_name || 'BDB Consulting'}

STYLE VISUEL:
- Style: Photographie professionnelle ou illustration moderne de haute qualité
- Ambiance: Professionnelle, inspirante, positive
- Couleurs: ${config?.graphic_charter || 'Bleu et blanc, tons professionnels'}
- Format: Carré 1024x1024
- Qualité: Haute résolution, 4K

CONSIGNES IMPORTANTES:
- Image réaliste et professionnelle
- Ne pas inclure de texte sur l'image
- Éviter les éléments trop génériques
- Rendre l'image mémorable et impactante
- Style cohérent avec la charte graphique de l'entreprise

Génère une image unique et créative qui attirera l'attention sur les réseaux sociaux.`;

    let imageUrl = '';
    let generatedPrompt = finalPrompt;

    if (!process.env.OPENAI_API_KEY) {
      // Fallback sans OpenAI
      imageUrl = `https://picsum.photos/seed/${postId}/1024/1024`;
      console.log('⚠️ Mode fallback - image placeholder');
    } else {
      console.log('🤖 Appel DALL-E 3 pour générer l\'image...');
      
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: finalPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
      });
      
      // Vérification sécurisée de la réponse
      if (response && response.data && response.data.length > 0 && response.data[0].url) {
        imageUrl = response.data[0].url;
        console.log('✅ Image générée avec succès');
      } else {
        console.error('❌ Aucune image générée par DALL-E');
        imageUrl = `https://picsum.photos/seed/${postId}/1024/1024`;
        generatedPrompt = finalPrompt + ' (Version fallback)';
      }
    }

    // Incrémenter le compteur
    await supabaseAdmin
      .from('subscriptions')
      .update({ usage_image: currentUsage + 1 })
      .eq('user_id', userId);

    // Mettre à jour le post
    await supabaseAdmin
      .from('post_skeleton')
      .update({ 
        image_url: imageUrl,
        image_prompt: generatedPrompt,
        status_image: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    console.log(`✅ Image sauvegardée - Nouveau total: ${currentUsage + 1}/${limit}`);

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      remaining: limit - (currentUsage + 1),
      message: 'Image générée avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur generate-image:', error);
    
    // Fallback en cas d'erreur
    try {
      const fallbackUrl = `https://picsum.photos/seed/${postId}/1024/1024`;
      return NextResponse.json({ 
        success: true, 
        imageUrl: fallbackUrl,
        fallback: true,
        message: 'Image générée (mode secours)'
      });
    } catch {
      return NextResponse.json(
        { error: error.message || 'Erreur lors de la génération' },
        { status: 500 }
      );
    }
  }
}