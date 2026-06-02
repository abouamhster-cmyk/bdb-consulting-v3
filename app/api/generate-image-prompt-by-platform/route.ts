import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type PostWithTextField = {
  title: string;
  hook: string;
  cta: string;
  content_type: string;
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

    console.log(`🎨 Génération prompt image pour ${platform}, post:`, postId);

    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('title, hook, cta, content_type')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    const textField = `text_${platform}`;

    const { data: textData } = await supabaseAdmin
      .from('post_skeleton')
      .select(textField)
      .eq('id', postId)
      .single() as { data: PostWithTextField | null };

    const platformText = textData && textData[textField]
      ? String(textData[textField])
      : `${post.hook} ${post.title}`;

    const { data: config } = await supabaseAdmin
      .from('company_config')
      .select('company_name, graphic_charter, brand_positioning, logo_url')
      .eq('user_id', userId)
      .maybeSingle();

    const platformVisuals: Record<string, { style: string; vibe: string }> = {
      linkedin: { style: 'Professionnel, corporate, minimaliste', vibe: 'Sérieux et crédible' },
      instagram: { style: 'Coloré, esthétique, storytelling visuel', vibe: 'Inspirant et engageant' },
      facebook: { style: 'Chaleureux, communautaire, authentique', vibe: 'Proche et accessible' },
      twitter: { style: 'Dynamique, moderne, percutant', vibe: 'Direct et viral' }
    };

    const visual = platformVisuals[platform] || platformVisuals.linkedin;

    const promptText = `Génère un prompt pour créer une image professionnelle pour un post ${platform}.

CONTEXTE DU POST:
- Réseau: ${platform}
- Titre: "${post.title}"
- Message: "${platformText.substring(0, 400)}"
- Call to action: "${post.cta}"

IDENTITÉ DE LA MARQUE:
- Entreprise: ${config?.company_name || 'BDB Consulting'}
- Positionnement: ${config?.brand_positioning || 'Premium et innovant'}
- Couleurs / charte graphique: ${config?.graphic_charter || 'Bleu et blanc, tons professionnels'}
- Logo disponible en base: ${config?.logo_url ? 'oui' : 'non'}

STYLE VISUEL ATTENDU:
- Style: ${visual.style}
- Vibe: ${visual.vibe}
- Image marketing propre, crédible et professionnelle
- Composition moderne, agréable et adaptée aux réseaux sociaux
- Format carré 1024x1024

RÈGLES STRICTES À RESPECTER:
- Ne jamais afficher de logo dans l'image générée.
- Ne jamais inventer un logo.
- Ne jamais dessiner le logo de l'entreprise.
- Ne jamais créer un faux symbole de marque.
- Ne jamais mettre le nom de l'entreprise sous forme de texte dans l'image.
- Ne jamais afficher de texte lisible.
- Laisser volontairement un espace propre en bas à droite pour que l'application ajoute ensuite le vrai logo depuis la base de données.
- L'image doit être utilisable même sans texte intégré.

Génère UNIQUEMENT le prompt final pour l'image, en français, descriptif, entre 100 et 200 mots.`;

    let imagePrompt = '';

    if (!process.env.OPENAI_API_KEY) {
      imagePrompt = `Image professionnelle pour post ${platform}: ${post.title}. Style ${visual.style}. Ambiance ${visual.vibe}. Couleurs: ${config?.graphic_charter || 'bleu et blanc professionnel'}. Ne pas afficher de logo, ne pas afficher de texte lisible, laisser un espace propre en bas à droite pour ajouter le vrai logo ensuite. Format carré 1024x1024.`;
      console.log('⚠️ Mode fallback - prompt générique');
    } else {
      console.log('🤖 Appel OpenAI pour générer le prompt...');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en création de prompts pour images marketing.
Tu dois générer uniquement le prompt final.
Tu dois absolument interdire la génération de logo, de faux logo, de texte lisible ou de nom d'entreprise dans l'image.`
          },
          { role: 'user', content: promptText }
        ],
        temperature: 0.7,
        max_tokens: 350,
      });

      imagePrompt = completion.choices[0].message.content || `Image pour post ${platform}: ${post.title}`;
      console.log('✅ Prompt généré');
    }

    imagePrompt = `${imagePrompt}

RÈGLES FINALES OBLIGATOIRES:
Ne pas afficher de logo.
Ne pas inventer de logo.
Ne pas afficher de texte lisible.
Ne pas écrire le nom de l'entreprise dans l'image.
Laisser un espace propre en bas à droite pour ajouter le vrai logo ensuite.`;

    const imagePromptField = `image_prompt_${platform}`;

    await supabaseAdmin
      .from('post_skeleton')
      .update({
        [imagePromptField]: imagePrompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    return NextResponse.json({ success: true, imagePrompt });

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération' },
      { status: 500 }
    );
  }
}
