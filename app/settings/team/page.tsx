'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, UserPlus, Mail, Trash2, Crown, 
  Edit2, Eye, Shield, Check, X, Copy,
  UserCheck, UserX, Loader2, Settings,
  CreditCard, Bell, Database, Webhook, Palette, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  owner_id: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  invited_at: string;
  joined_at: string;
  user_profiles: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
}

const menuItems = [
  { name: 'Profil', href: '/settings', icon: Settings },
  { name: 'Sécurité', href: '/settings/security', icon: Shield },
  { name: 'Facturation', href: '/settings/billing', icon: CreditCard },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Équipe', href: '/settings/team', icon: Users, current: true },
  { name: 'API', href: '/settings/api-keys', icon: Database },
  { name: 'Intégrations', href: '/settings/integrations', icon: Webhook },
  { name: 'Personnalisation', href: '/settings/branding', icon: Palette },
  { name: 'Données', href: '/settings/data', icon: Database },
  { name: 'Activité', href: '/settings/activity', icon: Activity }
];

export default function TeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUser(user);

    // Récupérer l'équipe de l'utilisateur
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!teamData) {
      setLoading(false);
      return;
    }

    setTeam(teamData);

    // Récupérer les membres
    const { data: membersData } = await supabase
      .from('team_members')
      .select('*, user_profiles(first_name, last_name, email, avatar_url)')
      .eq('team_id', teamData.id);

    setMembers(membersData || []);

    // Récupérer les invitations en attente
    const { data: invitesData } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamData.id)
      .gt('expires_at', new Date().toISOString());

    setInvitations(invitesData || []);
    setLoading(false);
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email requis');
      return;
    }

    setInviting(true);

    const { data: { user } } = await supabase.auth.getUser();

    const response = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: team?.id,
        email: inviteEmail,
        role: inviteRole,
        invitedBy: user?.id
      })
    });

    const result = await response.json();

    if (result.success) {
      toast.success('Invitation envoyée !');
      setInviteEmail('');
      setShowInviteModal(false);
      await loadTeamData();
    } else {
      toast.error('Erreur: ' + result.error);
    }

    setInviting(false);
  };

  const updateMemberRole = async (memberId: string, newRole: string, memberEmail: string) => {
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Rôle mis à jour');
      await loadTeamData();
    }
  };

  const removeMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Retirer ${memberEmail} de l'équipe ?`)) return;

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Membre retiré');
      await loadTeamData();
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Invitation annulée');
      await loadTeamData();
    }
  };

  const copyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/api/team/join?team=${team?.slug}`;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Lien copié !');
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin': return <Crown className="w-4 h-4 text-amber-500" />;
      case 'editor': return <Edit2 className="w-4 h-4 text-blue-500" />;
      default: return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'admin': return 'Administrateur';
      case 'editor': return 'Éditeur';
      default: return 'Visualisateur';
    }
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

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="font-semibold text-gray-900">Menu</h2>
                </div>
                <nav className="p-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isCurrentPath(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition mb-1 ${
                          active
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Vous n'avez pas encore d'équipe</h2>
                <p className="text-gray-500 mb-6">Créez une équipe pour collaborer avec vos collègues</p>
                <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium">
                  Créer une équipe
                </button>
              </div>
            </div>
          </div>
        </div>
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
            {/* Team Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Équipe</h2>
                  </div>
                  <button
                    onClick={copyInviteLink}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copié !' : 'Lien d\'invitation'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Nom de l'équipe</p>
                  <p className="text-lg font-medium text-gray-900">{team.name}</p>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Membres</h2>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {members.length + 1}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                  >
                    <UserPlus className="w-3 h-3" />
                    Inviter
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {/* Owner */}
                <div className="px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Vous (Propriétaire)</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Propriétaire</span>
                </div>

                {/* Members */}
                {members.map((member) => (
                  <div key={member.id} className="px-6 py-4 flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {member.user_profiles?.avatar_url ? (
                          <img src={member.user_profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {member.user_profiles?.first_name?.charAt(0) || member.user_profiles?.email?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.user_profiles?.first_name && member.user_profiles?.last_name
                            ? `${member.user_profiles.first_name} ${member.user_profiles.last_name}`
                            : member.user_profiles?.email?.split('@')[0] || 'Utilisateur'}
                        </p>
                        <p className="text-xs text-gray-500">{member.user_profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm">
                        {getRoleIcon(member.role)}
                        <select
                          value={member.role}
                          onChange={(e) => updateMemberRole(member.id, e.target.value, member.user_profiles?.email)}
                          className="text-sm bg-transparent border-none focus:ring-0"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Éditeur</option>
                          <option value="viewer">Visualisateur</option>
                        </select>
                      </div>
                      <button
                        onClick={() => removeMember(member.id, member.user_profiles?.email)}
                        className="p-1 text-gray-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Invitations en attente */}
                {invitations.length > 0 && (
                  <div className="bg-gray-50 px-6 py-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Invitations en attente</p>
                    {invitations.map((invite) => (
                      <div key={invite.id} className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{invite.email}</span>
                          <span className="text-xs text-gray-400">({getRoleLabel(invite.role)})</span>
                        </div>
                        <button
                          onClick={() => cancelInvitation(invite.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Invitation */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Inviter un membre
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborateur@entreprise.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">👁️ Visualisateur (lecture seule)</option>
                  <option value="editor">✏️ Éditeur (peut modifier)</option>
                  <option value="admin">👑 Administrateur (toutes les actions)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={inviteMember}
                disabled={inviting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Envoyer l'invitation
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
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