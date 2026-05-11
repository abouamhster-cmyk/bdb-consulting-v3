import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { userId, teamId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non spécifié' }, { status: 400 });
    }

    console.log('=== DÉBUT API GÉNÉRATION SKELETON ===');
    console.log('userId:', userId);
    console.log('teamId:', teamId);

    // 🔥 RÉCUPÉRATION DE LA CONFIG (avec team_id si fourni)
    let query = supabaseAdmin
      .from('company_config')
      .select('*')
      .eq('user_id', userId);

    // Si teamId est fourni, on filtre aussi par équipe
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data: configs, error: configError } = await query;

    if (configError) {
      console.error('Erreur config:', configError);
    }

    console.log(`📦 ${configs?.length || 0} configuration(s) trouvée(s)`);

    // Prendre la première config (ou créer des valeurs par défaut)
    let companyName = 'BDB Consulting';
    let positioning = 'Agence marketing digitale spécialisée dans l\'accompagnement des PME et startups. Partenaire stratégique premium alliant expertise technique et innovation.';
    let persona = 'Chef d\'entreprise de 35-50 ans, dirigeant de PME ou startup, cherchant à digitaliser son marketing.';
    let editorialCharter = 'Ton professionnel, inspirant et accessible. Valeurs: Transparence, innovation, résultats.';
    let communicationStrategy = 'Objectif: Générer des leads qualifiés. Canaux prioritaires: LinkedIn (60%), Newsletter (20%), Instagram (20%).';

    if (configs && configs.length > 0) {
      const config = configs[0];
      companyName = config.company_name || companyName;
      positioning = config.brand_positioning || positioning;
      persona = config.persona || persona;
      editorialCharter = config.editorial_charter || editorialCharter;
      communicationStrategy = config.communication_strategy || communicationStrategy;
      
      console.log('✅ CONFIG UTILISÉE:');
      console.log('   - company_name:', companyName);
      console.log('   - brand_positioning:', positioning.substring(0, 80) + '...');
      console.log('   - persona:', persona.substring(0, 80) + '...');
    } else {
      console.log('⚠️ Aucune config trouvée, utilisation valeurs par défaut');
    }

    // 🔥 RÉCUPÉRATION DES PARAMÈTRES DE CAMPAGNE
    let paramsQuery = supabaseAdmin
      .from('generation_params')
      .select('posts_count, brand_tone, objectives, selected_platforms, start_date, end_date')
      .eq('user_id', userId);

    if (teamId) {
      paramsQuery = paramsQuery.eq('team_id', teamId);
    }

    const { data: paramsList } = await paramsQuery;

    const postsCount = (paramsList && paramsList[0]?.posts_count) || 30;
    const brandTone = (paramsList && paramsList[0]?.brand_tone) || 'professionnel';
    const objectives = (paramsList && paramsList[0]?.objectives) || 'Augmenter la visibilité et générer des leads qualifiés';
    const platforms = (paramsList && paramsList[0]?.selected_platforms) || ['linkedin', 'instagram', 'facebook', 'twitter'];
    const startDate = (paramsList && paramsList[0]?.start_date) ? new Date(paramsList[0].start_date) : new Date();

    // 🔥 RÉCUPÉRATION DES INSIGHTS VALIDÉS
    let insightsQuery = supabaseAdmin
      .from('competitive_insights')
      .select('insight, category')
      .eq('user_id', userId)
      .eq('status', 'validated')
      .limit(15);

    if (teamId) {
      insightsQuery = insightsQuery.eq('team_id', teamId);
    }

    const { data: insights } = await insightsQuery;

    const insightsCount = insights?.length || 0;
    const insightsText = insightsCount > 0 
      ? `\n🎯 INSIGHTS CONCURRENTIELS VALIDÉS (à intégrer dans les posts):\n${insights!.map(i => `   - ${i.insight}`).join('\n')}`
      : '';

    console.log(`💡 ${insightsCount} insights validés intégrés`);

    // 🔥 CONSTRUCTION DU PROMPT
    const prompt = `Tu es un expert en stratégie de contenu marketing.

Génère un planning éditorial de ${postsCount} posts pour ${companyName}.

**1. IDENTITÉ DE L'ENTREPRISE:**
- Nom: ${companyName}
- Positionnement: ${positioning}
- Persona cible: ${persona}
- Charte éditoriale: ${editorialCharter}
- Stratégie de communication: ${communicationStrategy}

**2. PARAMÈTRES DE LA CAMPAGNE:**
- Nombre de posts: ${postsCount}
- Ton: ${brandTone}
- Objectifs: ${objectives}
- Plateformes cibles: ${platforms.join(', ')}
- Période: À partir du ${startDate.toLocaleDateString('fr-FR')}
${insightsText}

**3. FORMAT DE RÉPONSE (JSON UNIQUEMENT, sans backticks):**
[
  {
    "day": 1,
    "title": "titre accrocheur (max 60 caractères)",
    "hook": "accroche qui attire l'attention (max 120 caractères)",
    "cta": "appel à l'action engageant (max 80 caractères)",
    "content_type": "éducatif|storytelling|promotionnel|inspirationnel|témoignage"
  }
]

Génère ${postsCount} posts de qualité, variés et adaptés à ${companyName} et à son persona.`;

    console.log('🤖 Appel OpenAI...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es un expert en marketing de contenu. Tu réponds UNIQUEMENT en JSON pur, sans backticks, sans markdown, sans texte avant ou après.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
    });

    let content = completion.choices[0].message.content || '';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let calendar = [];
    try {
      const parsed = JSON.parse(content);
      calendar = Array.isArray(parsed) ? parsed : parsed.posts || parsed.calendar || [];
      console.log(`✅ ${calendar.length} posts générés par IA`);
    } catch (e) {
      console.error('Erreur parsing:', e);
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        calendar = JSON.parse(jsonMatch[0]);
        console.log(`✅ ${calendar.length} posts extraits par regex`);
      }
    }

    if (calendar.length === 0) {
      throw new Error('Aucun post valide généré');
    }

    // 🔥 AJOUTER LES DATES
    calendar = calendar.map((post: any, index: number) => {
      const postDate = new Date(startDate);
      postDate.setDate(startDate.getDate() + index);
      return {
        ...post,
        day: index + 1,
        date: postDate.toISOString().split('T')[0],
        event_name: null
      };
    });

    // 🔥 SUPPRIMER LES ANCIENS POSTS
    let deleteQuery = supabaseAdmin
      .from('post_skeleton')
      .delete()
      .eq('user_id', userId);

    if (teamId) {
      deleteQuery = deleteQuery.eq('team_id', teamId);
    }

    await deleteQuery;

    // 🔥 INSÉRER LES NOUVEAUX POSTS
    let savedCount = 0;
    for (const post of calendar.slice(0, postsCount)) {
      const insertData: any = {
        user_id: userId,
        day: post.day,
        date: post.date,
        title: post.title,
        hook: post.hook,
        cta: post.cta,
        content_type: post.content_type,
        event_name: post.event_name || null,
        status_skeleton: 'pending',
        status_text: 'pending',
        status_image: 'pending',
        status_video: 'pending',
        status_scheduled: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (teamId) {
        insertData.team_id = teamId;
      }

      const { error } = await supabaseAdmin
        .from('post_skeleton')
        .insert(insertData);

      if (!error) savedCount++;
    }

    console.log(`✅ ${savedCount}/${calendar.length} posts sauvegardés pour ${companyName}`);

    return NextResponse.json({ 
      success: true, 
      calendar, 
      count: savedCount,
      company: companyName
    });

  } catch (error: any) {
    console.error('❌ ERREUR:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération' },
      { status: 500 }
    );
  }
}