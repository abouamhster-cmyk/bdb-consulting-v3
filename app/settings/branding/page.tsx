'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Palette, Upload, Save, Loader2, CheckCircle,
  Shield, CreditCard, Bell, Users, Key,
  Webhook, Activity, Database, X, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BrandingSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  company_name: string;
  logo_url: string;
  favicon_url: string;
  custom_css: string;
}

const menuItems = [
  { name: 'Profil', href: '/settings', icon: Shield },
  { name: 'Sécurité', href: '/settings/security', icon: Shield },
  { name: 'Facturation', href: '/settings/billing', icon: CreditCard },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Équipe', href: '/settings/team', icon: Users },
  { name: 'API', href: '/settings/api-keys', icon: Key },
  { name: 'Intégrations', href: '/settings/integrations', icon: Webhook },
  { name: 'Personnalisation', href: '/settings/branding', icon: Palette, current: true },
  { name: 'Données', href: '/settings/data', icon: Database },
  { name: 'Activité', href: '/settings/activity', icon: Activity }
];

const colorPresets = [
  { name: 'Bleu', value: '#2563eb' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Vert', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Gris', value: '#6b7280' }
];

export default function BrandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [settings, setSettings] = useState<BrandingSettings>({
    primary_color: '#2563eb',
    secondary_color: '#4f46e5',
    accent_color: '#8b5cf6',
    company_name: '',
    logo_url: '',
    favicon_url: '',
    custom_css: ''
  });
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    // Récupérer l'équipe
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (team) {
      setTeamId(team.id);
      
      const { data: branding } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('team_id', team.id)
        .maybeSingle();

      if (branding) {
        setSettings({
          primary_color: branding.primary_color || '#2563eb',
          secondary_color: branding.secondary_color || '#4f46e5',
          accent_color: branding.accent_color || '#8b5cf6',
          company_name: branding.company_name || '',
          logo_url: branding.logo_url || '',
          favicon_url: branding.favicon_url || '',
          custom_css: branding.custom_css || ''
        });
        setPreviewLogo(branding.logo_url);
      }
    }

    setLoading(false);
  };

  const uploadImage = async (file: File, type: 'logo' | 'favicon') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${type}/${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('branding')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Erreur upload: ' + uploadError.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('branding')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2MB');
      return;
    }

    setUploadingLogo(true);
    const url = await uploadImage(file, 'logo');
    if (url) {
      setSettings(prev => ({ ...prev, logo_url: url }));
      setPreviewLogo(url);
      toast.success('Logo uploadé');
    }
    setUploadingLogo(false);
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 500 * 1024) {
      toast.error('Le favicon ne doit pas dépasser 500KB');
      return;
    }

    setUploadingFavicon(true);
    const url = await uploadImage(file, 'favicon');
    if (url) {
      setSettings(prev => ({ ...prev, favicon_url: url }));
      toast.success('Favicon uploadé');
    }
    setUploadingFavicon(false);
  };

  const saveBranding = async () => {
    if (!teamId) {
      toast.error('Aucune équipe trouvée');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('branding_settings')
      .upsert({
        team_id: teamId,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        accent_color: settings.accent_color,
        company_name: settings.company_name,
        logo_url: settings.logo_url,
        favicon_url: settings.favicon_url,
        custom_css: settings.custom_css,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Personnalisation sauvegardée');
      
      // Appliquer les couleurs immédiatement
      document.documentElement.style.setProperty('--primary', settings.primary_color);
      document.documentElement.style.setProperty('--secondary', settings.secondary_color);
    }

    setSaving(false);
  };

  const resetBranding = async () => {
    if (!confirm('Réinitialiser la personnalisation ?')) return;

    setSettings({
      primary_color: '#2563eb',
      secondary_color: '#4f46e5',
      accent_color: '#8b5cf6',
      company_name: '',
      logo_url: '',
      favicon_url: '',
      custom_css: ''
    });
    setPreviewLogo(null);
    toast.success('Personnalisation réinitialisée');
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
            {/* Logo Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Logo et identité</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo de l'entreprise</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border">
                        {previewLogo ? (
                          <img src={previewLogo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Palette className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <label className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Changer</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">PNG, JPG, SVG. Max 2MB.</p>
                  </div>

                  {/* Nom entreprise */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
                    <input
                      type="text"
                      value={settings.company_name}
                      onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                      placeholder="BDB Consulting"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Couleurs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Couleurs</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Couleur principale</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primary_color}
                        onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.primary_color}
                        onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Couleur secondaire</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.secondary_color}
                        onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.secondary_color}
                        onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Couleur d'accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.accent_color}
                        onChange={(e) => setSettings({...settings, accent_color: e.target.value})}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.accent_color}
                        onChange={(e) => setSettings({...settings, accent_color: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Palettes prédéfinies</label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setSettings({...settings, primary_color: preset.value})}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm transition hover:scale-110"
                        style={{ backgroundColor: preset.value }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Aperçu</h2>
              </div>
              <div className="p-6">
                <div 
                  className="p-6 rounded-xl"
                  style={{ backgroundColor: `${settings.primary_color}10`, border: `1px solid ${settings.primary_color}20` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {previewLogo ? (
                      <img src={previewLogo} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: settings.primary_color }}
                      >
                        B
                      </div>
                    )}
                    <span 
                      className="font-semibold text-lg"
                      style={{ color: settings.primary_color }}
                    >
                      {settings.company_name || 'BDB Consulting'}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      className="px-4 py-2 rounded-lg text-white transition"
                      style={{ backgroundColor: settings.primary_color }}
                    >
                      Bouton principal
                    </button>
                    <button 
                      className="px-4 py-2 rounded-lg text-white transition"
                      style={{ backgroundColor: settings.secondary_color }}
                    >
                      Bouton secondaire
                    </button>
                    <button 
                      className="px-4 py-2 rounded-lg text-white transition"
                      style={{ backgroundColor: settings.accent_color }}
                    >
                      Bouton accent
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3">
              <button
                onClick={resetBranding}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Réinitialiser
              </button>
              <button
                onClick={saveBranding}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
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