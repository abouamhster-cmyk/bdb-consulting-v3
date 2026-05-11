import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status, customer, transaction_id } = body;

    console.log('📦 Webhook reçu:', { id, status });

    // Vérifier la signature (optionnel)
    const signature = request.headers.get('x-fedapay-signature');

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
      return NextResponse.json({ received: true });
    }

    const userId = transaction.user_id;
    const planName = transaction.plan_name;

    // Déterminer le slug du plan
    let planSlug = 'starter';
    if (planName?.toLowerCase() === 'pro') planSlug = 'pro';
    else if (planName?.toLowerCase() === 'business') planSlug = 'business';

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Activer l'abonnement
    await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_name: planSlug,
        status: 'active',
        transaction_id: id,
        current_period_start: new Date().toISOString(),
        current_period_end: endDate.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    // Mettre à jour la transaction
    await supabaseAdmin
      .from('fedapay_transactions')
      .update({ status: 'approved' })
      .eq('transaction_id', id);

    console.log(`✅ Abonnement ${planSlug} activé pour user ${userId}`);

    return NextResponse.json({ received: true, success: true });

  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}