'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CreditCard, DollarSign, TrendingUp, Users, 
  Download, Search, Eye, Loader2, RefreshCw,
  CheckCircle, XCircle, Clock, Calendar,
  FileText, ArrowUpDown, Filter, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalTransactions: number;
  pendingTransactions: number;
  approvedTransactions: number;
  rejectedTransactions: number;
}

interface Transaction {
  id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  status: string;
  plan_name: string;
  created_at: string;
  user_profiles?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    approvedTransactions: 0,
    rejectedTransactions: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

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
    await loadTransactions();
    setLoading(false);
  };

  const loadStats = async () => {
    // Total des revenus
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

    // Transactions
    const { data: allTransactions } = await supabase
      .from('fedapay_transactions')
      .select('status');

    const totalTransactions = allTransactions?.length || 0;
    const pendingTransactions = allTransactions?.filter(t => t.status === 'pending').length || 0;
    const approvedTransactions = allTransactions?.filter(t => t.status === 'approved').length || 0;
    const rejectedTransactions = allTransactions?.filter(t => t.status === 'rejected').length || 0;

    setStats({
      totalRevenue,
      monthlyRevenue,
      totalTransactions,
      pendingTransactions,
      approvedTransactions,
      rejectedTransactions
    });
  };

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('fedapay_transactions')
      .select('*, user_profiles(email, first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    setTransactions(data || []);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadTransactions()]);
    toast.success('Données actualisées');
    setRefreshing(false);
  };

  const exportCSV = () => {
    const filtered = getFilteredTransactions();
    const headers = ['Date', 'Client', 'Email', 'Montant', 'Plan', 'Statut', 'Transaction ID'];
    const rows = filtered.map(t => [
      new Date(t.created_at).toLocaleDateString('fr-FR'),
      t.user_profiles?.first_name ? `${t.user_profiles.first_name} ${t.user_profiles.last_name}` : 'N/A',
      t.user_profiles?.email || 'N/A',
      `${t.amount.toLocaleString()} FCFA`,
      t.plan_name,
      t.status === 'approved' ? 'Approuvé' : t.status === 'pending' ? 'En attente' : 'Rejeté',
      t.transaction_id
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Export CSV terminé');
  };

  const getFilteredTransactions = () => {
    let filtered = [...transactions];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.user_profiles?.email?.toLowerCase().includes(term) ||
        t.transaction_id?.toLowerCase().includes(term) ||
        t.plan_name?.toLowerCase().includes(term)
      );
    }
    
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy as keyof Transaction];
      let bVal: any = b[sortBy as keyof Transaction];
      if (sortBy === 'created_at') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      }
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Approuvé</span>;
      case 'pending':
        return <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> En attente</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> Rejeté</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  const filteredTransactions = getFilteredTransactions();

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
          <CreditCard className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href="/admin" 
                className="p-2 text-gray-400 hover:text-gray-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
            </div>
            <p className="text-gray-500 ml-14">Gestion des transactions et abonnements</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-xs text-gray-400">Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">chiffre d'affaires</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-400">Mois en cours</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
            <p className="text-xs text-green-600 mt-1">+{Math.round((stats.monthlyRevenue / stats.totalRevenue) * 100) || 0}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-gray-400">Transactions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            <p className="text-xs text-gray-500 mt-1">au total</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span className="text-xs text-gray-400">Taux succès</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round((stats.approvedTransactions / stats.totalTransactions) * 100) || 0}%
            </p>
            <p className="text-xs text-green-600 mt-1">{stats.approvedTransactions} approuvées</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email, transaction ID ou plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg"
              >
                <option value="all">Tous les statuts</option>
                <option value="approved">Approuvés</option>
                <option value="pending">En attente</option>
                <option value="rejected">Rejetés</option>
              </select>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg"
              >
                <option value="created_at_desc">Date (plus récent)</option>
                <option value="created_at_asc">Date (plus ancien)</option>
                <option value="amount_desc">Montant (décroissant)</option>
                <option value="amount_asc">Montant (croissant)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Aucune transaction trouvée
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.user_profiles?.first_name} {transaction.user_profiles?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.user_profiles?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.plan_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-gray-500 font-mono">
                          {transaction.transaction_id?.substring(0, 12)}...
                        </code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Affichage de {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}