'use client';

import { 
  FileText, Shield, CreditCard, AlertCircle, CheckCircle, 
  Clock, Users, MessageSquare, Globe, Lock, Scale,
  Mail, Building2, Calendar, Zap, Smartphone, Database,
  Server, DollarSign, Headphones, BookOpen, TrendingUp
} from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Conditions Générales d'Utilisation</h1>
          <p className="text-gray-500 mt-2">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Introduction */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <p className="text-gray-700">
              En utilisant BDB Consulting, vous acceptez pleinement les présentes conditions générales.
              Veuillez les lire attentivement avant d'utiliser nos services.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Article 1 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Article 1 : Acceptation des conditions</h2>
              </div>
              <p className="text-gray-600">
                L'utilisation de la plateforme BDB Consulting implique l'acceptation pleine et entière des présentes CGU. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
              </p>
            </div>

            {/* Article 2 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Article 2 : Description du service</h2>
              </div>
              <p className="text-gray-600 mb-3">
                BDB Consulting est une plateforme SaaS de génération de contenu marketing par intelligence artificielle.
                Nos services incluent :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Veille concurrentielle et génération d'insights</li>
                <li>Génération de calendrier éditorial personnalisé</li>
                <li>Production de textes, images et vidéos par IA</li>
                <li>Programmation sur les réseaux sociaux via Buffer</li>
                <li>Analyses et statistiques de performance</li>
                <li>Gestion d'équipe et collaboration</li>
                <li>API publique pour intégrations externes</li>
              </ul>
            </div>

            {/* Article 3 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Article 3 : Compte utilisateur</h2>
              </div>
              <p className="text-gray-600 mb-3">
                Pour utiliser nos services, vous devez créer un compte. Vous vous engagez à :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Fournir des informations exactes et à jour</li>
                <li>Protéger la confidentialité de vos identifiants</li>
                <li>Être responsable de toute activité sous votre compte</li>
                <li>Nous informer de toute utilisation non autorisée</li>
                <li>Ne pas créer de comptes multiples sans autorisation</li>
              </ul>
            </div>

            {/* Article 4 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Article 4 : Abonnements et paiements</h2>
              </div>
              <p className="text-gray-600 mb-3">
                Nos services sont proposés via différents plans d'abonnement :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li><strong>Starter</strong> - 50.000 FCFA/mois : 30 posts, 1 utilisateur, textes IA</li>
                <li><strong>Pro</strong> - 150.000 FCFA/mois : 100 posts, 5 utilisateurs, textes + images IA</li>
                <li><strong>Business</strong> - 500.000 FCFA/mois : Posts illimités, 20 utilisateurs, contenus complets IA</li>
              </ul>
              <p className="text-gray-600 mt-3">
                Les paiements sont sécurisés via FédaPay. Vous pouvez résilier votre abonnement à tout moment depuis vos paramètres.
                En cas de résiliation, l'accès aux fonctionnalités premium est maintenu jusqu'à la fin de la période en cours.
              </p>
            </div>

            {/* Article 5 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Article 5 : Propriété intellectuelle</h2>
              </div>
              <p className="text-gray-600 mb-3">
                <strong>Contenus générés :</strong> Les contenus générés par l'IA vous appartiennent. 
                Vous êtes seul responsable de leur utilisation et du respect des droits des tiers.
              </p>
              <p className="text-gray-600">
                <strong>Plateforme :</strong> Notre code, notre interface, nos algorithmes et notre marque 
                sont notre propriété intellectuelle. Toute reproduction, modification ou distribution est interdite 
                sans autorisation écrite.
              </p>
            </div>

            {/* Article 6 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Article 6 : Responsabilités</h2>
              </div>
              <p className="text-gray-600 mb-3">
                BDB Consulting ne peut être tenu responsable :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>De l'utilisation faite des contenus générés par l'utilisateur</li>
                <li>Des éventuelles inexactitudes des contenus générés par l'IA</li>
                <li>Des interruptions de service dues à des causes externes</li>
                <li>Des pertes de données en cas de force majeure</li>
              </ul>
              <p className="text-gray-600 mt-3">
                L'utilisateur est seul responsable du respect des lois applicables (droit à l'image, propriété intellectuelle, etc.).
                En cas de litige, la loi applicable est la loi béninoise.
              </p>
            </div>

            {/* Article 7 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Article 7 : Résiliation</h2>
              </div>
              <p className="text-gray-600">
                Vous pouvez résilier votre compte à tout moment depuis vos paramètres. 
                Nous nous réservons le droit de suspendre un compte en cas de violation des présentes conditions. 
                Les données sont conservées 30 jours après résiliation, sauf demande de suppression immédiate.
              </p>
            </div>

            {/* Article 8 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Article 8 : Support</h2>
              </div>
              <p className="text-gray-600">
                Le support est assuré par email : <strong>support@bdb-consulting.com</strong>. 
                Délais de réponse :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-2">
                <li>Plan Starter : 48h ouvrées</li>
                <li>Plan Pro : 24h ouvrées</li>
                <li>Plan Business : 12h ouvrées, support dédié</li>
              </ul>
            </div>

            {/* Article 9 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-cyan-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Article 9 : Droit applicable</h2>
              </div>
              <p className="text-gray-600">
                Les présentes CGU sont régies par la loi béninoise. Tout litige relatif à leur interprétation ou à leur exécution 
                sera soumis aux tribunaux de Cotonou, Bénin.
              </p>
            </div>

            {/* Article 10 */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-pink-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Article 10 : Modification des CGU</h2>
              </div>
              <p className="text-gray-600">
                Nous pouvons modifier ces CGU à tout moment. Les modifications entrent en vigueur dès leur publication. 
                Votre utilisation continue de la plateforme vaut acceptation des modifications.
              </p>
            </div>

            {/* Contact */}
            <div className="p-6 bg-gray-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
              </div>
              <p className="text-gray-600">
                Pour toute question concernant ces CGU :<br />
                <strong>Email :</strong> legal@bdb-consulting.com<br />
                <strong>Adresse :</strong> BDB Consulting, Cotonou, Bénin<br />
                <strong>Téléphone :</strong> +229 12 34 56 78
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}