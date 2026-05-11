export const welcomeEmail = (name: string, plan: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Bienvenue sur BDB Consulting</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb;">BDB Consulting</h1>
    </div>
    <h2>Bienvenue ${name} ! 🎉</h2>
    <p>Merci d'avoir choisi BDB Consulting. Votre abonnement <strong>${plan}</strong> est maintenant actif.</p>
    <p>Vous pouvez dès à présent :</p>
    <ul>
      <li>Configurer votre entreprise</li>
      <li>Définir vos paramètres de campagne</li>
      <li>Générer du contenu avec l'IA</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
        Accéder à mon espace →
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

export const paymentConfirmationEmail = (name: string, plan: string, amount: number) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Confirmation de paiement - BDB Consulting</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb;">BDB Consulting</h1>
    </div>
    <h2>Confirmation de paiement ✅</h2>
    <p>Bonjour ${name},</p>
    <p>Nous vous confirmons le paiement de votre abonnement <strong>${plan}</strong> d'un montant de <strong>${amount.toLocaleString()} FCFA</strong>.</p>
    <p>Votre facture est disponible dans votre espace.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/settings/billing" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
        Voir ma facture →
      </a>
    </div>
  </div>
</body>
</html>
`;