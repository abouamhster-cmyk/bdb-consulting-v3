'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, Lock, Key, Eye, EyeOff, Save, Loader2,
  CreditCard, Bell, Users, Webhook, Palette, Database, 
  Activity, User, CheckCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const menuItems = [
  { name: 'Profil', href: '/settings/profile', icon: User },
  { name: 'Sécurité', href: '/settings/security', icon: Shield, current: true },
  { name: 'Facturation', href: '/settings/billing', icon: CreditCard },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Équipe', href: '/settings/team', icon: Users },
  { name: 'Clés API', href: '/settings/api-keys', icon: Key },
  { name: 'Intégrations', href: '/settings/integrations', icon: Webhook },
  { name: 'Personnalisation', href: '/settings/branding', icon: Palette },
  { name: 'Données', href: '/settings/data', icon: Database },
  { name: 'Activité', href: '/settings/activity', icon: Activity }
];

export default function SecurityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setLoading(false);
  };

  const updatePassword = async () => {
    setError('');
    setSuccess('');
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setSaving(true);
    
    // Vérifier le mot de passe actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setError('Utilisateur non trouvé');
      setSaving(false);
      return;
    }
    
    // Tenter de se reconnecter avec l'ancien mot de passe pour vérifier
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.currentPassword
    });
    
    if (signInError) {
      setError('Mot de passe actuel incorrect');
      setSaving(false);
      return;
    }
    
    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordForm.newPassword
    });
    
    if (updateError) {
      setError('Erreur: ' + updateError.message);
    } else {
      setSuccess('Mot de passe modifié avec succès !');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Mot de passe mis à jour');
    }
    
    setSaving(false);
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
            {/* Changer mot de passe */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h2>
                </div>
              </div>
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                        placeholder="Votre mot de passe actuel"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                        placeholder="Minimum 6 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Retapez votre nouveau mot de passe"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={updatePassword}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Modifier le mot de passe
                  </button>
                </div>
              </div>
            </div>
            
            {/* Conseils de sécurité */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Conseils de sécurité</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Utilisez un mot de passe unique, jamais utilisé ailleurs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Activez l'authentification à deux facteurs (bientôt disponible)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Ne partagez jamais vos identifiants
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Déconnectez-vous des appareils publics
                </li>
              </ul>
            </div>
            
            {/* Sessions actives */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Sessions actives</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500">
                  Vous êtes actuellement connecté sur cet appareil.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Pour vous déconnecter de tous les appareils, modifiez votre mot de passe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}