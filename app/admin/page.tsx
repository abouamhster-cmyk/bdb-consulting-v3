'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, Users, CreditCard, TrendingUp, 
  Activity, Database, FileText, Image, Video,
  Calendar, CheckCircle, XCircle, AlertCircle,
  Loader2, RefreshCw, Download, Eye,
  BarChart3, PieChart, DollarSign, UserCheck,
  Crown, Sparkles, Target, Eye as EyeIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPosts: number;
  totalImages: number;
  totalVideos: number;
  totalCampaigns: number;
  totalInsights: number;
}

interface RecentActivity {
  id: string;
  user_email: string;
  action: string;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalPosts: 0,
    totalImages: 0,
    totalVideos: 0,
    totalCampaigns: 0,
    totalInsights: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    // Vérifier si l'utilisateur est admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminData) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    await loadStats();
    await loadRecentActivities();
    await loadRecentUsers();
    setLoading(false);
  };

  const loadStats = async () => {
    // Compter les utilisateurs
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Compter les utilisateurs actifs (avec abonnement actif)
    const { count: activeUsers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Compter les abonnements
    const { count: totalSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });

    // Calculer le chiffre d'affaires total
    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount');
    
    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

    // Revenus du mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyInvoices } = await supabase
      .from('invoices')
      .select('amount')
      .gte('paid_at', startOfMonth.toISOString());

    const monthlyRevenue = monthlyInvoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

    // Compter les posts
    const { count: totalPosts } = await supabase
      .from('post_skeleton')
      .select('*', { count: 'exact', head: true });

    // Compter les images
    const { count: totalImages } = await supabase
      .from('generated_images')
      .select('*', { count: 'exact', head: true });

    // Compter les vidéos
    const { count: totalVideos } = await supabase
      .from('generated_videos')
      .select('*', { count: 'exact', head: true });

    // Compter les campagnes
    const { count: totalCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true });

    // Compter les insights
    const { count: totalInsights } = await supabase
      .from('competitive_insights')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalSubscriptions: totalSubscriptions || 0,
      totalRevenue,
      monthlyRevenue,
      totalPosts: totalPosts || 0,
      totalImages: totalImages || 0,
      totalVideos: totalVideos || 0,
      totalCampaigns: totalCampaigns || 0,
      totalInsights: totalInsights || 0
    });
  };

  const loadRecentActivities = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*, user_profiles(email)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setRecentActivities(data.map(log => ({
        id: log.id,
        user_email: log.user_profiles?.email || 'Inconnu',
        action: log.action,
        created_at: log.created_at
      })));
    }
  };

  const loadRecentUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    setRecentUsers(data || []);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadRecentActivities(), loadRecentUsers()]);
    toast.success('Données actualisées');
    setRefreshing(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h1>
          <p className="text-gray-500">Vous n'avez pas les droits d'administration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            </div>
            <p className="text-gray-500 ml-14">Tableau de bord de gestion de la plateforme</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/payments"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <CreditCard className="w-4 h-4" />
              Paiements
            </Link>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-400">Utilisateurs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            <p className="text-xs text-green-600 mt-1">{stats.activeUsers} actifs</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              <span className="text-xs text-gray-400">Abonnements</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSubscriptions}</p>
            <p className="text-xs text-gray-500 mt-1">actifs</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <span className="text-xs text-gray-400">Chiffre d'affaires</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-green-600 mt-1">+{formatCurrency(stats.monthlyRevenue)} ce mois</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-gray-400">Contenus</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalPosts + stats.totalImages + stats.totalVideos}</p>
            <p className="text-xs text-gray-500 mt-1">posts • images • vidéos</p>
          </div>
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
            <FileText className="w-4 h-4 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.totalPosts}</p>
            <p className="text-xs text-gray-500">Posts</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
            <Image className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.totalImages}</p>
            <p className="text-xs text-gray-500">Images</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
            <Video className="w-4 h-4 text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.totalVideos}</p>
            <p className="text-xs text-gray-500">Vidéos</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
            <Calendar className="w-4 h-4 text-amber-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.totalCampaigns}</p>
            <p className="text-xs text-gray-500">Campagnes</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center">
            <EyeIcon className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.totalInsights}</p>
            <p className="text-xs text-gray-500">Insights</p>
          </div>
        </div>

        {/* Recent Activity & Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Activité récente</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {recentActivities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Aucune activité récente
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="px-6 py-3 hover:bg-gray-50 transition">
                    <p className="text-sm text-gray-800">{activity.user_email}</p>
                    <p className="text-xs text-gray-500">{activity.action}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(activity.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Nouveaux utilisateurs</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {recentUsers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Aucun utilisateur récent
                </div>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="px-6 py-3 hover:bg-gray-50 transition">
                    <p className="text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Inscrit le {formatDate(user.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}