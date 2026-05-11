import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  // Vérifier la clé secrète pour sécuriser le cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET non défini');
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 });
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('Tentative non autorisée sur le cron');
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Récupérer toutes les configurations actives dont la date d'envoi est passée
    const { data: configs, error } = await supabaseAdmin
      .from('monitoring_config')
      .select('*')
      .eq('is_active', true)
      .lte('next_send_at', now.toISOString());

    if (error) {
      console.error('Erreur récupération configs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!configs || configs.length === 0) {
      console.log('Aucune veille à exécuter');
      return NextResponse.json({ success: true, message: 'Aucune veille à exécuter' });
    }

    console.log(`Exécution de la veille pour ${configs.length} utilisateur(s)`);

    const results = [];

    for (const config of configs) {
      try {
        // Exécuter la veille pour cet utilisateur
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/monitoring/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: config.user_id, isTest: false })
        });

        const result = await response.json();
        
        // Calculer la prochaine date d'envoi
        const [hours, minutes] = config.time_of_day.split(':').map(Number);
        const nextDate = new Date();
        nextDate.setHours(hours, minutes, 0, 0);

        if (config.frequency === 'daily') {
          if (nextDate <= now) nextDate.setDate(nextDate.getDate() + 1);
        } else if (config.frequency === 'weekly') {
          let daysToAdd = (config.day_of_week - nextDate.getDay() + 7) % 7;
          if (daysToAdd === 0 && nextDate <= now) daysToAdd = 7;
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        } else if (config.frequency === 'monthly') {
          nextDate.setDate(config.day_of_month);
          if (nextDate <= now) nextDate.setMonth(nextDate.getMonth() + 1);
        }

        // Mettre à jour la prochaine date
        await supabaseAdmin
          .from('monitoring_config')
          .update({ next_send_at: nextDate.toISOString() })
          .eq('id', config.id);

        results.push({ 
          userId: config.user_id, 
          nextSendAt: nextDate,
          itemsFound: result.count || 0
        });
        
        console.log(`Veille exécutée pour ${config.user_id}: ${result.count || 0} éléments trouvés`);
        
      } catch (err) {
        console.error(`Erreur pour utilisateur ${config.user_id}:`, err);
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error) {
    console.error('Erreur cron:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}