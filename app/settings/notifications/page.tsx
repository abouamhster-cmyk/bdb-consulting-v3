'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, Mail, MessageSquare, Megaphone, 
  Calendar, Eye, TrendingUp, CheckCircle,
  Shield, CreditCard, Users, Webhook,
  Loader2, Save, Send, AlertCircle, User,
  Key, Palette, Activity, Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import PushNotifications from '@/components/PushNotifications';

interface NotificationPreferences {
  email: string;
  competitive_alert: boolean;
  campaign_ready: boolean;
  weekly_report: boolean;
  post_scheduled: boolean;
  new_insight: boolean;
  billing_alert: boolean;
  team_invite: boolean;
  marketing_emails: boolean;
}

const menuItems = [
  { name: 'Profil', href: '/settings/profile', icon: User },
  { name: 'Sécurité', href: '/settings/security', icon: Shield },
  { name: 'Facturation', href: '/settings/billing', icon: CreditCard },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell, current: true },
  { name: 'Équipe', href: '/settings/team', icon: Users },
  { name: 'API', href: '/settings/api-keys', icon: Key },
  { name: 'Intégrations', href: '/settings/integrations', icon: Webhook },
  { name: 'Personnalisation', href: '/settings/branding', icon: Palette },
  { name: 'Données', href: '/settings/data', icon: Database },
  { name: 'Activité', href: '/settings/activity', icon: Activity }
];

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: '',
    competitive_alert: true,
    campaign_ready: true,
    weekly_report: true,
    post_scheduled: true,
    new_insight: true,
    billing_alert: true,
    team_invite: true,
    marketing_emails: false
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    setPreferences(prev => ({ ...prev, email: user.email || '' }));

    const { data } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPreferences({
        email: data.email || user.email || '',
        competitive_alert: data.competitive_alert ?? true,
        campaign_ready: data.campaign_ready ?? true,
        weekly_report: data.weekly_report ?? true,
        post_scheduled: data.post_scheduled ?? true,
        new_insight: data.new_insight ?? true,
        billing_alert: data.billing_alert ?? true,
        team_invite: data.team_invite ?? true,
        marketing_emails: data.marketing_emails ?? false
      });
    }

    setLoading(false);
  };

  const savePreferences = async () => {
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: user.id,
        email: preferences.email,
        competitive_alert: preferences.competitive_alert,
        campaign_ready: preferences.campaign_ready,
        weekly_report: preferences.weekly_report,
        post_scheduled: preferences.post_scheduled,
        new_insight: preferences.new_insight,
        billing_alert: preferences.billing_alert,
        team_invite: preferences.team_invite,
        marketing_emails: preferences.marketing_emails,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Préférences sauvegardées');
    }
    
    setSaving(false);
  };

  const sendTestEmail = async () => {
    setSendingTest(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: preferences.email || user?.email,
        subject: '🔔 Test de notification - BDB Consulting',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Test BDB Consulting</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb;">🔔 Test de notification</h1>
              </div>
              <p>Bonjour,</p>
              <p>Ceci est un test de notification de la part de <strong>BDB Consulting</strong>.</p>
              <p>Vous recevrez des alertes pour :</p>
              <ul>
                ${preferences.competitive_alert ? '<li>🔍 Veille concurrentielle</li>' : ''}
                ${preferences.campaign_ready ? '<li>🎯 Campagnes prêtes</li>' : ''}
                ${preferences.weekly_report ? '<li>📊 Rapports hebdomadaires</li>' : ''}
                ${preferences.post_scheduled ? '<li>📅 Posts programmés</li>' : ''}
                ${preferences.new_insight ? '<li>💡 Nouveaux insights</li>' : ''}
                ${preferences.billing_alert ? '<li>💰 Alertes facturation</li>' : ''}
                ${preferences.team_invite ? '<li>👥 Invitations équipe</li>' : ''}
              </ul>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
              <p style="font-size: 12px; color: #6b7280; text-align: center;">
                BDB Consulting - Assistant marketing intelligent
              </p>
            </div>
          </body>
          </html>
        `
      })
    });

    if (response.ok) {
      toast.success('Email de test envoyé !');
    } else {
      toast.error('Erreur envoi test');
    }
    
    setSendingTest(false);
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
            {/* Email Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Email de réception</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
                  <input
                    type="email"
                    value={preferences.email}
                    onChange={(e) => setPreferences({...preferences, email: e.target.value})}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="votre@email.com"
                  />
                  <p className="text-xs text-gray-400 mt-1">Toutes les notifications seront envoyées à cette adresse</p>
                </div>
              </div>
            </div>

            {/* Alertes Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Alertes et notifications</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900">Veille concurrentielle</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Nouveaux insights générés</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.competitive_alert}
                      onChange={(e) => setPreferences({...preferences, competitive_alert: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-900">Campagne prête</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Quand une campagne est terminée</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.campaign_ready}
                      onChange={(e) => setPreferences({...preferences, campaign_ready: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-gray-900">Rapport hebdomadaire</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Résumé des performances chaque semaine</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.weekly_report}
                      onChange={(e) => setPreferences({...preferences, weekly_report: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900">Posts programmés</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Confirmation de programmation</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.post_scheduled}
                      onChange={(e) => setPreferences({...preferences, post_scheduled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">Nouveaux insights</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Alertes des insights IA générés</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.new_insight}
                      onChange={(e) => setPreferences({...preferences, new_insight: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-gray-900">Alertes facturation</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Paiements, factures, expiration</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.billing_alert}
                      onChange={(e) => setPreferences({...preferences, billing_alert: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-600" />
                      <span className="font-medium text-gray-900">Invitations équipe</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Quand vous êtes invité à rejoindre une équipe</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.team_invite}
                      onChange={(e) => setPreferences({...preferences, team_invite: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Marketing Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Communications marketing</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="font-medium text-gray-900">Offres et actualités</span>
                    <p className="text-xs text-gray-500 mt-1">Recevez nos newsletters et promotions exclusives</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing_emails}
                      onChange={(e) => setPreferences({...preferences, marketing_emails: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notifications Push Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Notifications push</h2>
                </div>
              </div>
              <div className="p-6">
                <PushNotifications />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={sendTestEmail}
                disabled={sendingTest}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center gap-2"
              >
                {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Tester l'email
              </button>
              <button
                onClick={savePreferences}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}