import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Importer FedaPay
const FedaPay = require('fedapay');

export async function POST(request: Request) {
  try {
    const { planId, planName, amount, customerEmail, customerName, userId } = await request.json();

    console.log('📝 Création transaction:', { planId, planName, amount, customerEmail, userId });

    if (!planId || !amount || !customerEmail) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Configurer FedaPay
    FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
    FedaPay.setEnvironment(process.env.FEDAPAY_MODE || 'live');

    // Créer la transaction
    const transaction = await FedaPay.Transaction.create({
      description: `Abonnement ${planName}`,
      amount: amount,
      currency: { iso: 'XOF' },
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/fedapay/webhook`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?cancel=true`,
      customer: {
        email: customerEmail,
        firstname: customerName?.split(' ')[0] || 'Client',
        lastname: customerName?.split(' ')[1] || ''
      }
    });

    console.log('✅ Transaction créée:', transaction.id);
    console.log('🔗 URL de paiement:', transaction.payment_url);

    // Sauvegarder la transaction en base
    await supabaseAdmin
      .from('fedapay_transactions')
      .insert({
        transaction_id: transaction.id,
        user_id: userId,
        amount: amount,
        status: 'pending',
        plan_name: planName,
        plan_id: planId
      });

    return NextResponse.json({
      success: true,
      paymentUrl: transaction.payment_url,
      transactionId: transaction.id
    });

  } catch (error: any) {
    console.error('❌ Erreur FedaPay:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du paiement' },
      { status: 500 }
    );
  }
}