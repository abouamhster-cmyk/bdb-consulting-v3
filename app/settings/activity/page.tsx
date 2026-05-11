'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity, Clock, User, FileText, Users, 
  Settings, Image, Video, MessageSquare, 
  Eye, Calendar, CheckCircle, XCircle,
  Shield, CreditCard, Bell, Database,
  Webhook, Palette, Loader2, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ActivityLog {
  id: string;
  user_id: string;
  team_id: string;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string;
  };
}

// Composant Edit avant utilisation
const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const actionLabels: Record<string, { label: string; icon: any; color: string }> = {
  'campaign.created': { label: 'Campagne créée', icon: FileText, color: 'text-green-600' },
  'campaign.updated': { label: 'Campagne modifiée', icon: FileText, color: 'text-blue-600' },
  'campaign.deleted': { label: 'Campagne supprimée', icon: FileText, color: 'text-red-600' },
  'post.created': { label: 'Post créé', icon: FileText, color: 'text-green-600' },
  'post.updated': { label: 'Post modifié', icon: EditIcon, color: 'text-blue-600' },
  'post.validated': { label: 'Post validé', icon: CheckCircle, color: 'text-green-600' },
  'team.member.invited': { label: 'Membre invité', icon: Users, color: 'text-blue-600' },
  'team.member.joined': { label: 'Membre a rejoint', icon: Users, color: 'text-green-600' },
  'team.member.removed': { label: 'Membre retiré', icon: Users, color: 'text-red-600' },
  'team.member.role_changed': { label: 'Rôle modifié', icon: Users, color: 'text-amber-600' },
  'content.text.generated': { label: 'Texte généré', icon: MessageSquare, color: 'text-purple-600' },
  'content.image.generated': { label: 'Image générée', icon: Image, color: 'text-green-600' },
  'content.video.generated': { label: 'Vidéo générée', icon: Video, color: 'text-red-600' },
  'settings.updated': { label: 'Paramètres modifiés', icon: Settings, color: 'text-gray-600' },
  'company.config.updated': { label: 'Configuration entreprise modifiée', icon: Settings, color: 'text-blue-600' },
  'params.updated': { label: 'Paramètres campagne modifiés', icon: Settings, color: 'text-indigo-600' },
  'skeleton.generated': { label: 'Squelette généré', icon: Calendar, color: 'text-purple-600' },
  'skeleton.validated': { label: 'Squelette validé', icon: CheckCircle, color: 'text-green-600' },
  'insight.validated': { label: 'Insight validé', icon: Eye, color: 'text-green-600' },
  'insight.rejected': { label: 'Insight rejeté', icon: XCircle, color: 'text-red-600' },
  'subscription.created': { label: 'Abonnement créé', icon: CreditCard, color: 'text-green-600' },
  'subscription.cancelled': { label: 'Abonnement annulé', icon: CreditCard, color: 'text-red-600' }
};

const menuItems = [
  { name: 'Profil', href: '/settings', icon: User },
  { name: 'Sécurité', href: '/settings/security', icon: Shield },
  { name: 'Facturation', href: '/settings/billing', icon: CreditCard },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Équipe', href: '/settings/team', icon: Users },
  { name: 'API', href: '/settings/api-keys', icon: Database },
  { name: 'Intégrations', href: '/settings/integrations', icon: Webhook },
  { name: 'Personnalisation', href: '/settings/branding', icon: Palette },
  { name: 'Données', href: '/settings/data', icon: Database },
  { name: 'Activité', href: '/settings/activity', icon: Activity, current: true }
];

export default function ActivityPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    loadTeamAndLogs();
  }, [filter, dateRange]);

  const loadTeamAndLogs = async () => {
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
      await loadLogs(team.id);
    } else {
      setLoading(false);
    }
  };

  const loadLogs = async (teamId: string) => {
    const response = await fetch(`/api/team/logs?teamId=${teamId}&limit=100`);
    const result = await response.json();
    
    if (result.success) {
      setLogs(result.logs || []);
    }
    setLoading(false);
  };

  const exportLogs = async () => {
    setExporting(true);
    
    const csvRows: string[] = [];
    
    // Headers
    const headers = ['Date', 'Action', 'Utilisateur', 'Détails', 'IP'];
    csvRows.push(headers.join(','));
    
    // Data rows
    logs.forEach(log => {
      const row = [
        `"${new Date(log.created_at).toLocaleString()}"`,
        `"${actionLabels[log.action]?.label || log.action}"`,
        `"${log.user_profiles?.email || log.user_id}"`,
        `"${JSON.stringify(log.details).replace(/"/g, '""')}"`,
        `"${log.ip_address || ''}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activite_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Export CSV terminé');
    setExporting(false);
  };

  const getActionInfo = (action: string) => {
    return actionLabels[action] || { label: action, icon: Activity, color: 'text-gray-600' };
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days < 7) return `Il y a ${days} j`;
    return d.toLocaleDateString('fr-FR');
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'content') return log.action.includes('content') || log.action.includes('post');
    if (filter === 'team') return log.action.includes('team');
    if (filter === 'settings') return log.action.includes('settings') || log.action.includes('config');
    if (filter === 'campaign') return log.action.includes('campaign');
    return true;
  });

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
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Activité de l'équipe</h2>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {filteredLogs.length}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="all">Toutes les actions</option>
                      <option value="content">Contenus</option>
                      <option value="campaign">Campagnes</option>
                      <option value="team">Équipe</option>
                      <option value="settings">Paramètres</option>
                    </select>
                    <button
                      onClick={exportLogs}
                      disabled={exporting || logs.length === 0}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                      Exporter
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs List */}
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune activité pour le moment</p>
                  <p className="text-xs text-gray-400 mt-1">Les actions de votre équipe apparaîtront ici</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredLogs.map((log) => {
                    const actionInfo = getActionInfo(log.action);
                    const ActionIcon = actionInfo.icon;
                    return (
                      <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              {log.user_profiles?.avatar_url ? (
                                <img src={log.user_profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {log.user_profiles?.first_name && log.user_profiles?.last_name
                                  ? `${log.user_profiles.first_name} ${log.user_profiles.last_name}`
                                  : log.user_profiles?.email?.split('@')[0] || 'Utilisateur'}
                              </span>
                              <span className="text-gray-600 text-sm">{actionInfo.label}</span>
                              {log.details?.entityName && (
                                <span className="text-sm text-gray-400">« {log.details.entityName} »</span>
                              )}
                            </div>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <p className="text-xs text-gray-400 mt-1 font-mono">
                                {JSON.stringify(log.details).substring(0, 100)}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {formatDate(log.created_at)}
                              </div>
                              {log.ip_address && (
                                <div className="text-xs text-gray-400">
                                  IP: {log.ip_address}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`flex-shrink-0 ${actionInfo.color}`}>
                            <ActionIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              {filteredLogs.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-center">
                  <p className="text-xs text-gray-400">
                    Affichage des {filteredLogs.length} dernières activités
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}