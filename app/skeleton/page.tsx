'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Kanban, Sparkles, CheckCircle, ArrowLeft, ArrowRight, 
  Calendar, MessageSquare, Target, Tag, Loader2, AlertCircle,
  TrendingUp, Clock, Zap, Edit2, Save, X, RefreshCw
} from 'lucide-react';

interface Post {
  id: string;
  day: number;
  date?: string;
  title: string;
  hook: string;
  cta: string;
  content_type: string;
  event_name?: string;
  status_skeleton: string;
}

export default function SkeletonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [validatedIds, setValidatedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState({ title: '', hook: '', cta: '', content_type: '' });
  const [saving, setSaving] = useState(false);

  const shouldAutoGenerate = searchParams.get('generate') === 'true';

useEffect(() => {
  const init = async () => {
    await loadExistingSkeleton();
    // Génération UNIQUEMENT si on vient de la veille ET qu'il n'y a AUCUN post
    if (shouldAutoGenerate && posts.length === 0 && !generating && !loading) {
      await generateSkeleton();
    }
  };
  init();
}, [shouldAutoGenerate, posts.length]);

  const loadExistingSkeleton = async () => {
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('post_skeleton')
      .select('*')
      .eq('user_id', user.id)
      .order('day', { ascending: true });
    
    if (error) {
      console.error('Erreur chargement:', error);
      setError('Erreur lors du chargement des données');
    }
    
    if (data && data.length > 0) {
      setPosts(data);
      const validated = data.filter(p => p.status_skeleton === 'completed').map(p => p.id);
      setValidatedIds(validated);
    }
    setLoading(false);
  };

  const generateSkeleton = async () => {
    setGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Préparation de la génération...');
    setError(null);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError('Utilisateur non connecté');
      setGenerating(false);
      return;
    }

    try {
      setGenerationStatus('📡 Récupération de votre configuration...');
      setGenerationProgress(10);
      
      const response = await fetch('/api/generate-skeleton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      setGenerationProgress(50);
      setGenerationStatus('🤖 Intelligence Artificielle à l\'œuvre...');
      
      const result = await response.json();
      
      setGenerationProgress(80);
      setGenerationStatus('💾 Sauvegarde des posts...');
      
      if (result.success && result.calendar) {
        await loadExistingSkeleton();
        setGenerationProgress(100);
        setGenerationStatus('✅ Génération terminée !');
        setSuccessMessage(`🎉 ${result.count} posts générés avec succès !`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Erreur lors de la génération');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion au serveur');
    }
    
    setGenerating(false);
    setTimeout(() => setGenerationProgress(0), 1000);
  };

  const validatePost = async (id: string) => {
    const { error } = await supabase
      .from('post_skeleton')
      .update({ status_skeleton: 'completed', updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (!error) {
      setPosts(posts.map(p => p.id === id ? { ...p, status_skeleton: 'completed' } : p));
      setValidatedIds([...validatedIds, id]);
      setSuccessMessage('Post validé !');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const validateAll = async () => {
    for (const post of posts) {
      if (post.status_skeleton !== 'completed') {
        await supabase
          .from('post_skeleton')
          .update({ status_skeleton: 'completed', updated_at: new Date().toISOString() })
          .eq('id', post.id);
      }
    }
    setPosts(posts.map(p => ({ ...p, status_skeleton: 'completed' })));
    setValidatedIds(posts.map(p => p.id));
    setSuccessMessage('Tous les posts ont été validés !');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const openEditModal = (post: Post) => {
    setEditingPost(post);
    setEditForm({
      title: post.title,
      hook: post.hook,
      cta: post.cta,
      content_type: post.content_type
    });
  };

  const saveEdit = async () => {
    if (!editingPost) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('post_skeleton')
      .update({
        title: editForm.title,
        hook: editForm.hook,
        cta: editForm.cta,
        content_type: editForm.content_type,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingPost.id);
    
    if (!error) {
      setPosts(posts.map(p => 
        p.id === editingPost.id 
          ? { ...p, 
              title: editForm.title, 
              hook: editForm.hook, 
              cta: editForm.cta,
              content_type: editForm.content_type
            }
          : p
      ));
      setEditingPost(null);
      setSuccessMessage('Post modifié avec succès !');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
    setSaving(false);
  };

  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'éducatif': 'bg-blue-100 text-blue-700',
      'storytelling': 'bg-purple-100 text-purple-700',
      'promotionnel': 'bg-green-100 text-green-700',
      'inspirationnel': 'bg-amber-100 text-amber-700',
      'témoignage': 'bg-pink-100 text-pink-700',
      'behind-the-scenes': 'bg-indigo-100 text-indigo-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getContentTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      'éducatif': <TrendingUp className="w-3 h-3" />,
      'storytelling': <MessageSquare className="w-3 h-3" />,
      'promotionnel': <Zap className="w-3 h-3" />,
      'inspirationnel': <Sparkles className="w-3 h-3" />,
      'témoignage': <CheckCircle className="w-3 h-3" />,
      'behind-the-scenes': <Calendar className="w-3 h-3" />
    };
    return icons[type] || <Tag className="w-3 h-3" />;
  };

  const contentTypes = [
    { value: 'éducatif', label: '📚 Éducatif' },
    { value: 'storytelling', label: '📖 Storytelling' },
    { value: 'promotionnel', label: '🎯 Promotionnel' },
    { value: 'inspirationnel', label: '✨ Inspirationnel' },
    { value: 'témoignage', label: '💬 Témoignage' },
    { value: 'behind-the-scenes', label: '🎬 Coulisses' }
  ];

  const ProgressBar = () => (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {generationStatus}
        </span>
        <span className="font-medium text-blue-600">{Math.round(generationProgress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${generationProgress}%` }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Kanban className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Squelette éditorial</h1>
          <p className="text-gray-500 mt-2">
            {generating ? 'Génération en cours...' : 'Validez la structure de vos posts générés par IA'}
          </p>
        </div>

        {/* Barre de progression */}
        {generating && <ProgressBar />}

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

        {posts.length === 0 && !generating ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Prêt à générer votre calendrier</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              L'IA va analyser votre configuration et créer un planning éditorial personnalisé
            </p>
            <button
              onClick={generateSkeleton}
              disabled={generating}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer le squelette IA
                </>
              )}
            </button>
          </div>
        ) : posts.length > 0 ? (
          <>
            {/* Barre de validation */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">
                  {validatedIds.length}/{posts.length} validés
                </span>
                {validatedIds.length === posts.length && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Planning complet
                  </span>
                )}
              </div>
              {validatedIds.length < posts.length && (
                <button 
                  onClick={validateAll} 
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-green-700 transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Tout valider
                </button>
              )}
            </div>

            {/* Liste des posts */}
            <div className="space-y-3 mb-6">
              {posts.map(post => (
                <div 
                  key={post.id} 
                  className={`bg-white rounded-xl shadow-sm border p-4 transition hover:shadow-md ${
                    post.status_skeleton === 'completed' ? 'border-green-500 bg-green-50/30' : 'border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Jour {post.day}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getContentTypeColor(post.content_type)}`}>
                        {getContentTypeIcon(post.content_type)}
                        {post.content_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openEditModal(post)}
                        className="text-gray-400 hover:text-blue-600 transition p-1"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {post.status_skeleton === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 text-lg mt-2 flex items-start gap-1">
                    <Tag className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <span>{post.title}</span>
                  </h3>
                  
                  <p className="text-gray-600 text-sm mt-1 flex items-start gap-1">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{post.hook}</span>
                  </p>
                  
                  <p className="text-blue-600 text-sm mt-2 flex items-start gap-1 font-medium">
                    <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{post.cta}</span>
                  </p>
                  
                  {post.status_skeleton !== 'completed' && (
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => validatePost(post.id)} 
                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Valider
                      </button>
                      <button 
                        onClick={() => openEditModal(post)} 
                        className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Modifier
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => router.push('/competitive-intelligence')}
                className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <button
                onClick={() => router.push('/campaign-vertical?generate=true')}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4" />
                Générer les contenus
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* Modal d'édition */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Modifier le post
              </h3>
              <button 
                onClick={() => setEditingPost(null)}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de contenu</label>
                <select
                  value={editForm.content_type}
                  onChange={(e) => setEditForm({...editForm, content_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {contentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accroche</label>
                <textarea
                  value={editForm.hook}
                  onChange={(e) => setEditForm({...editForm, hook: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA</label>
                <input
                  type="text"
                  value={editForm.cta}
                  onChange={(e) => setEditForm({...editForm, cta: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={saveEdit} 
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Sauvegarder
              </button>
              <button 
                onClick={() => setEditingPost(null)} 
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