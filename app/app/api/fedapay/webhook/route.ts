import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status, customer, amount, description } = body;

    console.log('📦 Webhook FédaPay reçu:', { id, status });

    if (!id || !status) {
      return NextResponse.json({ received: true, error: 'Données incomplètes' });
    }

    // Vérifier la signature (optionnel mais recommandé)
    const signature = request.headers.get('x-fedapay-signature');
    
    // Traitement seulement pour les paiements approuvés
    if (status !== 'approved') {
      console.log(`Transaction ${id} - Statut: ${status} (ignoré)`);
      return NextResponse.json({ received: true });
    }

    // Récupérer la transaction en base
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('fedapay_transactions')
      .select('*')
      .eq('transaction_id', id)
      .single();

    if (txError || !transaction) {
      console.error('Transaction non trouvée:', id);
      return NextResponse.json({ received: true, error: 'Transaction non trouvée' });
    }

    const userId = transaction.user_id;

    // Déterminer le plan
    let planSlug = 'starter';
    if (transaction.plan_name?.toLowerCase() === 'pro') planSlug = 'pro';
    else if (transaction.plan_name?.toLowerCase() === 'business') planSlug = 'business';

    // Récupérer l'ID du plan
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('slug', planSlug)
      .single();

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Activer l'abonnement
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_name: planSlug,
        plan_id: plan?.id,
        status: 'active',
        transaction_id: id,
        current_period_start: new Date().toISOString(),
        current_period_end: endDate.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (subError) {
      console.error('❌ Erreur activation:', subError);
    }

    // Mettre à jour la transaction
    await supabaseAdmin
      .from('fedapay_transactions')
      .update({ status: 'approved' })
      .eq('transaction_id', id);

    console.log(`✅ Abonnement ${planSlug} activé pour user ${userId}`);

    return NextResponse.json({ received: true, success: true });

  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    return NextResponse.json({ received: true, error: 'Erreur interne' }, { status: 500 });
  }
}