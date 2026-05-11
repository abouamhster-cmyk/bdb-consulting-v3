import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { userId, isTest = false } = await request.json();

    // Récupérer les sources actives de l'utilisateur
    let query = supabaseAdmin
      .from('monitoring_sources')
      .select('*')
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: sources } = await query;

    if (!sources || sources.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'Aucune source à surveiller' });
    }

    const newItems = [];

    for (const source of sources) {
      try {
        // Analyser le contenu de la source
        const response = await fetch(source.url);
        const html = await response.text();

        // Extraction basique (à améliorer avec des parsers comme cheerio)
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : source.name;

        // Vérifier si c'est nouveau
        const { data: existing } = await supabaseAdmin
          .from('monitoring_history')
          .select('id')
          .eq('source_id', source.id)
          .eq('title', title)
          .maybeSingle();

        if (!existing) {
          // Sauvegarder le nouvel élément
          const { data: newItem } = await supabaseAdmin
            .from('monitoring_history')
            .insert({
              user_id: source.user_id,
              source_id: source.id,
              title: title,
              url: source.url,
              published_at: new Date().toISOString(),
              sent_at: null
            })
            .select()
            .single();

          newItems.push({ ...newItem, source_name: source.name });
        }
      } catch (error) {
        console.error(`Erreur sur ${source.url}:`, error);
      }
    }

    // Envoyer les notifications
    if (newItems.length > 0 && !isTest) {
      // Grouper par utilisateur
      const itemsByUser: Record<string, any[]> = {};
      for (const item of newItems) {
        if (!itemsByUser[item.user_id]) itemsByUser[item.user_id] = [];
        itemsByUser[item.user_id].push(item);
      }

      for (const [userId, items] of Object.entries(itemsByUser)) {
        // Envoyer email
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: await getUserEmail(userId),
            subject: `📢 Veille : ${items.length} nouvelle(s) information(s)`,
            htmlContent: generateEmailHtml(items)
          })
        });

        // Envoyer notification push si l'utilisateur est abonné
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            title: 'Nouvelle veille disponible',
            body: `${items.length} nouvelle(s) information(s) à découvrir`,
            url: '/monitoring/history'
          })
        });

        // Marquer comme envoyé
        for (const item of items) {
          await supabaseAdmin
            .from('monitoring_history')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', item.id);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: newItems.length,
      items: newItems 
    });

  } catch (error) {
    console.error('Erreur monitoring:', error);
    return NextResponse.json({ error: 'Erreur lors de la veille' }, { status: 500 });
  }
}

async function getUserEmail(userId: string): Promise<string> {
  const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
  return user?.user?.email || '';
}

function generateEmailHtml(items: any[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Veille BDB Consulting</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">🔍 Veille concurrentielle</h1>
        </div>
        <p>Bonjour,</p>
        <p>Voici les nouvelles informations détectées depuis votre dernière visite :</p>
        <ul>
          ${items.map(item => `
            <li style="margin-bottom: 15px;">
              <strong>${item.source_name}</strong><br/>
              <a href="${item.url}" style="color: #2563eb;">${item.title}</a>
            </li>
          `).join('')}
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/monitoring/history" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            Voir tous les articles →
          </a>
        </div>
        <hr style="margin: 30px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          BDB Consulting - Assistant marketing intelligent
        </p>
      </div>
    </body>
    </html>
  `;
}