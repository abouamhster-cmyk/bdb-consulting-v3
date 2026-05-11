'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Eye, Plus, Trash2, CheckCircle, XCircle, ArrowRight, ArrowLeft, 
  Search, Target, AlertCircle, Lightbulb, TrendingUp, Calendar, 
  FileText, MessageCircle, BarChart3, Rocket, Loader2
} from 'lucide-react';

interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
  created_at?: string;
}

interface Insight {
  id: string;
  insight: string;
  category: string;
  suggested_actions?: string[];
  status: string;
  created_at?: string;
  validated_at?: string;
}

const categoryConfig: Record<string, { icon: any; color: string; label: string; bgColor: string }> = {
  timing: { icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-50', label: '⏰ Timing' },
  format: { icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-50', label: '📄 Format' },
  content: { icon: MessageCircle, color: 'text-green-600', bgColor: 'bg-green-50', label: '💬 Contenu' },
  seo: { icon: Search, color: 'text-orange-600', bgColor: 'bg-orange-50', label: '🔍 SEO' },
  engagement: { icon: TrendingUp, color: 'text-pink-600', bgColor: 'bg-pink-50', label: '📊 Engagement' },
  offre: { icon: Rocket, color: 'text-indigo-600', bgColor: 'bg-indigo-50', label: '🎯 Offre' }
};

export default function CompetitiveIntelligencePage() {
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [pendingInsights, setPendingInsights] = useState<Insight[]>([]);
  const [validatedInsights, setValidatedInsights] = useState<Insight[]>([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'website' });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Charger les sources
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('competitive_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (sourcesError) throw sourcesError;
      setSources(sourcesData || []);

      // Charger les insights en attente
      const { data: pendingData, error: pendingError } = await supabase
        .from('competitive_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (pendingError) throw pendingError;
      setPendingInsights(pendingData || []);

      // Charger les insights validés
      const { data: validatedData, error: validatedError } = await supabase
        .from('competitive_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'validated')
        .order('validated_at', { ascending: false });
      
      if (validatedError) throw validatedError;
      setValidatedInsights(validatedData || []);

    } catch (err) {
      console.error('Erreur chargement:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const addSource = async () => {
    if (!newSource.name || !newSource.url) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from('competitive_sources')
      .insert({ 
        user_id: user.id, 
        name: newSource.name, 
        url: newSource.url,
        type: newSource.type,
        created_at: new Date().toISOString()
      });

    if (error) {
      alert('Erreur: ' + error.message);
    } else {
      setShowAddSource(false);
      setNewSource({ name: '', url: '', type: 'website' });
      await loadData();
      setSuccessMessage('Source ajoutée avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setLoading(false);
  };

  const deleteSource = async (id: string) => {
    if (!confirm('Supprimer cette source ?')) return;
    
    const { error } = await supabase
      .from('competitive_sources')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await loadData();
      setSuccessMessage('Source supprimée');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const validateInsight = async (id: string) => {
    const { error } = await supabase
      .from('competitive_insights')
      .update({ 
        status: 'validated', 
        validated_at: new Date().toISOString() 
      })
      .eq('id', id);
    
    if (!error) {
      await loadData();
      setSuccessMessage('Insight validé !');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const rejectInsight = async (id: string) => {
    const { error } = await supabase
      .from('competitive_insights')
      .update({ status: 'rejected' })
      .eq('id', id);
    
    if (!error) {
      await loadData();
      setSuccessMessage('Insight rejeté');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const generateInsights = async () => {
    if (sources.length === 0) {
      alert('Ajoutez au moins une source avant de générer des insights');
      return;
    }

    setGenerating(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError('Utilisateur non connecté');
      setGenerating(false);
      return;
    }

    try {
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sources: sources
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.count > 0) {
        setSuccessMessage(`✨ ${result.count} nouveaux insights générés par IA !`);
        await loadData();
      } else {
        setError(result.error || 'Aucun insight généré');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion au serveur');
    }
    
    setGenerating(false);
  };

  const getCategoryInfo = (category: string) => {
    return categoryConfig[category] || { 
      icon: Lightbulb, 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-50',
      label: '💡 Général' 
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Veille concurrentielle</h1>
          <p className="text-gray-500 mt-2">Surveillez vos concurrents et obtenez des insights actionnables</p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Sources Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Sources surveillées</h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {sources.length}
              </span>
            </div>
            <button
              onClick={() => setShowAddSource(!showAddSource)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>

          {showAddSource && (
            <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
              <input
                type="text"
                placeholder="Nom du concurrent"
                value={newSource.name}
                onChange={(e) => setNewSource({...newSource, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="URL du site ou profil social"
                value={newSource.url}
                onChange={(e) => setNewSource({...newSource, url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button 
                  onClick={addSource} 
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition"
                >
                  Ajouter la source
                </button>
                <button 
                  onClick={() => setShowAddSource(false)} 
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {sources.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-400">Aucune source configurée</p>
              <p className="text-xs text-gray-400 mt-1">Ajoutez vos concurrents pour commencer</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {sources.map(source => (
                <div key={source.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{source.name}</span>
                    <p className="text-xs text-gray-400 truncate">{source.url}</p>
                  </div>
                  <button 
                    onClick={() => deleteSource(source.id)} 
                    className="p-1.5 text-gray-400 hover:text-red-600 transition rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {sources.length > 0 && (
            <button
              onClick={generateInsights}
              disabled={generating}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération IA en cours...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Générer des insights avec IA
                </>
              )}
            </button>
          )}
        </div>

        {/* Insights en attente */}
        {pendingInsights.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">À valider</h2>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pendingInsights.length} insight{pendingInsights.length > 1 ? 's' : ''} en attente
              </span>
            </div>
            <div className="space-y-3">
              {pendingInsights.map((insight) => {
                const categoryInfo = getCategoryInfo(insight.category);
                const CategoryIcon = categoryInfo.icon;
                return (
                  <div key={insight.id} className={`p-4 ${categoryInfo.bgColor} rounded-xl border border-amber-100`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryIcon className={`w-4 h-4 ${categoryInfo.color}`} />
                      <span className="text-xs font-medium text-gray-500">{categoryInfo.label}</span>
                    </div>
                    <p className="text-gray-800 text-sm mb-3">{insight.insight}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => validateInsight(insight.id)} 
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Valider
                      </button>
                      <button 
                        onClick={() => rejectInsight(insight.id)} 
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeter
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Insights validés */}
        {validatedInsights.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Insights validés</h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {validatedInsights.length} insight{validatedInsights.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {validatedInsights.map((insight) => {
                const categoryInfo = getCategoryInfo(insight.category);
                const CategoryIcon = categoryInfo.icon;
                return (
                  <div key={insight.id} className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-start gap-2">
                    <CategoryIcon className={`w-4 h-4 ${categoryInfo.color} mt-0.5 flex-shrink-0`} />
                    <p className="text-gray-800 text-sm">{insight.insight}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message vide */}
        {pendingInsights.length === 0 && validatedInsights.length === 0 && sources.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-500">Aucun insight pour le moment</p>
            <p className="text-xs text-gray-400 mt-1">Cliquez sur "Générer des insights avec IA" pour commencer</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push('/params')}
            className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          {/* 🔥 MODIFICATION ICI - Redirection vers skeleton avec paramètre generate=true */}
          <button
            onClick={() => router.push('/skeleton?generate=true')}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition"
          >
            Générer le squelette
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}