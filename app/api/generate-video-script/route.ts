import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  let postId: string = '';
  let userId: string = '';

  try {
    const body = await request.json();
    postId = body.postId;
    userId = body.userId;

    if (!postId || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    console.log('🎬 Génération script vidéo pour post:', postId);

    // Récupérer le post complet
    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('title, hook, cta, content_type, text_linkedin, text_instagram, text_facebook, text_twitter')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post non trouvé' }, { status: 404 });
    }

    // Prendre le premier texte disponible
    const textContent = post.text_linkedin || post.text_instagram || post.text_facebook || post.text_twitter || `${post.hook} ${post.title}`;

    // Générer un script vidéo
    const prompt = `Génère un script vidéo court (30-45 secondes) pour un post marketing.

CONTEXTE:
- Titre: "${post.title}"
- Hook: "${post.hook}"
- CTA: "${post.cta}"
- Type de contenu: ${post.content_type}
- Message principal: "${textContent.substring(0, 500)}"

Le script doit être structuré comme suit:
[VISUEL: description de ce qui se passe à l'écran]
Voix off: "texte à dire"
[TRANSITION: description]
Voix off: "suite du message"

Retourne UNIQUEMENT le script, sans commentaires supplémentaires.`;

    let script = '';

    if (!process.env.OPENAI_API_KEY) {
      script = `[VISUEL: Image d'ouverture accrocheuse]\nVoix off: ${post.hook}\n\n[VISUEL: Animation ou démonstration]\nVoix off: ${post.title}\n\n[VISUEL: Call to action]\nVoix off: ${post.cta}`;
      console.log('⚠️ Mode fallback - script générique');
    } else {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un expert en création de scripts vidéo. Génère uniquement le script, rien d\'autre.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500,
      });
      script = completion.choices[0].message.content || `Script vidéo pour: ${post.title}`;
    }

    // Sauvegarder le script
    await supabaseAdmin
      .from('post_skeleton')
      .update({ 
        video_script: script,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    return NextResponse.json({ success: true, script });

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}