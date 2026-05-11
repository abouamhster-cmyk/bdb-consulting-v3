import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const planName = searchParams.get('planName');
    const amount = parseInt(searchParams.get('amount') || '0');
    const userId = searchParams.get('userId'); // 🔥 Récupérer l'userId

    console.log('🎯 Simulation paiement:', { planId, planName, amount, userId });

    if (!userId) {
      console.error('❌ userId manquant');
      return NextResponse.redirect(new URL('/pricing?error=missing_user', request.url));
    }

    // Déterminer le slug du plan
    let planSlug = 'starter';
    if (planName?.toLowerCase() === 'pro') planSlug = 'pro';
    else if (planName?.toLowerCase() === 'business') planSlug = 'business';
    else if (planName?.toLowerCase() === 'starter') planSlug = 'starter';

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
      .update({ status: 'approved', user_id: userId })
      .eq('transaction_id', `demo_${planId?.substring(0, 8)}`);

    console.log(`✅ Abonnement ${planSlug} activé pour user ${userId}`);

    // Rediriger vers le dashboard avec succès
    return NextResponse.redirect(new URL('/dashboard?subscription=success', request.url));

  } catch (error) {
    console.error('❌ Erreur simulation:', error);
    return NextResponse.redirect(new URL('/pricing?error=payment_failed', request.url));
  }
}