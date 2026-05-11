import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type pour les champs dynamiques
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

    // Récupérer les données du post
    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('title, hook, cta, content_type')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Récupérer le texte spécifique à la plateforme
    const textField = `text_${platform}`;
    const { data: textData } = await supabaseAdmin
      .from('post_skeleton')
      .select(textField)
      .eq('id', postId)
      .single() as { data: PostWithTextField | null };

    // Valeur par défaut si pas de texte trouvé
    const platformText = (textData && textData[textField]) 
      ? String(textData[textField]) 
      : `${post.hook} ${post.title}`;

    // Récupérer la config entreprise
    const { data: config } = await supabaseAdmin
      .from('company_config')
      .select('company_name, graphic_charter, brand_positioning')
      .eq('user_id', userId)
      .maybeSingle();

    // Configuration visuelle par plateforme
    const platformVisuals: Record<string, { style: string; vibe: string }> = {
      linkedin: { style: 'Professionnel, corporate, minimaliste', vibe: 'Sérieux et crédible' },
      instagram: { style: 'Coloré, esthétique, storytelling visuel', vibe: 'Inspirant et engageant' },
      facebook: { style: 'Chaleureux, communautaire, authentique', vibe: 'Proche et accessible' },
      twitter: { style: 'Dynamique, moderne, percutant', vibe: 'Direct et viral' }
    };

    const visual = platformVisuals[platform] || platformVisuals.linkedin;

    const promptText = `Génère un prompt pour DALL-E afin de créer une image pour un post ${platform}.

CONTEXTE DU POST:
- Réseau: ${platform}
- Titre: "${post.title}"
- Message: "${platformText.substring(0, 400)}"
- Call to action: "${post.cta}"

IDENTITÉ DE LA MARQUE:
- Entreprise: ${config?.company_name || 'BDB Consulting'}
- Positionnement: ${config?.brand_positioning || 'Premium et innovant'}

STYLE VISUEL ATTENDU:
- Style: ${visual.style}
- Vibe: ${visual.vibe}
- Couleurs: ${config?.graphic_charter || 'Bleu et blanc, tons professionnels'}

Génère UNIQUEMENT le prompt pour DALL-E, en français, descriptif (100-200 mots).`;

    let imagePrompt = '';

    if (!process.env.OPENAI_API_KEY) {
      imagePrompt = `Image pour post ${platform}: ${post.title}. Style ${visual.style}. Ambiance ${visual.vibe}. Format carré.`;
      console.log('⚠️ Mode fallback - prompt générique');
    } else {
      console.log('🤖 Appel OpenAI pour générer le prompt...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: "Tu es un expert en création de prompts pour DALL-E. Génère un prompt détaillé en français." },
          { role: 'user', content: promptText }
        ],
        temperature: 0.8,
        max_tokens: 300,
      });
      imagePrompt = completion.choices[0].message.content || `Image pour post ${platform}: ${post.title}`;
      console.log('✅ Prompt généré');
    }

    // Sauvegarder le prompt spécifique à la plateforme
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
    return NextResponse.json({ error: error.message || 'Erreur lors de la génération' }, { status: 500 });
  }
}