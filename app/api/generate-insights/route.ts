import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { userId, sources, teamId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non spécifié' }, { status: 400 });
    }

    console.log('=== DÉBUT API GÉNÉRATION INSIGHTS ===');
    console.log('userId:', userId);
    console.log('teamId:', teamId);
    console.log('sources:', sources?.length || 0);

    // 🔥 1. RÉCUPÉRATION DE LA CONFIG ENTREPRISE (Setup)
    let configQuery = supabaseAdmin
      .from('company_config')
      .select('company_name, brand_positioning, persona, editorial_charter, communication_strategy')
      .eq('user_id', userId);

    if (teamId) {
      configQuery = configQuery.eq('team_id', teamId);
    }

    const { data: configs, error: configError } = await configQuery;

    if (configError) {
      console.error('Erreur config:', configError);
    }

    const config = configs && configs[0];
    
    const companyName = config?.company_name || 'BDB Consulting';
    const positioning = config?.brand_positioning || 'Agence marketing digitale premium';
    const persona = config?.persona || 'Directrice Marketing en startup SaaS';
    const editorialCharter = config?.editorial_charter || 'Ton professionnel et inspirant';
    const communicationStrategy = config?.communication_strategy || 'Devenir leader d\'opinion sur LinkedIn';

    console.log('✅ Setup chargé:', { companyName, positioning });

    // 🔥 2. RÉCUPÉRATION DES PARAMÈTRES DE CAMPAGNE (Params)
    let paramsQuery = supabaseAdmin
      .from('generation_params')
      .select('posts_count, brand_tone, objectives, selected_platforms, start_date, end_date')
      .eq('user_id', userId);

    if (teamId) {
      paramsQuery = paramsQuery.eq('team_id', teamId);
    }

    const { data: paramsList } = await paramsQuery;
    const params = paramsList && paramsList[0];

    const postsCount = params?.posts_count || 30;
    const brandTone = params?.brand_tone || 'professionnel';
    const objectives = params?.objectives || 'Augmenter la visibilité et générer des leads';
    const platforms = params?.selected_platforms || ['linkedin', 'instagram', 'facebook', 'twitter'];
    const startDate = params?.start_date ? new Date(params.start_date) : new Date();
    const endDate = params?.end_date ? new Date(params.end_date) : new Date();

    console.log('✅ Params chargés:', { postsCount, brandTone, objectives, platforms });

    // 🔥 3. FORMATER LES SOURCES CONCURRENTES
    const sourcesText = sources && sources.length > 0
      ? sources.map((s: any) => `- ${s.name} (${s.url})`).join('\n')
      : 'Aucun concurrent spécifique';

    // 🔥 4. CONSTRUCTION DU PROMPT AVEC TOUTES LES DONNÉES
    const prompt = `Tu es un expert en veille concurrentielle et stratégie marketing.

**1. CONTEXTE DE L'ENTREPRISE (Setup):**
- Nom: ${companyName}
- Positionnement: ${positioning}
- Persona cible: ${persona}
- Charte éditoriale: ${editorialCharter}
- Stratégie de communication: ${communicationStrategy}

**2. OBJECTIFS DE LA CAMPAGNE (Params):**
- Nombre de posts prévus: ${postsCount}
- Ton souhaité: ${brandTone}
- Objectifs marketing: ${objectives}
- Plateformes cibles: ${platforms.join(', ')}
- Période: Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}

**3. CONCURRENTS IDENTIFIÉS:**
${sourcesText}

**4. MISSIONS SPÉCIFIQUES:**

Génère 5 insights stratégiques APPROFONDIS qui doivent:

a) Analyser les forces/faiblesses des concurrents
b) Proposer des actions concrètes pour ${companyName}
c) Tenir compte des objectifs de campagne (${objectives})
d) Suggérer des types de contenu adaptés aux plateformes (${platforms.join(', ')})
e) Proposer un calendrier éditorial basé sur les insights (événements, dates clés)

**5. INSIGHTS SUR LES ÉVÉNEMENTS ET DATES CLÉS:**
- Identifie les périodes à forte concurrence
- Suggère les meilleurs moments pour publier
- Propose des événements sectoriels à exploiter
- Recommande un rythme de publication

**FORMAT DE RÉPONSE (JSON UNIQUEMENT, sans backticks):**
[
  {
    "insight": "Description détaillée (3-4 phrases) incluant analyse concurrentielle et recommandation",
    "category": "content|seo|engagement|offre|timing|format|events",
    "suggested_actions": ["Action spécifique 1", "Action spécifique 2", "Action spécifique 3"],
    "best_time": "Meilleur moment pour publier (ex: mardi 10h)",
    "event_date": "Date d'un événement clé à exploiter (optionnel)"
  }
]

**Categories:**
- timing: Meilleurs moments pour publier
- format: Types de contenu à privilégier
- content: Sujets et angles à exploiter
- seo: Mots-clés et référencement
- engagement: Techniques d'interaction
- offre: Positionnement produit
- events: Événements et dates clés

Sois TRÈS SPÉCIFIQUE et ACTIONNABLE.`;

    console.log('🤖 Appel à OpenAI avec toutes les données...');

    // Appel à l'API OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un expert en stratégie marketing et veille concurrentielle. Tu réponds UNIQUEMENT en JSON pur, sans backticks, sans markdown, sans texte avant ou après le JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
    });

    // Nettoyer la réponse
    let content = completion.choices[0].message.content || '';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('📝 Réponse reçue, parsing en cours...');

    // Parser la réponse JSON
    let insights = [];
    try {
      const parsed = JSON.parse(content);
      insights = Array.isArray(parsed) ? parsed : parsed.insights || [];
      console.log(`✅ ${insights.length} insights parsés avec succès`);
    } catch (parseError) {
      console.error('❌ Erreur de parsing JSON:', parseError);
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          insights = JSON.parse(jsonMatch[0]);
          console.log(`✅ ${insights.length} insights extraits via regex`);
        } catch (regexError) {
          console.error('❌ Échec également avec regex:', regexError);
        }
      }
    }

    // Sauvegarde des insights en base de données
    if (insights.length > 0) {
      // Supprimer les anciens insights en attente ou rejetés
      let deleteQuery = supabaseAdmin
        .from('competitive_insights')
        .delete()
        .eq('user_id', userId)
        .in('status', ['pending', 'rejected']);

      if (teamId) {
        deleteQuery = deleteQuery.eq('team_id', teamId);
      }
      await deleteQuery;

      // Insérer les nouveaux insights
      let savedCount = 0;
      for (const insight of insights) {
        const insertData: any = {
          user_id: userId,
          insight: insight.insight,
          category: insight.category || 'content',
          suggested_actions: insight.suggested_actions || [],
          status: 'pending',
          created_at: new Date().toISOString()
        };

        if (teamId) {
          insertData.team_id = teamId;
        }
        if (insight.best_time) {
          insertData.best_time = insight.best_time;
        }
        if (insight.event_date) {
          insertData.event_date = insight.event_date;
        }

        const { error: insertError } = await supabaseAdmin
          .from('competitive_insights')
          .insert(insertData);

        if (!insertError) {
          savedCount++;
        } else {
          console.error('❌ Erreur insertion insight:', insertError.message);
        }
      }
      console.log(`✅ ${savedCount}/${insights.length} insights sauvegardés en base`);
    } else {
      console.log('⚠️ Aucun insight à sauvegarder');
    }

    console.log('=== FIN API ===');

    return NextResponse.json({ 
      success: true, 
      insights, 
      count: insights.length 
    });

  } catch (error: any) {
    console.error('❌ ERREUR API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération des insights' },
      { status: 500 }
    );
  }
}