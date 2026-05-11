'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  Globe, Rss, Plus, Trash2, 
  RefreshCw, Bell, Calendar, Clock, Mail, 
  Loader2, CheckCircle, Eye, ExternalLink,
  Settings, Save, X, User, Briefcase
} from 'lucide-react';
import { FaLinkedin, FaTwitter } from 'react-icons/fa';

interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
  is_active: boolean;
}

interface MonitoringConfig {
  frequency: string;
  day_of_week: number;
  day_of_month: number;
  time_of_day: string;
  is_active: boolean;
  next_send_at?: string;
}

const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const frequencies = [
  { value: 'daily', label: '📅 Quotidien' },
  { value: 'weekly', label: '📆 Hebdomadaire' },
  { value: 'monthly', label: '📅 Mensuel' }
];

const sourceTypes = [
  { value: 'website', label: '🌐 Site web', icon: Globe },
  { value: 'rss', label: '📡 Flux RSS', icon: Rss },
  { value: 'linkedin', label: '🔗 LinkedIn', icon: FaLinkedin },
  { value: 'twitter', label: '🐦 Twitter', icon: FaTwitter }
];

export default function MonitoringPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [config, setConfig] = useState<MonitoringConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'website' });
  const [testing, setTesting] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadData();
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserEmail(user?.email || '');
  };

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Charger les sources
    const { data: sourcesData } = await supabase
      .from('monitoring_sources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setSources(sourcesData || []);

    // Charger la configuration
    const { data: configData } = await supabase
      .from('monitoring_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (configData) {
      setConfig(configData);
    } else {
      setConfig({
        frequency: 'weekly',
        day_of_week: 1,
        day_of_month: 1,
        time_of_day: '09:00',
        is_active: true
      });
    }

    setLoading(false);
  };

  const addSource = async () => {
    if (!newSource.name || !newSource.url) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('monitoring_sources')
      .insert({
        user_id: user?.id,
        name: newSource.name,
        url: newSource.url,
        type: newSource.type
      });

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Source ajoutée');
      setShowAddSource(false);
      setNewSource({ name: '', url: '', type: 'website' });
      await loadData();
    }
  };

  const deleteSource = async (id: string) => {
    const { error } = await supabase
      .from('monitoring_sources')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Source supprimée');
      await loadData();
    }
  };

  const toggleSource = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('monitoring_sources')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erreur');
    } else {
      await loadData();
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    // Calculer la prochaine date d'envoi
    const nextSendAt = calculateNextSendDate(
      config.frequency,
      config.day_of_week,
      config.day_of_month,
      config.time_of_day
    );

    const { error } = await supabase
      .from('monitoring_config')
      .upsert({
        user_id: user?.id,
        frequency: config.frequency,
        day_of_week: config.day_of_week,
        day_of_month: config.day_of_month,
        time_of_day: config.time_of_day,
        next_send_at: nextSendAt.toISOString(),
        is_active: config.is_active,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Configuration sauvegardée');
      setShowConfig(false);
      await loadData();
    }
    setSaving(false);
  };

  const calculateNextSendDate = (frequency: string, dayOfWeek: number, dayOfMonth: number, timeOfDay: string) => {
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    if (frequency === 'daily') {
      if (next <= now) next.setDate(next.getDate() + 1);
    } else if (frequency === 'weekly') {
      const currentDay = now.getDay();
      let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
      if (daysToAdd === 0 && next <= now) daysToAdd = 7;
      next.setDate(next.getDate() + daysToAdd);
    } else if (frequency === 'monthly') {
      next.setDate(dayOfMonth);
      if (next <= now) next.setMonth(next.getMonth() + 1);
    }

    return next;
  };

  const testMonitoring = async () => {
    setTesting(true);
    const { data: { user } } = await supabase.auth.getUser();

    const response = await fetch('/api/monitoring/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, isTest: true })
    });

    const result = await response.json();
    if (result.success) {
      toast.success(`Test réussi ! ${result.count} nouvelles informations trouvées. Vérifiez vos emails.`);
    } else {
      toast.error('Erreur: ' + result.error);
    }
    setTesting(false);
  };

  const getTypeIcon = (type: string) => {
    const found = sourceTypes.find(t => t.value === type);
    if (found) {
      const Icon = found.icon;
      if (type === 'linkedin') return <FaLinkedin className="w-4 h-4" />;
      if (type === 'twitter') return <FaTwitter className="w-4 h-4" />;
      return <Icon className="w-4 h-4" />;
    }
    return <Globe className="w-4 h-4" />;
  };

  const getFrequencyLabel = () => {
    switch(config?.frequency) {
      case 'daily': return 'Quotidien';
      case 'weekly': return `Hebdomadaire (${weekDays[config?.day_of_week || 1]})`;
      case 'monthly': return `Mensuel (Jour ${config?.day_of_month || 1})`;
      default: return 'Hebdomadaire';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
          <Bell className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Veille automatisée</h1>
        <p className="text-gray-500 mt-2">
          Surveillez des sites web et recevez des alertes par email
        </p>
      </div>

      {/* Email de réception */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Email de réception</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600">
            Les alertes seront envoyées à : <strong>{userEmail || 'Non défini'}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Modifiable dans Paramètres → Notifications
          </p>
        </div>
      </div>

      {/* Configuration de fréquence */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Fréquence des alertes</h2>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-blue-600 text-sm hover:underline"
          >
            {showConfig ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        <div className="p-6">
          {!showConfig ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  Envoi <strong>{getFrequencyLabel()}</strong> à <strong>{config?.time_of_day}</strong>
                </p>
                {config?.next_send_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Prochain envoi : {new Date(config.next_send_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={testMonitoring}
                  disabled={testing}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition flex items-center gap-1"
                >
                  {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Tester
                </button>
                <span className={`text-xs px-2 py-1 rounded-full ${config?.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {config?.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence</label>
                <select
                  value={config?.frequency}
                  onChange={(e) => setConfig({ ...config!, frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {frequencies.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {config?.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jour de la semaine</label>
                  <select
                    value={config?.day_of_week}
                    onChange={(e) => setConfig({ ...config!, day_of_week: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {weekDays.map((day, idx) => (
                      <option key={idx} value={idx}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              {config?.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jour du mois</label>
                  <select
                    value={config?.day_of_month}
                    onChange={(e) => setConfig({ ...config!, day_of_month: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {[...Array(28)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure d'envoi</label>
                <input
                  type="time"
                  value={config?.time_of_day}
                  onChange={(e) => setConfig({ ...config!, time_of_day: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={config?.is_active}
                  onChange={(e) => setConfig({ ...config!, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Activer la veille automatique</label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Sauvegarder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sources surveillées */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Sources surveillées</h2>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
              {sources.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddSource(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-3 h-3" />
            Ajouter
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {sources.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune source configurée</p>
              <p className="text-xs text-gray-400 mt-1">Ajoutez des sites web ou flux RSS à surveiller</p>
            </div>
          ) : (
            sources.map(source => (
              <div key={source.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    source.is_active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {getTypeIcon(source.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{source.name}</p>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1"
                    >
                      {source.url.substring(0, 50)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSource(source.id, source.is_active)}
                    className={`p-1.5 rounded-lg transition ${
                      source.is_active 
                        ? 'text-green-600 hover:text-green-700' 
                        : 'text-gray-400 hover:text-gray-500'
                    }`}
                    title={source.is_active ? 'Désactiver' : 'Activer'}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSource(source.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Mail className="w-3 h-3" />
            Les alertes seront envoyées à votre adresse email
          </div>
        </div>
      </div>

      {/* Modal d'ajout de source */}
      {showAddSource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Ajouter une source
              </h3>
              <button
                onClick={() => setShowAddSource(false)}
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
                  value={newSource.name}
                  onChange={(e) => setNewSource({...newSource, name: e.target.value})}
                  placeholder="Ex: TechCrunch, Blog concurrent..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="text"
                  value={newSource.url}
                  onChange={(e) => setNewSource({...newSource, url: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource({...newSource, type: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {sourceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addSource}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddSource(false)}
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