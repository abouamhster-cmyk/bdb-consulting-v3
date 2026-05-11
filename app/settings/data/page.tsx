'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Database, Download, Trash2, AlertTriangle, 
  Shield, CreditCard, Bell, Users, Key,
  Webhook, Palette, Activity, Loader2, CheckCircle,
  FileText, Image, Video, Calendar, Mail, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportData {
  user: any;
  profile: any;
  config: any;
  params: any;
  campaigns: any[];
  posts: any[];
  insights: any[];
  subscriptions: any;
  invoices: any[];
  activity_logs: any[];
}

const menuItems = [
  { name: 'Profil', href: '/settings', icon: Shield },
  { name: 'Sécurité', href: '/settings/security', icon: Shield },
  { name: 'Facturation', href: '/settings/billing', icon: CreditCard },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Équipe', href: '/settings/team', icon: Users },
  { name: 'API', href: '/settings/api-keys', icon: Key },
  { name: 'Intégrations', href: '/settings/integrations', icon: Webhook },
  { name: 'Personnalisation', href: '/settings/branding', icon: Palette },
  { name: 'Données', href: '/settings/data', icon: Database, current: true },
  { name: 'Activité', href: '/settings/activity', icon: Activity }
];

export default function DataPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dataStats, setDataStats] = useState({
    postsCount: 0,
    imagesCount: 0,
    videosCount: 0,
    campaignsCount: 0,
    insightsCount: 0
  });

  useEffect(() => {
    loadDataStats();
  }, []);

  const loadDataStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    // Compter les données
    const { count: postsCount } = await supabase
      .from('post_skeleton')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: imagesCount } = await supabase
      .from('generated_images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: videosCount } = await supabase
      .from('generated_videos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: campaignsCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: insightsCount } = await supabase
      .from('competitive_insights')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setDataStats({
      postsCount: postsCount || 0,
      imagesCount: imagesCount || 0,
      videosCount: videosCount || 0,
      campaignsCount: campaignsCount || 0,
      insightsCount: insightsCount || 0
    });

    setLoading(false);
  };

  const exportData = async () => {
    setExporting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer toutes les données
      const [
        profile,
        config,
        params,
        campaigns,
        posts,
        insights,
        subscriptions,
        invoices,
        activityLogs
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('company_config').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('generation_params').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('campaigns').select('*').eq('user_id', user.id),
        supabase.from('post_skeleton').select('*').eq('user_id', user.id),
        supabase.from('competitive_insights').select('*').eq('user_id', user.id),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('invoices').select('*').eq('user_id', user.id),
        supabase.from('activity_logs').select('*').eq('user_id', user.id)
      ]);

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile: profile.data,
        company_config: config.data,
        generation_params: params.data,
        campaigns: campaigns.data,
        posts: posts.data,
        insights: insights.data,
        subscriptions: subscriptions.data,
        invoices: invoices.data,
        activity_logs: activityLogs.data,
        export_date: new Date().toISOString(),
        version: '1.0'
      };

      // Créer le fichier JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bdb-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Données exportées avec succès');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    }
    
    setExporting(false);
  };

  const deleteAccount = async () => {
    if (confirmDelete !== 'SUPPRIMER') {
      toast.error('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    setDeleting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Supprimer toutes les données de l'utilisateur
      await supabase.from('user_profiles').delete().eq('user_id', user.id);
      await supabase.from('company_config').delete().eq('user_id', user.id);
      await supabase.from('generation_params').delete().eq('user_id', user.id);
      await supabase.from('campaigns').delete().eq('user_id', user.id);
      await supabase.from('post_skeleton').delete().eq('user_id', user.id);
      await supabase.from('competitive_insights').delete().eq('user_id', user.id);
      await supabase.from('subscriptions').delete().eq('user_id', user.id);
      await supabase.from('invoices').delete().eq('user_id', user.id);
      await supabase.from('activity_logs').delete().eq('user_id', user.id);
      await supabase.from('api_keys').delete().eq('user_id', user.id);
      
      // Supprimer le compte utilisateur
      await supabase.auth.admin.deleteUser(user.id);
      
      toast.success('Compte supprimé avec succès');
      
      // Rediriger vers la page d'accueil
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression du compte');
    }
    
    setDeleting(false);
    setShowDeleteModal(false);
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
            {/* Statistiques des données */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Vos données</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{dataStats.postsCount}</p>
                    <p className="text-xs text-gray-500">Posts</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Image className="w-5 h-5 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{dataStats.imagesCount}</p>
                    <p className="text-xs text-gray-500">Images</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Video className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{dataStats.videosCount}</p>
                    <p className="text-xs text-gray-500">Vidéos</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{dataStats.campaignsCount}</p>
                    <p className="text-xs text-gray-500">Campagnes</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{dataStats.insightsCount}</p>
                    <p className="text-xs text-gray-500">Insights</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Exporter mes données</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Téléchargez toutes vos données au format JSON. Cela inclut vos profils, campagnes, posts, images, vidéos, factures et historiques d'activité.
                </p>
                <button
                  onClick={exportData}
                  disabled={exporting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {exporting ? 'Export en cours...' : 'Exporter mes données'}
                </button>
                <p className="text-xs text-gray-400 mt-3">
                  Conformément au RGPD, vous avez le droit d'accéder à toutes vos données personnelles.
                </p>
              </div>
            </div>

            {/* Delete Account Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-red-900">Zone de danger</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Supprimer mon compte</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
                    >
                      Supprimer mon compte
                    </button>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal confirmation suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Supprimer le compte
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 rounded-lg p-4 mb-4 border border-red-200">
              <p className="text-sm text-red-800">
                ⚠️ Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Tapez <strong className="text-red-600">SUPPRIMER</strong> pour confirmer.
            </p>

            <input
              type="text"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />

            <div className="flex gap-3">
              <button
                onClick={deleteAccount}
                disabled={deleting || confirmDelete !== 'SUPPRIMER'}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
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