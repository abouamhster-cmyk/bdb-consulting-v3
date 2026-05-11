'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Webhook, Plug, Loader2, CheckCircle, XCircle,
  ExternalLink, Trash2, Plus, RefreshCw, Key,
  Shield, CreditCard, Bell, Users, Palette, Activity, Database,
  Eye, EyeOff, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const menuItems = [
  { name: 'Profil', href: '/settings/profile', icon: Shield },
  { name: 'Sécurité', href: '/settings/security', icon: Shield },
  { name: 'Facturation', href: '/settings/billing', icon: CreditCard },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Équipe', href: '/settings/team', icon: Users },
  { name: 'API', href: '/settings/api-keys', icon: Key },
  { name: 'Intégrations', href: '/settings/integrations', icon: Webhook, current: true },
  { name: 'Personnalisation', href: '/settings/branding', icon: Palette },
  { name: 'Données', href: '/settings/data', icon: Database },
  { name: 'Activité', href: '/settings/activity', icon: Activity }
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<Record<string, any>>({});
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [bufferToken, setBufferToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setCurrentUserId(user.id);

    const { data: bufferAccounts } = await supabase
      .from('buffer_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const accounts: Record<string, any> = {};
    if (bufferAccounts && bufferAccounts.length > 0) {
      accounts.buffer = bufferAccounts;
    }

    setConnectedAccounts(accounts);
    setLoading(false);
  };

  const saveBufferToken = async () => {
    if (!bufferToken.trim()) {
      toast.error('Veuillez entrer votre token Buffer');
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Tester le token avant de sauvegarder
    const testQuery = `
      query {
        account {
          id
          name
        }
      }
    `;

    const testResponse = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bufferToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: testQuery })
    });

    const testResult = await testResponse.json();

    if (testResult.errors) {
      toast.error('Token invalide: ' + testResult.errors[0].message);
      setSaving(false);
      return;
    }

    // Sauvegarder le token
    const { error } = await supabase
      .from('buffer_accounts')
      .upsert({
        user_id: user.id,
        access_token: bufferToken,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Token Buffer sauvegardé !');
      setShowTokenModal(false);
      setBufferToken('');
      await loadIntegrations();
      await fetchProfiles();
    }

    setSaving(false);
  };

  const fetchProfiles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const response = await fetch(`/api/buffer/profiles?userId=${user.id}`);
    const result = await response.json();

    if (result.success) {
      toast.success(`${result.count} réseaux sociaux connectés`);
      await loadIntegrations();
    } else {
      toast.error(result.error || 'Erreur');
    }
  };

  const disconnectBuffer = async () => {
    if (!confirm('Déconnecter Buffer ? Vous devrez reconnecter manuellement.')) return;

    const { error } = await supabase
      .from('buffer_accounts')
      .delete()
      .eq('user_id', currentUserId);

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Buffer déconnecté');
      setConnectedAccounts({});
      await loadIntegrations();
    }
  };

  const isBufferConnected = () => {
    const accounts = connectedAccounts.buffer;
    return accounts && accounts.length > 0 && accounts[0]?.access_token;
  };

  const isCurrentPath = (href: string) => {
    return window.location.pathname === href;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-900">Menu</h2>
              </div>
              <nav className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isCurrentPath(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition mb-1 ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Buffer</h2>
                </div>
              </div>

              <div className="p-6">
                {isBufferConnected() ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-gray-900">Buffer connecté</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Vos réseaux sociaux sont synchronisés
                        </p>
                      </div>
                      <button
                        onClick={disconnectBuffer}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                      >
                        Déconnecter
                      </button>
                    </div>

                    {connectedAccounts.buffer && connectedAccounts.buffer.length > 0 && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Comptes connectés :</p>
                        <div className="space-y-2">
                          {connectedAccounts.buffer.map((acc: any) => (
                            <div key={acc.profile_id} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{acc.profile_name}</span>
                              <span className="text-xs text-gray-400">({acc.profile_service})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 mb-2">
                        🔑 Pour publier sur vos réseaux sociaux, vous avez besoin d'un token Buffer :
                      </p>
                      <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1 ml-2">
                        <li>Créez un compte sur <a href="https://buffer.com" target="_blank" rel="noopener noreferrer" className="underline">Buffer.com</a></li>
                        <li>Connectez vos réseaux sociaux (LinkedIn, Twitter, Facebook, Instagram)</li>
                        <li>Allez dans Settings → Apps → Create Access Token</li>
                        <li>Copiez le token généré (commence par v1/)</li>
                      </ol>
                    </div>
                    <button
                      onClick={() => setShowTokenModal(true)}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      Connecter avec mon token Buffer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour entrer le token */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Entrez votre token Buffer
              </h3>
              <button
                onClick={() => setShowTokenModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buffer Access Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={bufferToken}
                    onChange={(e) => setBufferToken(e.target.value)}
                    placeholder="v1/xxxxx/xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Le token commence par "v1/" et se trouve dans Settings → Apps sur Buffer
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveBufferToken}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </button>
              <button
                onClick={() => setShowTokenModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}