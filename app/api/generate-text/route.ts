import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  let postId: string = '';
  let platform: string = '';
  let userId: string = '';

  try {
    const body = await request.json();
    postId = body.postId;
    platform = body.platform;
    userId = body.userId;

    console.log('📝 generate-text appelé:', { postId, platform, userId });

    if (!postId || !platform || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Vérifier les tokens
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('usage_text, plan_name')
      .eq('user_id', userId)
      .maybeSingle();

    const planLimits: Record<string, number> = {
      starter: 30,
      pro: 100,
      business: 500
    };
    const planName = subscription?.plan_name || 'starter';
    const limit = planLimits[planName] || 30;
    const currentUsage = subscription?.usage_text || 0;

    if (currentUsage >= limit) {
      return NextResponse.json({ 
        error: 'Crédits épuisés', 
        message: `Vous avez utilisé ${currentUsage}/${limit} générations.`,
        remaining: 0
      }, { status: 402 });
    }

    // Récupérer le post
    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Récupérer la config entreprise
    const { data: config } = await supabaseAdmin
      .from('company_config')
      .select('company_name, brand_positioning, editorial_charter, communication_strategy')
      .eq('user_id', userId)
      .maybeSingle();

    // Récupérer les insights validés
    const { data: insights } = await supabaseAdmin
      .from('competitive_insights')
      .select('insight')
      .eq('user_id', userId)
      .eq('status', 'validated')
      .limit(5);

    const insightsText = insights && insights.length > 0 
      ? `\n\nInspiré par l'analyse concurrentielle:\n${insights.slice(0, 3).map((i: any) => `- ${i.insight.substring(0, 150)}`).join('\n')}`
      : '';

    // Configuration spécifique par plateforme
    const platformConfig: Record<string, { name: string; maxLength: number; tone: string; structure: string; emojis: boolean }> = {
      linkedin: { 
        name: 'LinkedIn', 
        maxLength: 1800, 
        tone: 'professionnel, expert, valeur ajoutée',
        structure: '▶️ Accroche puissante qui interpelle\n\n➡️ Développement structuré avec 3-4 points clés\n\n✅ Conclusion avec appel à l\'action',
        emojis: true
      },
      instagram: { 
        name: 'Instagram', 
        maxLength: 2000, 
        tone: 'inspirant, visuel, storytelling',
        structure: '🎯 Accroche émotionnelle\n\n📖 Histoire ou conseil détaillé\n\n💬 Question pour engager + hashtags',
        emojis: true
      },
      facebook: { 
        name: 'Facebook', 
        maxLength: 1800, 
        tone: 'conversationnel, engageant, accessible',
        structure: '💡 Lancement du sujet\n\n📝 Développement informel\n\n🗣️ Appel aux commentaires',
        emojis: true
      },
      twitter: { 
        name: 'Twitter', 
        maxLength: 400, 
        tone: 'concis, impactant, percutant',
        structure: '⚡ Accroche forte\n\n💎 Message clé\n\n🔗 Lien ou hashtag',
        emojis: true
      }
    };

    const plat = platformConfig[platform] || platformConfig.linkedin;

    // Construction du prompt détaillé
    const prompt = `Tu es un expert en rédaction marketing pour ${plat.name}.

**POST À RÉDIGER:**
- Titre: "${post.title}"
- Accroche: "${post.hook}"
- Appel à l'action: "${post.cta}"
- Type de contenu: ${post.content_type || 'marketing'}

**IDENTITÉ DE LA MARQUE:**
- Entreprise: ${config?.company_name || 'Notre entreprise'}
- Positionnement: ${config?.brand_positioning || 'Expert du secteur'}
- Ton éditorial: ${config?.editorial_charter || 'Professionnel et accessible'}

**CONSIGNES SPÉCIFIQUES:**
- Longueur: entre 250 et ${plat.maxLength} caractères
- Ton: ${plat.tone}
- Structure recommandée: ${plat.structure}
- Utilisation des émojis: ${plat.emojis ? 'Oui, avec parcimonie' : 'Non'}
${insightsText}

**EXIGENCES QUALITÉ:**
1. Accroche puissante dans les 2 premières lignes
2. Au moins 3 paragraphes distincts
3. Des exemples concrets ou des chiffres
4. Une valeur ajoutée claire pour le lecteur
5. Une transition naturelle vers le CTA

**IMPORTANT:** 
- Retourne UNIQUEMENT le texte du post
- Ne mets pas de guillemets autour du texte
- N'inclus pas le titre dans le post

Rédige maintenant le post:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un rédacteur marketing professionnel. Tu produis des textes engageants, bien structurés et adaptés à chaque plateforme. Tu utilises des émojis avec parcimonie et pertinence.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.85,
      max_tokens: plat.maxLength,
    });

    let content = completion.choices[0].message.content || '';
    
    // Nettoyage
    content = content
      .replace(/^["']|["']$/g, '')
      .replace(/^Poste?:|^Post:|^Texte:|^Rédaction:/i, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Ajout d'un hashtag pertinent si absent
    if (platform !== 'linkedin' && !content.includes('#') && content.length > 50) {
      const companyTag = config?.company_name?.replace(/\s/g, '') || 'Strategie';
      const hashtags = `\n\n#Marketing #${companyTag} #Innovation`;
      content += hashtags;
    }

    // Sauvegarder
    const fieldName = `text_${platform}`;
    
    await supabaseAdmin
      .from('post_skeleton')
      .update({ 
        [fieldName]: content, 
        status_text: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    // Incrémenter le compteur
    await supabaseAdmin
      .from('subscriptions')
      .update({ usage_text: currentUsage + 1 })
      .eq('user_id', userId);

    console.log(`✅ Texte généré pour ${platform}: ${content.length} caractères`);

    return NextResponse.json({ 
      success: true, 
      content, 
      platform: platform,
      remaining: limit - (currentUsage + 1),
      length: content.length
    });

  } catch (error: any) {
    console.error('❌ Erreur generate-text:', error);
    
    // Fallback: générer un texte plus simple
    try {
      // Récupérer le post pour le fallback
      const { data: fallbackPost } = await supabaseAdmin
        .from('post_skeleton')
        .select('hook, title, cta')
        .eq('id', postId)
        .single();
      
      const fallbackContent = `${fallbackPost?.hook || 'Découvrez notre expertise'}\n\n${fallbackPost?.title || 'Une opportunité pour votre entreprise'}\n\nContactez-nous pour en savoir plus.\n\n${fallbackPost?.cta || 'Réservez votre consultation'}`;
      
      return NextResponse.json({ 
        success: true, 
        content: fallbackContent, 
        platform: platform,
        fallback: true
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: error.message || 'Erreur lors de la génération' },
        { status: 500 }
      );
    }
  }
}