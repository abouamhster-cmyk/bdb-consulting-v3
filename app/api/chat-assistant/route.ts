import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { postId, currentContent, type, userMessage, conversation } = await request.json();

    // Récupérer le contexte du post
    const { data: post } = await supabaseAdmin
      .from('post_skeleton')
      .select('title, hook, cta, content_type')
      .eq('id', postId)
      .single();

    const prompt = `Tu es un assistant expert en marketing et rédaction.

CONTEXTE DU POST:
- Titre: "${post?.title}"
- Accroche: "${post?.hook}"
- CTA: "${post?.cta}"
- Type: ${post?.content_type}

CONTENU ACTUEL (${type}): 
${currentContent || 'Pas encore généré'}

HISTORIQUE DE LA CONVERSATION:
${conversation.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join('\n')}

NOUVEAU MESSAGE UTILISATEUR: ${userMessage}

INSTRUCTIONS:
1. Réponds de manière utile et précise à l'utilisateur
2. Propose des améliorations concrètes si demandé
3. Si l'utilisateur demande une modification, retourne le contenu modifié
4. Sois professionnel mais amical

Retourne UNIQUEMENT un JSON:
{
  "reply": "ta réponse à l'utilisateur",
  "suggestedContent": "contenu modifié (optionnel)"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"reply": "Je peux vous aider à améliorer ce contenu."}');

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ 
      reply: "Désolé, une erreur s'est produite. Veuillez réessayer.",
      suggestedContent: null
    });
  }
}