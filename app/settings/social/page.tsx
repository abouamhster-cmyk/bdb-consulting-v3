'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FaLinkedin, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';
import { Loader2, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_id: string;
  is_active: boolean;
}

const platforms = [
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'bg-[#0077b5]' },
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'bg-[#e4405f]' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'bg-[#1877f2]' },
  { id: 'twitter', name: 'Twitter', icon: FaTwitter, color: 'bg-[#1da1f2]' }
];

export default function SocialSettingsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('late_accounts')
      .select('*')
      .eq('user_id', user.id);

    setAccounts(data || []);
    setLoading(false);
  };

  const connectAccount = async (platform: string) => {
    setConnecting(platform);
    
    // Late API redirect pour connecter
    const lateApiKey = process.env.NEXT_PUBLIC_LATE_API_KEY;
    const redirectUri = `${window.location.origin}/api/late/callback`;
    
    window.open(
      `https://api.getlate.dev/api/v1/auth/${platform}?apiKey=${lateApiKey}&redirectUri=${redirectUri}`,
      'popup',
      'width=600,height=700'
    );
    
    setConnecting(null);
  };

  const disconnectAccount = async (accountId: string) => {
    await supabase
      .from('late_accounts')
      .update({ is_active: false })
      .eq('id', accountId);
    
    loadAccounts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Réseaux sociaux</h1>
      <p className="text-gray-500 mb-8">Connectez vos comptes pour publier automatiquement</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {platforms.map((platform) => {
            const account = accounts.find(a => a.platform === platform.id);
            const Icon = platform.icon;
            
            return (
              <div key={platform.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${platform.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{platform.name}</p>
                    {account?.account_name && (
                      <p className="text-xs text-gray-500">{account.account_name}</p>
                    )}
                  </div>
                  {account?.is_active && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Connecté
                    </span>
                  )}
                </div>
                
                {account?.is_active ? (
                  <button
                    onClick={() => disconnectAccount(account.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => connectAccount(platform.id)}
                    disabled={connecting === platform.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {connecting === platform.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Connecter
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}