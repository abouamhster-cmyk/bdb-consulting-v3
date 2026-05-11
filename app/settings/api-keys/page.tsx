'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Key, Plus, Trash2, Copy, Check, Eye, EyeOff,
  Shield, CreditCard, Bell, Users, Database,
  Webhook, Palette, Activity, Loader2, X,
  Calendar, Clock, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  rate_limit: number;
  last_used_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

const menuItems = [
  { name: 'Profil', href: '/settings', icon: Shield },
  { name: 'Sécurité', href: '/settings/security', icon: Shield },
  { name: 'Facturation', href: '/settings/billing', icon: CreditCard },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Équipe', href: '/settings/team', icon: Users },
  { name: 'API', href: '/settings/api-keys', icon: Key, current: true },
  { name: 'Intégrations', href: '/settings/integrations', icon: Webhook },
  { name: 'Personnalisation', href: '/settings/branding', icon: Palette },
  { name: 'Données', href: '/settings/data', icon: Database },
  { name: 'Activité', href: '/settings/activity', icon: Activity }
];

export default function ApiKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(100);
  const [newKeyExpiresIn, setNewKeyExpiresIn] = useState(30);
  const [creating, setCreating] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erreur chargement clés');
    } else {
      setKeys(data || []);
    }
    setLoading(false);
  };

  const createKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Nom requis');
      return;
    }

    setCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const expiresAt = newKeyExpiresIn > 0 
      ? new Date(Date.now() + newKeyExpiresIn * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: newKeyName,
        permissions: newKeyPermissions,
        rate_limit: newKeyRateLimit,
        expires_at: expiresAt,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      setNewKeyValue(data.key);
      await loadKeys();
      toast.success('Clé API créée');
    }

    setCreating(false);
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Supprimer cette clé API ? Cette action est irréversible.')) return;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Clé supprimée');
      await loadKeys();
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Clé copiée');
  };

  const toggleKeyVisibility = (id: string) => {
    const newSet = new Set(revealedKeys);
    if (revealedKeys.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setRevealedKeys(newSet);
  };

  const formatDate = (date: string) => {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const isExpired = (expiresAt: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isCurrentPath = (href: string) => {
    return window.location.pathname === href;
  };

  const permissionLabels: Record<string, string> = {
    read: 'Lecture',
    write: 'Écriture',
    admin: 'Admin'
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
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Clés API</h2>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                  >
                    <Plus className="w-3 h-3" />
                    Nouvelle clé
                  </button>
                </div>
              </div>

              {/* Keys List */}
              {keys.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune clé API</p>
                  <p className="text-xs text-gray-400 mt-1">Créez une clé pour accéder à l'API publique</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {keys.map((key) => {
                    const expired = isExpired(key.expires_at);
                    return (
                      <div key={key.id} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{key.name}</h3>
                              {!key.is_active && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactive</span>
                              )}
                              {expired && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Expirée</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {revealedKeys.has(key.id) ? key.key : '••••••••••••••••'}
                              </code>
                              <button
                                onClick={() => toggleKeyVisibility(key.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {revealedKeys.has(key.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => copyKey(key.key)}
                                className="text-gray-400 hover:text-blue-600"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {key.permissions.map(p => (
                                <span key={p} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {permissionLabels[p] || p}
                                </span>
                              ))}
                              <span className="text-xs text-gray-500">
                                Rate limit: {key.rate_limit}/min
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                              <span>Créée le {formatDate(key.created_at)}</span>
                              {key.last_used_at && (
                                <span>Dernière utilisation: {formatDate(key.last_used_at)}</span>
                              )}
                              {key.expires_at && (
                                <span>Expire le {formatDate(key.expires_at)}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteKey(key.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Nouvelle clé API
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyValue(null);
                  setNewKeyName('');
                  setNewKeyPermissions(['read']);
                  setNewKeyRateLimit(100);
                  setNewKeyExpiresIn(30);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newKeyValue ? (
              <div>
                <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    ✓ Clé API créée avec succès
                  </p>
                  <p className="text-xs text-green-700 mb-2">
                    Conservez cette clé précieusement. Elle ne sera plus affichée.
                  </p>
                  <code className="block bg-white p-2 rounded text-sm font-mono break-all">
                    {newKeyValue}
                  </code>
                </div>
                <button
                  onClick={() => copyKey(newKeyValue)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copier la clé
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="API Production, Test, etc."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.includes('read')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKeyPermissions([...newKeyPermissions, 'read']);
                            } else {
                              setNewKeyPermissions(newKeyPermissions.filter(p => p !== 'read'));
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">Lecture (GET)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.includes('write')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKeyPermissions([...newKeyPermissions, 'write']);
                            } else {
                              setNewKeyPermissions(newKeyPermissions.filter(p => p !== 'write'));
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">Écriture (POST, PUT, DELETE)</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate limit</label>
                    <select
                      value={newKeyRateLimit}
                      onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={50}>50 requêtes/minute</option>
                      <option value={100}>100 requêtes/minute</option>
                      <option value={250}>250 requêtes/minute</option>
                      <option value={500}>500 requêtes/minute</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration</label>
                    <select
                      value={newKeyExpiresIn}
                      onChange={(e) => setNewKeyExpiresIn(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>Jamais</option>
                      <option value={7}>7 jours</option>
                      <option value={30}>30 jours</option>
                      <option value={90}>90 jours</option>
                      <option value={365}>1 an</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={createKey}
                    disabled={creating || !newKeyName.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Créer
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}