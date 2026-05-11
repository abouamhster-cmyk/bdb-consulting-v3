import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { planId, planName, amount, customerEmail, customerName, userId } = await request.json();

    const fedapayApiKey = process.env.FEDAPAY_API_KEY;
    const fedapayMode = process.env.FEDAPAY_MODE || 'live';

    if (!fedapayApiKey) {
      return NextResponse.json({ error: 'Paiement non configuré' }, { status: 500 });
    }

    // Créer la transaction chez FédaPay
    const response = await fetch('https://api.fedapay.com/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fedapayApiKey}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'XOF',
        description: `Abonnement ${planName}`,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/fedapay/webhook`,
        customer: {
          email: customerEmail,
          name: customerName || 'Client',
        },
        mode: fedapayMode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Erreur FédaPay' }, { status: 400 });
    }

    // Sauvegarder la transaction
    await supabaseAdmin
      .from('fedapay_transactions')
      .insert({
        transaction_id: data.id,
        user_id: userId,
        amount: amount,
        status: 'pending',
        plan_name: planName,
        plan_id: planId
      });

    return NextResponse.json({ transactionId: data.id });

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}