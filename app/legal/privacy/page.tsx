'use client';

import { Shield, Lock, Eye, Mail, Database, FileText, Globe, UserCheck, Cookie, Clock, Server, Users, Building2, AlertCircle } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
          <p className="text-gray-500 mt-2">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Introduction */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <p className="text-gray-700">
              Chez BDB Consulting, nous accordons une importance capitale à la protection de vos données personnelles.
              Cette politique détaille comment nous collectons, utilisons et protégeons vos informations.
            </p>
          </div>

          {/* Sections */}
          <div className="divide-y divide-gray-100">
            {/* Section 1 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">1. Collecte des informations</h2>
              </div>
              <p className="text-gray-600 mb-3">
                Nous collectons les informations que vous nous fournissez directement lorsque vous :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Créez un compte sur notre plateforme</li>
                <li>Configurez votre stratégie marketing</li>
                <li>Utilisez nos services de génération de contenu IA</li>
                <li>Communiquez avec notre support client</li>
                <li>Vous abonnez à nos newsletters</li>
              </ul>
              <p className="text-gray-600 mt-3">
                Ces informations incluent : nom, prénom, email, entreprise, poste, numéro de téléphone, 
                et les contenus que vous générez via notre plateforme.
              </p>
            </div>

            {/* Section 2 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">2. Utilisation des données</h2>
              </div>
              <p className="text-gray-600 mb-3">Vos données sont utilisées exclusivement pour :</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Générer vos contenus marketing personnalisés</li>
                <li>Analyser vos performances et améliorer nos services</li>
                <li>Vous envoyer des notifications importantes</li>
                <li>Assurer le support client</li>
                <li>Respecter nos obligations légales</li>
              </ul>
              <p className="text-gray-600 mt-3">
                <strong>Nous ne vendons jamais vos données personnelles à des tiers.</strong>
              </p>
            </div>

            {/* Section 3 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">3. Services tiers</h2>
              </div>
              <p className="text-gray-600 mb-3">
                Nous utilisons des services tiers pour fournir nos services :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li><strong>OpenAI</strong> - Pour la génération de textes, images et vidéos</li>
                <li><strong>Supabase</strong> - Pour l'hébergement de votre base de données</li>
                <li><strong>Buffer</strong> - Pour la programmation sur les réseaux sociaux</li>
                <li><strong>FédaPay</strong> - Pour les paiements sécurisés</li>
              </ul>
              <p className="text-gray-600 mt-3">
                Ces services peuvent avoir accès à vos données dans le cadre de l'exécution de nos services, 
                conformément à leurs propres politiques de confidentialité.
              </p>
            </div>

            {/* Section 4 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">4. Sécurité des données</h2>
              </div>
              <p className="text-gray-600">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées 
                pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction. 
                Cela inclut le chiffrement des données, l'authentification à deux facteurs, et des audits de sécurité réguliers.
              </p>
            </div>

            {/* Section 5 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">5. Vos droits (RGPD)</h2>
              </div>
              <p className="text-gray-600 mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li><strong>Droit d'accès</strong> - Savoir quelles données nous détenons sur vous</li>
                <li><strong>Droit de rectification</strong> - Modifier vos données incorrectes</li>
                <li><strong>Droit à l'effacement</strong> - Supprimer vos données ("droit à l'oubli")</li>
                <li><strong>Droit à la portabilité</strong> - Récupérer vos données</li>
                <li><strong>Droit d'opposition</strong> - Vous opposer au traitement de vos données</li>
              </ul>
              <p className="text-gray-600 mt-3">
                Pour exercer ces droits, contactez-nous à <strong>privacy@bdb-consulting.com</strong>
              </p>
            </div>

            {/* Section 6 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                  <Cookie className="w-5 h-5 text-pink-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">6. Cookies</h2>
              </div>
              <p className="text-gray-600">
                Nous utilisons des cookies essentiels au fonctionnement de l'application. 
                Vous pouvez les désactiver dans les paramètres de votre navigateur, mais cela pourrait 
                affecter certaines fonctionnalités du site.
              </p>
            </div>

            {/* Section 7 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">7. Conservation des données</h2>
              </div>
              <p className="text-gray-600">
                Nous conservons vos données aussi longtemps que votre compte est actif. 
                En cas de suppression de compte, vos données sont anonymisées ou supprimées dans un délai de 30 jours, 
                sauf obligation légale de conservation.
              </p>
            </div>

            {/* Section 8 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">8. Sous-traitants</h2>
              </div>
              <p className="text-gray-600 mb-3">
                Nous faisons appel aux sous-traitants suivants pour le traitement de vos données :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li><strong>Supabase</strong> - Hébergement de la base de données (UE)</li>
                <li><strong>OpenAI</strong> - Traitement des contenus IA (États-Unis)</li>
                <li><strong>Buffer</strong> - Publication sur les réseaux sociaux (États-Unis)</li>
                <li><strong>FédaPay</strong> - Traitement des paiements (Afrique)</li>
              </ul>
              <p className="text-gray-600 mt-3">
                Tous nos sous-traitants respectent le RGPD et mettent en œuvre des garanties appropriées.
              </p>
            </div>

            {/* Section 9 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-cyan-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">9. Notification de violation</h2>
              </div>
              <p className="text-gray-600">
                En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits et libertés, 
                nous nous engageons à vous notifier dans les 72 heures suivant la découverte de la violation, 
                conformément au RGPD.
              </p>
            </div>

            {/* Contact */}
            <div className="p-6 bg-gray-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Contact DPO</h2>
              </div>
              <p className="text-gray-600">
                Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits RGPD :<br />
                <strong>Email :</strong> dpo@bdb-consulting.com<br />
                <strong>Adresse :</strong> BDB Consulting, Cotonou, Bénin<br />
                <strong>Délégué à la protection des données (DPO) :</strong> contact@bdb-consulting.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}