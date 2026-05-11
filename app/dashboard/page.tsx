  'use client';

  import { useState, useEffect } from 'react';
  import { supabase } from '@/lib/supabase';
  import { useRouter } from 'next/navigation';
  import Link from 'next/link';
  import { useSubscription } from '@/hooks/useSubscription';
  import { 
    LayoutDashboard, Building2, Calendar, Sparkles, 
    Search, TrendingUp, Users, Image, Video, 
    ArrowRight, CheckCircle, AlertCircle, RefreshCw,
    MessageSquare, CreditCard, Award, Clock, Zap,
    BarChart3, PieChart, Target, Eye, ThumbsUp,
    MessageCircle, Share2, Loader2, Gem, Rocket,
    Crown, Star, Activity, Bell, Settings, HelpCircle,
    Mail, FileText, PieChart as PieChartIcon, Calendar as CalendarIcon
  } from 'lucide-react';

  interface DashboardStats {
    configDone: boolean;
    paramsDone: boolean;
    skeletonCount: number;
    postsGenerated: number;
    totalImages: number;
    totalVideos: number;
    postsPublished: number;
  }

  export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
      configDone: false,
      paramsDone: false,
      skeletonCount: 0,
      postsGenerated: 0,
      totalImages: 0,
      totalVideos: 0,
      postsPublished: 0
    });
    
    const textTokens = useSubscription('text');
    const imageTokens = useSubscription('image');
    const videoTokens = useSubscription('video');

    useEffect(() => {
      loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        setLoading(false);
        return;
      }

      setUser(user);
      setUserName(user.email?.split('@')[0] || 'Utilisateur');

      const { data: config } = await supabase
        .from('company_config')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const { data: params } = await supabase
        .from('generation_params')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const { count: skeletonCount } = await supabase
        .from('post_skeleton')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      const { data: posts } = await supabase
        .from('post_skeleton')
        .select('text_linkedin, text_instagram, text_facebook, text_twitter')
        .eq('user_id', user.id);
      
      const postsGenerated = posts?.filter(p => 
        p.text_linkedin || p.text_instagram || p.text_facebook || p.text_twitter
      ).length || 0;

      const { count: publishedCount } = await supabase
        .from('post_skeleton')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status_scheduled', 'completed');

      setStats({
        configDone: config?.status === 'completed',
        paramsDone: !!params,
        skeletonCount: skeletonCount || 0,
        postsGenerated,
        totalImages: 0,
        totalVideos: 0,
        postsPublished: publishedCount || 0
      });
      
      setLoading(false);
    };

    const refreshData = async () => {
      setRefreshing(true);
      await loadDashboardData();
      setTimeout(() => setRefreshing(false), 1000);
    };

    const getPlanColor = () => {
      const plan = textTokens.plan;
      switch(plan) {
        case 'pro': return 'from-blue-600 to-indigo-600';
        case 'business': return 'from-purple-600 to-pink-600';
        default: return 'from-gray-600 to-gray-700';
      }
    };

    const getPlanIcon = () => {
      const plan = textTokens.plan;
      switch(plan) {
        case 'pro': return <Sparkles className="w-5 h-5" />;
        case 'business': return <Crown className="w-5 h-5" />;
        default: return <Gem className="w-5 h-5" />;
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Hero Section avec gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Bonjour, {userName} 👋</h1>
                    <p className="text-blue-100 mt-1">Prêt à booster votre stratégie marketing ?</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm flex items-center gap-2`}>
                  {getPlanIcon()}
                  <span className="font-medium capitalize">{textTokens.plan}</span>
                </div>
                <button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition backdrop-blur-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
          {/* Vague décorative */}
          <svg className="absolute bottom-0 left-0 right-0" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 32C840 34 960 38 1080 40C1200 42 1320 42 1380 42L1440 42L1440 60L1380 60C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60L0 60Z" fill="#f9fafb"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 -mt-8 relative z-10">
          {/* Cartes de tokens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Textes */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {textTokens.plan === 'pro' ? '100/mois' : textTokens.plan === 'business' ? '500/mois' : '30/mois'}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm mb-1">Textes IA</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-gray-900">{textTokens.usageText}</span>
                <span className="text-gray-400">/ {textTokens.limitText}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                  style={{ width: `${(textTokens.usageText / textTokens.limitText) * 100}%` }}
                />
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Image className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  {imageTokens.limitImage > 0 ? `${imageTokens.limitImage}/mois` : 'Non inclus'}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm mb-1">Images IA</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-gray-900">{imageTokens.usageImage}</span>
                <span className="text-gray-400">/ {imageTokens.limitImage}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                  style={{ width: `${imageTokens.limitImage > 0 ? (imageTokens.usageImage / imageTokens.limitImage) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Vidéos */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  {videoTokens.limitVideo > 0 ? `${videoTokens.limitVideo}/mois` : 'Non inclus'}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm mb-1">Vidéos IA</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-gray-900">{videoTokens.usageVideo}</span>
                <span className="text-gray-400">/ {videoTokens.limitVideo}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                  style={{ width: `${videoTokens.limitVideo > 0 ? (videoTokens.usageVideo / videoTokens.limitVideo) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grille des KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Posts</span>
              </div>
              <p className="text-2xl font-bold">{stats.skeletonCount}</p>
              <p className="text-blue-100 text-sm mt-1">dans le planning</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-5 h-5 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Générés</span>
              </div>
              <p className="text-2xl font-bold">{stats.postsGenerated}</p>
              <p className="text-purple-100 text-sm mt-1">contenus créés</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Share2 className="w-5 h-5 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Publiés</span>
              </div>
              <p className="text-2xl font-bold">{stats.postsPublished}</p>
              <p className="text-green-100 text-sm mt-1">posts programmés</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Progression</span>
              </div>
              <p className="text-2xl font-bold">
                {stats.configDone && stats.paramsDone ? '✅' : '⏳'}
              </p>
              <p className="text-orange-100 text-sm mt-1">
                {stats.configDone ? 'Config OK' : 'Setup requis'}
              </p>
            </div>
          </div>

          {/* Section Progression et Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Barre de progression */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Progression</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Configuration entreprise</span>
                    <span className="font-medium text-blue-600">{stats.configDone ? '100%' : '0%'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${stats.configDone ? 'w-full bg-green-500' : 'w-0 bg-gray-300'}`} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Paramètres campagne</span>
                    <span className="font-medium text-blue-600">{stats.paramsDone ? '100%' : '0%'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${stats.paramsDone ? 'w-full bg-green-500' : 'w-0 bg-gray-300'}`} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Génération du squelette</span>
                    <span className="font-medium text-blue-600">{stats.skeletonCount > 0 ? '100%' : '0%'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${stats.skeletonCount > 0 ? 'w-full bg-green-500' : 'w-0 bg-gray-300'}`} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Contenus générés</span>
                    <span className="font-medium text-blue-600">
                      {stats.skeletonCount > 0 ? Math.round((stats.postsGenerated / stats.skeletonCount) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all bg-blue-500"
                      style={{ width: `${stats.skeletonCount > 0 ? (stats.postsGenerated / stats.skeletonCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Actions rapides</h2>
              </div>
              <div className="space-y-3">
                {!stats.configDone && (
                  <Link href="/setup" className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
                    <span>⚙️ Configurer mon entreprise</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                {stats.configDone && !stats.paramsDone && (
                  <Link href="/params" className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
                    <span>🎯 Définir les paramètres</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                {stats.configDone && stats.paramsDone && stats.skeletonCount === 0 && (
                  <Link href="/competitive-intelligence" className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
                    <span>🔍 Générer des insights</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                {stats.skeletonCount > 0 && stats.postsGenerated === 0 && (
                  <Link href="/campaign-vertical?generate=true" className="flex items-center justify-between p-3 bg-white/20 rounded-xl hover:bg-white/30 transition">
                    <span>✨ Générer les contenus</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                {stats.postsGenerated > 0 && (
                  <Link href="/campaign-vertical" className="flex items-center justify-between p-3 bg-white/20 rounded-xl hover:bg-white/30 transition">
                    <span>📝 Finaliser mes posts</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Navigation rapide */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Link href="/setup" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Setup</span>
            </Link>
            <Link href="/params" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Params</span>
            </Link>
            <Link href="/competitive-intelligence" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Veille</span>
            </Link>
            <Link href="/skeleton" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Squelette</span>
            </Link>
            <Link href="/campaign-vertical" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Workflow</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }