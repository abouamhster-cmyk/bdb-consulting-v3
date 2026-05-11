'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ParamsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [postsCount, setPostsCount] = useState(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [objectives, setObjectives] = useState('');
  const [brandTone, setBrandTone] = useState('professionnel');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'instagram', 'facebook', 'twitter']);

  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(nextMonth.toISOString().split('T')[0]);
    
    loadExistingParams();
  }, []);

  const loadExistingParams = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('generation_params')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setPostsCount(data.posts_count || 30);
      setStartDate(data.start_date || '');
      setEndDate(data.end_date || '');
      setObjectives(data.objectives || '');
      setBrandTone(data.brand_tone || 'professionnel');
      setSelectedPlatforms(data.selected_platforms || ['linkedin', 'instagram', 'facebook', 'twitter']);
    }
  };

  const saveGenerationParams = async (userId: string, params: any) => {
    // Vérifier si une config existe déjà
    const { data: existingConfig } = await supabase
      .from('generation_params')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingConfig) {
      // Mise à jour
      return await supabase
        .from('generation_params')
        .update({
          ...params,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Insertion
      return await supabase
        .from('generation_params')
        .insert({
          ...params,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    
    const { error } = await saveGenerationParams(user.id, {
      posts_count: postsCount,
      start_date: startDate,
      end_date: endDate,
      objectives: objectives,
      brand_tone: brandTone,
      selected_platforms: selectedPlatforms
    });
    
    if (error) {
      console.error('Erreur:', error);
      alert('Erreur: ' + (error.message || 'Erreur lors de la sauvegarde'));
    } else {
      router.push('/competitive-intelligence');
    }
    
    setLoading(false);
  };

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: '🔗' },
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'twitter', name: 'Twitter', icon: '🐦' }
  ];

  const tones = [
    { value: 'professionnel', label: '👔 Professionnel' },
    { value: 'décontracté', label: '😊 Décontracté' },
    { value: 'humoristique', label: '😂 Humoristique' },
    { value: 'inspirant', label: '✨ Inspirant' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres de campagne</h1>
          <p className="text-gray-500 mt-2">Définissez le cadre de votre campagne</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
          {/* Nombre de posts */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">📊 Nombre de posts</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="60"
                value={postsCount}
                onChange={(e) => setPostsCount(parseInt(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-2xl font-bold text-blue-600 w-16 text-center">{postsCount}</span>
            </div>
          </div>
          
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">📅 Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">📅 Date de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Objectifs */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">🎯 Objectifs</label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Ex: Augmenter l'engagement de 30%, générer 50 leads..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 h-24 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Ton */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">🎭 Ton de la campagne</label>
            <div className="flex flex-wrap gap-2">
              {tones.map(tone => (
                <button
                  key={tone.value}
                  onClick={() => setBrandTone(tone.value)}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    brandTone === tone.value
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Plateformes */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">📱 Plateformes</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => {
                    if (selectedPlatforms.includes(platform.id)) {
                      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                    } else {
                      setSelectedPlatforms([...selectedPlatforms, platform.id]);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {platform.icon} {platform.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => router.push('/setup')}
              className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}