'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CreditCard, FileText, Download, AlertCircle, 
  CheckCircle, Loader2, Calendar, Clock, 
  ArrowRight, Shield, Users, Bell, Database,
  Webhook, Palette, Activity, Trash2, Crown,
  Zap, Sparkles, Building2, Rocket, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  posts_limit: number;
  users_limit: number;
  features: string[];
}

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  usage_text: number;
  usage_image: number;
  usage_video: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  paid_at: string;
  pdf_url: string | null;
}

const menuItems = [
  { name: 'Profil', href: '/settings', icon: Building2 },
  { name: 'Sécurité', href: '/settings/security', icon: Shield },
  { name: 'Facturation', href: '/settings/billing', icon: CreditCard, current: true },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Équipe', href: '/settings/team', icon: Users },
  { name: 'API', href: '/settings/api-keys', icon: Database },
  { name: 'Intégrations', href: '/settings/integrations', icon: Webhook },
  { name: 'Personnalisation', href: '/settings/branding', icon: Palette },
  { name: 'Données', href: '/settings/data', icon: Database },
  { name: 'Activité', href: '/settings/activity', icon: Activity }
];

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUser(user);

    // Récupérer l'abonnement
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    setSubscription(subData);

    if (subData?.plan_name) {
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('slug', subData.plan_name)
        .maybeSingle();
      setPlan(planData);
    }

    // Récupérer les factures
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('paid_at', { ascending: false });

    setInvoices(invoicesData || []);
    setLoading(false);
  };

  const cancelSubscription = async () => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir annuler votre abonnement ? Vous perdrez l\'accès aux fonctionnalités premium à la fin de la période en cours.')) return;
    
    setCancelling(true);
    
    const response = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    
    if (result.success) {
      toast.success('Abonnement annulé. Vous pourrez continuer jusqu\'à la fin de la période.');
      await loadData();
    } else {
      toast.error('Erreur: ' + result.error);
    }
    
    setCancelling(false);
  };

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    setDownloading(invoiceId);
    try {
      const response = await fetch('/api/invoice/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${invoiceNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Facture téléchargée');
      } else {
        toast.error('Erreur lors du téléchargement');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setDownloading(null);
    }
  };

  const getRemainingDays = () => {
    if (!subscription?.current_period_end) return 0;
    const end = new Date(subscription.current_period_end);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const getPlanColor = (planName: string) => {
    switch(planName?.toLowerCase()) {
      case 'pro': return 'from-blue-600 to-indigo-600';
      case 'business': return 'from-purple-600 to-pink-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getPlanIcon = (planName: string) => {
    switch(planName?.toLowerCase()) {
      case 'pro': return <Zap className="w-5 h-5" />;
      case 'business': return <Crown className="w-5 h-5" />;
      default: return <Rocket className="w-5 h-5" />;
    }
  };

  const isCurrentPath = (href: string) => {
    return window.location.pathname === href;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 mt-1">Gérez vos informations personnelles et préférences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Current Plan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Abonnement actuel</h2>
                </div>
              </div>
              <div className="p-6">
                {subscription ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getPlanColor(subscription.plan_name)} flex items-center justify-center text-white`}>
                          {getPlanIcon(subscription.plan_name)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold capitalize text-gray-900">{subscription.plan_name || 'Starter'}</h3>
                          <p className="text-sm text-gray-500">
                            {subscription.status === 'active' ? 'Actif' : subscription.status === 'trial' ? 'Essai gratuit' : subscription.status}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/pricing"
                        className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                      >
                        Changer de forfait
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {subscription.status === 'trial' && (
                      <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="flex items-center gap-2 text-amber-700">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Période d'essai - {getRemainingDays()} jours restants</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Utilisation textes</p>
                        <p className="text-lg font-bold text-gray-900">{subscription.usage_text || 0} / {plan?.posts_limit || 30}</p>
                        <div className="h-1 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${getUsagePercentage(subscription.usage_text || 0, plan?.posts_limit || 30)}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Utilisation images</p>
                        <p className="text-lg font-bold text-gray-900">{subscription.usage_image || 0} / {plan?.name === 'Business' ? 200 : plan?.name === 'Pro' ? 50 : 0}</p>
                        <div className="h-1 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-full bg-green-600 rounded-full"
                            style={{ width: `${getUsagePercentage(subscription.usage_image || 0, plan?.name === 'Business' ? 200 : plan?.name === 'Pro' ? 50 : 0)}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Utilisation vidéos</p>
                        <p className="text-lg font-bold text-gray-900">{subscription.usage_video || 0} / {plan?.name === 'Business' ? 50 : 0}</p>
                        <div className="h-1 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${getUsagePercentage(subscription.usage_video || 0, plan?.name === 'Business' ? 50 : 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href="/pricing"
                        className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        Mettre à jour
                      </Link>
                      <button
                        onClick={cancelSubscription}
                        disabled={cancelling}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {cancelling ? 'Annulation...' : 'Annuler'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Aucun abonnement actif</p>
                    <Link
                      href="/pricing"
                      className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium"
                    >
                      Voir les offres
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Invoices */}
            {invoices.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Historique des factures</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">Facture {invoice.invoice_number}</p>
                          {invoice.status === 'paid' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Payée</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-500">
                            {new Date(invoice.paid_at).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {invoice.amount.toLocaleString()} FCFA
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Période: {new Date(invoice.period_start).toLocaleDateString()} - {new Date(invoice.period_end).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadInvoice(invoice.id, invoice.invoice_number)}
                        disabled={downloading === invoice.id}
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition disabled:opacity-50"
                      >
                        {downloading === invoice.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Télécharger
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Moyens de paiement</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Carte bancaire / Mobile Money</p>
                      <p className="text-sm text-gray-500">Paiement sécurisé via FédaPay</p>
                    </div>
                  </div>
                  <Link
                    href="/pricing"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}