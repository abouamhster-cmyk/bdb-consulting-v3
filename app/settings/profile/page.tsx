'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Building2, Briefcase, Phone, Globe, 
  Save, Camera, Calendar, MapPin, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfile {
  first_name: string;
  last_name: string;
  company_name: string;
  position: string;
  phone: string;
  website: string;
  industry: string;
  city: string;
  country: string;
  bio: string;
  avatar_url: string;
  marketing_consent: boolean;
}

const industries = [
  'Technologie / SaaS',
  'Marketing / Communication',
  'Conseil / Consulting',
  'E-commerce / Retail',
  'Finance / Assurances',
  'Santé / Médical',
  'Éducation / Formation',
  'Immobilier',
  'Automobile',
  'Agriculture',
  'Art / Culture',
  'Autre'
];

const countries = [
  'Bénin',
  "Côte d'Ivoire",
  'Sénégal',
  'Cameroun',
  'Togo',
  'Burkina Faso',
  'Mali',
  'Niger',
  'France',
  'Autre'
];

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    first_name: '',
    last_name: '',
    company_name: '',
    position: '',
    phone: '',
    website: '',
    industry: '',
    city: '',
    country: '',
    bio: '',
    avatar_url: '',
    marketing_consent: false
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    
    setEmail(user.email || '');
    setMemberSince(new Date(user.created_at).toLocaleDateString('fr-FR'));
    
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileData) {
      setProfile({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        company_name: profileData.company_name || '',
        position: profileData.position || '',
        phone: profileData.phone || '',
        website: profileData.website || '',
        industry: profileData.industry || '',
        city: profileData.city || '',
        country: profileData.country || '',
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
        marketing_consent: profileData.marketing_consent || false
      });
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2MB");
      return;
    }
    
    setUploadingAvatar(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const fileName = `avatars/${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);
    
    if (uploadError) {
      toast.error('Erreur upload: ' + uploadError.message);
      setUploadingAvatar(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    const { error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      });
    
    if (updateError) {
      toast.error('Erreur mise à jour profil');
    } else {
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Photo mise à jour');
    }
    
    setUploadingAvatar(false);
  };

  const updateProfile = async () => {
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...profile,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Profil mis à jour');
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
      </div>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo de profil</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-blue-600" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition">
                <Camera className="w-3.5 h-3.5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <div>
              <p className="text-sm text-gray-500">JPG, PNG ou GIF. Max 2MB.</p>
              {uploadingAvatar && <p className="text-xs text-blue-600 mt-1">Upload en cours...</p>}
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  placeholder="Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  placeholder="+229 97 12 34 56"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'inscription</label>
                <input
                  type="text"
                  value={memberSince}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={1}
                  placeholder="Quelques mots sur vous..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informations professionnelles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Informations professionnelles</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                <input
                  type="text"
                  value={profile.company_name}
                  onChange={(e) => setProfile({...profile, company_name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  placeholder="BDB Consulting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                <input
                  type="text"
                  value={profile.position}
                  onChange={(e) => setProfile({...profile, position: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  placeholder="CEO, Marketing Manager..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile({...profile, website: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                <select
                  value={profile.industry}
                  onChange={(e) => setProfile({...profile, industry: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez un secteur</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Localisation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Localisation</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({...profile, city: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  placeholder="Cotonou"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                <select
                  value={profile.country}
                  onChange={(e) => setProfile({...profile, country: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                >
                  <option value="">Sélectionnez un pays</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Préférences */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Préférences</h2>
          </div>
          <div className="p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.marketing_consent}
                onChange={(e) => setProfile({...profile, marketing_consent: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Recevoir des actualités et offres</span>
                <p className="text-xs text-gray-500">Informations sur les nouvelles fonctionnalités et promotions</p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={updateProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder les modifications
          </button>
        </div>
      </div>
    </div>
  );
}