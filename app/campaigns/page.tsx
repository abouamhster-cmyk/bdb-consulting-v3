'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  FolderKanban, Plus, Trash2, ExternalLink, 
  Calendar, CheckCircle, Clock, X, Copy,
  Edit2, Search, Loader2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  posts_count: number;
  posts_validated: number;
  posts_published: number;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndCampaigns();
  }, []);

  const loadUserAndCampaigns = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUserId(user.id);
    await loadCampaigns();
  };

  const loadCampaigns = async () => {
    if (!userId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erreur chargement campagnes');
      setLoading(false);
      return;
    }
    
    if (data) {
      const campaignsWithCounts = await Promise.all(
        data.map(async (campaign) => {
          const { count: total } = await supabase
            .from('post_skeleton')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id);
          
          const { count: validated } = await supabase
            .from('post_skeleton')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('status_skeleton', 'completed');
          
          const { count: published } = await supabase
            .from('post_skeleton')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('status_scheduled', 'completed');
          
          return {
            ...campaign,
            posts_count: total || 0,
            posts_validated: validated || 0,
            posts_published: published || 0
          };
        })
      );
      setCampaigns(campaignsWithCounts);
    }
    setLoading(false);
  };

  const refreshCampaigns = async () => {
    setRefreshing(true);
    await loadCampaigns();
    toast.success('Campagnes actualisées');
    setRefreshing(false);
  };

  const createCampaign = async () => {
    if (!newCampaign.name.trim()) {
      toast.error('Veuillez donner un nom à la campagne');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        name: newCampaign.name,
        description: newCampaign.description,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      toast.error('Erreur: ' + error.message);
      setLoading(false);
    } else {
      toast.success('Campagne créée');
      setShowCreateModal(false);
      setNewCampaign({ name: '', description: '' });
      await loadCampaigns();
      router.push(`/campaign-vertical?campaignId=${data.id}`);
    }
    setLoading(false);
  };

  const updateCampaign = async () => {
    if (!editingCampaign) return;
    if (!editingCampaign.name.trim()) {
      toast.error('Nom requis');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('campaigns')
      .update({
        name: editingCampaign.name,
        description: editingCampaign.description,
        status: editingCampaign.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingCampaign.id);

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Campagne modifiée');
      setEditingCampaign(null);
      await loadCampaigns();
    }
    setLoading(false);
  };

  const deleteCampaign = async (campaign: Campaign) => {
    if (!confirm(`Supprimer la campagne "${campaign.name}" ? Tous les posts associés seront également supprimés.`)) return;

    setLoading(true);
    
    // Supprimer les posts associés
    await supabase
      .from('post_skeleton')
      .delete()
      .eq('campaign_id', campaign.id);

    // Supprimer la campagne
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaign.id);

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Campagne supprimée');
      await loadCampaigns();
    }
    setLoading(false);
  };

  const duplicateCampaign = async (campaign: Campaign) => {
    setLoading(true);
    
    // Récupérer les posts originaux
    const { data: originalPosts } = await supabase
      .from('post_skeleton')
      .select('*')
      .eq('campaign_id', campaign.id);

    // Créer la nouvelle campagne
    const { data: newCamp, error: campError } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        name: `${campaign.name} (copie)`,
        description: campaign.description,
        status: 'draft'
      })
      .select()
      .single();

    if (campError) {
      toast.error('Erreur duplication');
      setLoading(false);
      return;
    }

    // Dupliquer les posts
    if (originalPosts && originalPosts.length > 0) {
      const newPosts = originalPosts.map(post => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, created_at, ...rest } = post;
        return {
          ...rest,
          campaign_id: newCamp.id,
          user_id: userId,
          status_skeleton: 'pending',
          status_text: 'pending',
          status_image_linkedin: 'pending',
          status_image_instagram: 'pending',
          status_image_facebook: 'pending',
          status_image_twitter: 'pending',
          status_video: 'pending',
          status_scheduled: 'pending'
        };
      });

      await supabase
        .from('post_skeleton')
        .insert(newPosts);
    }

    toast.success('Campagne dupliquée');
    await loadCampaigns();
    setLoading(false);
  };

  const activateCampaign = async (campaign: Campaign) => {
    setLoading(true);
    const { error } = await supabase
      .from('campaigns')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', campaign.id);
    
    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Campagne activée');
      await loadCampaigns();
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Brouillon</span>;
      case 'active':
        return <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'completed':
        return <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Terminée</span>;
      case 'archived':
        return <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Archivée</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const getProgressPercentage = (campaign: Campaign) => {
    if (campaign.posts_count === 0) return 0;
    return Math.round((campaign.posts_validated / campaign.posts_count) * 100);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (statusFilter !== 'all' && campaign.status !== statusFilter) return false;
    if (searchTerm && !campaign.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
            </div>
            <p className="text-gray-500 ml-14">Gérez vos campagnes marketing</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshCampaigns}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              Nouvelle campagne
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillons</option>
            <option value="active">Actives</option>
            <option value="completed">Terminées</option>
            <option value="archived">Archivées</option>
          </select>
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune campagne</h3>
            <p className="text-gray-500 mb-6">Créez votre première campagne pour commencer</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition"
            >
              Créer une campagne
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-lg">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{campaign.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingCampaign(campaign)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition rounded-lg"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => duplicateCampaign(campaign)}
                        className="p-1.5 text-gray-400 hover:text-green-600 transition rounded-lg"
                        title="Dupliquer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCampaign(campaign)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progression */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progression</span>
                      <span>{getProgressPercentage(campaign)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(campaign)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-semibold text-gray-900">{campaign.posts_count}</p>
                      <p className="text-xs text-gray-500">Posts</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-semibold text-gray-900">{campaign.posts_validated}</p>
                      <p className="text-xs text-gray-500">Validés</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-semibold text-gray-900">{campaign.posts_published}</p>
                      <p className="text-xs text-gray-500">Publiés</p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>Créée le {new Date(campaign.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/campaign-vertical?campaignId=${campaign.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir
                    </button>
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => activateCampaign(campaign)}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition"
                      >
                        Activer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Nouvelle campagne
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  placeholder="Ex: Campagne été 2026"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                  placeholder="Objectifs de cette campagne..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={createCampaign}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                Créer
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Édition */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Modifier la campagne
              </h3>
              <button
                onClick={() => setEditingCampaign(null)}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={editingCampaign.name}
                  onChange={(e) => setEditingCampaign({...editingCampaign, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingCampaign.description}
                  onChange={(e) => setEditingCampaign({...editingCampaign, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={editingCampaign.status}
                  onChange={(e) => setEditingCampaign({...editingCampaign, status: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Brouillon</option>
                  <option value="active">Active</option>
                  <option value="completed">Terminée</option>
                  <option value="archived">Archivée</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={updateCampaign}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => setEditingCampaign(null)}
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
