import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { postId, userId } = await request.json();

    if (!postId || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    console.log('🎨 Génération prompt image pour post:', postId);

    // Récupérer le post complet
    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('title, hook, cta, content_type, text_linkedin, text_instagram, text_facebook, text_twitter')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('Post non trouvé:', postError);
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Récupérer la config entreprise
    const { data: config } = await supabaseAdmin
      .from('company_config')
      .select('company_name, graphic_charter, brand_positioning')
      .eq('user_id', userId)
      .maybeSingle();

    // Prendre le premier texte disponible pour le contexte
    const textContent = post.text_linkedin || post.text_instagram || post.text_facebook || post.text_twitter || `${post.hook} ${post.title}`;

    // Construire un prompt détaillé pour DALL-E
    const prompt = `Génère un prompt pour DALL-E afin de créer une image professionnelle pour un post marketing.

CONTEXTE DU POST:
- Titre: "${post.title}"
- Hook: "${post.hook}"
- CTA: "${post.cta}"
- Type de contenu: ${post.content_type}
- Message principal: "${textContent.substring(0, 500)}"

IDENTITÉ DE LA MARQUE:
- Entreprise: ${config?.company_name || 'BDB Consulting'}
- Positionnement: ${config?.brand_positioning || 'Premium et innovant'}
- Style graphique: ${config?.graphic_charter || 'Moderne, épuré, professionnel'}

Génère UNIQUEMENT le prompt pour DALL-E (en français, descriptif, 100-200 mots) qui permettra de créer une image illustrant parfaitement ce post marketing.

Le prompt doit être clair, précis et inclure:
- Le sujet principal
- Le style visuel à adopter
- Les couleurs dominantes
- L'ambiance générale
- Le format (carré 1024x1024)`;

    let imagePrompt = '';

    if (!process.env.OPENAI_API_KEY) {
      // Mode fallback sans OpenAI
      imagePrompt = `Image professionnelle illustrant: ${post.title}. Style moderne et épuré, tons professionnels ${config?.graphic_charter || 'modernes'}, ambiance positive et inspirante. Format carré 1024x1024.`;
      console.log('⚠️ Mode fallback - prompt générique');
    } else {
      console.log('🤖 Appel OpenAI pour générer le prompt image...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert en création de prompts pour DALL-E. Génère un prompt détaillé et descriptif en français, uniquement le prompt, rien d\'autre.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 400,
      });
      
      // Vérification que completion.choices existe
      if (completion.choices && completion.choices.length > 0 && completion.choices[0].message.content) {
        imagePrompt = completion.choices[0].message.content;
        console.log('✅ Prompt image généré par IA');
      } else {
        console.error('❌ Aucune réponse d\'OpenAI');
        imagePrompt = `Image pour illustrer un post sur: ${post.title}`;
      }
    }

    // Sauvegarder le prompt dans le post
    const { error: updateError } = await supabaseAdmin
      .from('post_skeleton')
      .update({ 
        image_prompt: imagePrompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (updateError) {
      console.error('Erreur sauvegarde prompt:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    console.log('✅ Prompt image sauvegardé avec succès');

    return NextResponse.json({ 
      success: true, 
      imagePrompt,
      message: 'Prompt image généré avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur generate-image-prompt:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du prompt' },
      { status: 500 }
    );
  }
}