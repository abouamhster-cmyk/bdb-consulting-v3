import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, subject, htmlContent, senderName = 'BDB Consulting' } = await request.json();

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@bdb-consulting.com';

    if (!apiKey) {
      console.error('Brevo non configuré');
      return NextResponse.json({ error: 'Service email non configuré' }, { status: 500 });
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur Brevo');
    }

    return NextResponse.json({ success: true, messageId: data.messageId });

  } catch (error: any) {
    console.error('Erreur Brevo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}