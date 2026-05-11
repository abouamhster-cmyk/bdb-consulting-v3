'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Check, Crown, Sparkles, Building2, Rocket, Loader2, AlertCircle, 
  Zap, Star, Gem, Shield, Clock, Infinity, Users, Image, Video, 
  MessageSquare, BarChart3, Headphones, Globe, Database, ArrowRight
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  posts_limit: number;
  users_limit: number;
  features: string[];
  recommended: boolean;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_end: string;
  usage_text: number;
  usage_image: number;
  usage_video: number;
}

const planDetails = {
  Starter: {
    icon: Rocket,
    color: 'from-gray-600 to-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    gradient: 'from-gray-50 to-gray-100'
  },
  Pro: {
    icon: Zap,
    color: 'from-blue-600 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    gradient: 'from-blue-50 to-indigo-50'
  },
  Business: {
    icon: Crown,
    color: 'from-purple-600 to-pink-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    gradient: 'from-purple-50 to-pink-50'
  }
};

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    const { data: plansData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    const parsedPlans = (plansData || []).map(plan => ({
      ...plan,
      slug: plan.slug || plan.name.toLowerCase(),
      features: Array.isArray(plan.features) ? plan.features : [],
      icon: planDetails[plan.name as keyof typeof planDetails]?.icon || Rocket,
      color: planDetails[plan.name as keyof typeof planDetails]?.color || 'from-gray-600 to-gray-700',
      bgColor: planDetails[plan.name as keyof typeof planDetails]?.bgColor || 'bg-gray-50',
      borderColor: planDetails[plan.name as keyof typeof planDetails]?.borderColor || 'border-gray-200'
    }));
    setPlans(parsedPlans);

    if (user) {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setCurrentSubscription(subData);
    }

    setLoading(false);
  };

  const handlePayment = async (plan: Plan) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setProcessing(plan.slug);
    setError(null);

    try {
      // Créer la transaction via l'API
      const response = await fetch('/api/fedapay/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          customerEmail: user.email,
          customerName: user.user_metadata?.full_name || 'Client',
          userId: user.id
        })
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        setProcessing(null);
        return;
      }

      // Rediriger vers la page de paiement FedaPay
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        setError('Erreur: pas d\'URL de paiement');
        setProcessing(null);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du paiement');
      setProcessing(null);
    }
  };

  const isCurrentPlan = (plan: Plan) => {
    if (!currentSubscription) return false;
    const currentPlanName = currentSubscription.plan_name?.toLowerCase() || '';
    const planSlug = plan.slug?.toLowerCase() || plan.name?.toLowerCase() || '';
    return currentPlanName === planSlug;
  };

  const getRemainingDays = () => {
    if (!currentSubscription?.current_period_end) return 0;
    const end = new Date(currentSubscription.current_period_end);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-6">
            <Rocket className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Choisissez votre formule</h1>
          <p className="text-blue-100 max-w-2xl mx-auto">
            Des solutions adaptées à tous les besoins, de la startup à la grande entreprise.
            Tous nos plans incluent une période d'essai de 14 jours.
          </p>
        </div>
        <svg className="absolute bottom-0 left-0 right-0" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 32C840 34 960 38 1080 40C1200 42 1320 42 1380 42L1440 42L1440 60L1380 60C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60L0 60Z" fill="#f9fafb"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 -mt-8 relative z-10">
        {/* Abonnement actuel */}
        {currentSubscription && currentSubscription.status === 'active' && (
          <div className="mb-10 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Votre abonnement actuel :</span>
                  <span className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full text-sm font-medium capitalize">
                    {currentSubscription.plan_name || 'Starter'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Prochain renouvellement dans {getRemainingDays()} jours
                </p>
                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>{currentSubscription.usage_text || 0} textes utilisés</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Image className="w-4 h-4 text-green-500" />
                    <span>{currentSubscription.usage_image || 0} images utilisées</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Video className="w-4 h-4 text-purple-500" />
                    <span>{currentSubscription.usage_video || 0} vidéos utilisées</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/settings/billing')}
                className="px-5 py-2 text-sm border border-green-300 rounded-xl hover:bg-green-100 transition text-gray-700"
              >
                Gérer mon abonnement →
              </button>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isCurrent = isCurrentPlan(plan);
            const isRecommended = plan.recommended;
            const PlanIcon = plan.icon;
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  isRecommended ? 'ring-2 ring-blue-500 shadow-xl scale-105 md:scale-105' : 'shadow-lg'
                }`}
              >
                {/* Badge recommandé */}
                {isRecommended && (
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      RECOMMANDÉ
                    </div>
                  </div>
                )}

                {/* Contenu de la carte */}
                <div className={`bg-white p-6 ${isRecommended ? 'pt-8' : ''}`}>
                  {/* Icône et titre */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                    <PlanIcon className="w-8 h-8" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                  <div className="mt-2 mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price.toLocaleString()} FCFA</span>
                    <span className="text-gray-500 ml-1">/mois</span>
                  </div>

                  {/* Caractéristiques principales */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span>{plan.posts_limit === 1000 ? '🏆 Posts illimités' : `📝 ${plan.posts_limit} posts/mois`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span>{plan.users_limit === 20 ? '👥 Jusqu\'à 20 utilisateurs' : `👤 ${plan.users_limit} utilisateur${plan.users_limit > 1 ? 's' : ''}`}</span>
                    </div>
                  </div>

                  {/* Liste des features */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ce qui est inclus</p>
                    <div className="space-y-2">
                      {plan.features && plan.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bouton d'action */}
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Plan actuel
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePayment(plan)}
                      disabled={processing === plan.slug}
                      className={`w-full py-3 bg-gradient-to-r ${plan.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 group`}
                    >
                      {processing === plan.slug ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          Choisir ce plan
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ et garanties */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Paiement sécurisé</h3>
                <p className="text-sm text-gray-500">Transactions sécurisées via FédaPay</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Sans engagement</h3>
                <p className="text-sm text-gray-500">Résiliable à tout moment</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <Headphones className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Support dédié</h3>
                <p className="text-sm text-gray-500">Une question ? Notre équipe répond sous 24h</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm text-gray-500">
              Tous les prix sont en FCFA TTC. Engagement mensuel sans obligation.
              <br />
              <a href="/legal/terms" className="text-blue-600 hover:underline">Conditions générales</a>
              {" • "}
              <a href="/legal/privacy" className="text-blue-600 hover:underline">Politique de confidentialité</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}