'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, Plus, ChevronRight, Clock, CheckCircle, 
  AlertCircle, Search, Mail, Phone, BookOpen, 
  FileText, MessageSquare, X, Loader2, Send,
  User, Calendar, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const categories = [
  { value: 'question', label: '❓ Question', color: 'bg-blue-100 text-blue-700' },
  { value: 'bug', label: '🐛 Bug technique', color: 'bg-red-100 text-red-700' },
  { value: 'feature', label: '💡 Suggestion', color: 'bg-purple-100 text-purple-700' },
  { value: 'billing', label: '💰 Facturation', color: 'bg-green-100 text-green-700' },
  { value: 'other', label: '📝 Autre', color: 'bg-gray-100 text-gray-700' }
];

const faqItems = [
  {
    question: "Comment configurer mon entreprise ?",
    answer: "Rendez-vous dans le menu 'Setup' et suivez les 7 étapes. Vous pouvez aussi importer un document PDF/DOCX, l'IA préremplira automatiquement les champs."
  },
  {
    question: "Comment générer mon calendrier éditorial ?",
    answer: "Après avoir configuré votre entreprise et vos paramètres, allez dans 'Squelette' → 'Générer le squelette'. L'IA créera un planning personnalisé."
  },
  {
    question: "Puis-je modifier un post après génération ?",
    answer: "Oui ! Dans 'Workflow', cliquez sur le post concerné, puis sur 'Modifier' sur le bloc que vous souhaitez changer."
  },
  {
    question: "Comment programmer sur les réseaux sociaux ?",
    answer: "Connectez d'abord votre compte dans 'Paramètres' → 'Réseaux sociaux', puis dans 'Workflow' → 'Programmation', choisissez date et plateforme."
  },
  {
    question: "Que faire en cas d'erreur de paiement ?",
    answer: "Vérifiez vos informations bancaires. Si le problème persiste, contactez-nous via ce formulaire avec la catégorie 'Facturation'."
  }
];

export default function SupportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTicketView, setShowTicketView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: 'question' });
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    loadUserAndTickets();
  }, []);

  const loadUserAndTickets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUser(user);
    await loadTickets();
    setLoading(false);
  };

  const loadTickets = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    setTickets(data || []);
  };

  const loadTicketMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*, user_profiles(first_name, last_name, email)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const createTicket = async () => {
    if (!newTicket.subject) {
      toast.error('Veuillez saisir un sujet');
      return;
    }

    setSending(true);
    
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        ticket_number: ticketNumber,
        subject: newTicket.subject,
        description: newTicket.description,
        category: newTicket.category,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      // Ajouter le message initial
      await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          user_id: user.id,
          message: newTicket.description
        });

      toast.success('Ticket créé ! Notre équipe vous répondra sous 24h');
      setShowForm(false);
      setNewTicket({ subject: '', description: '', category: 'question' });
      await loadTickets();
    }
    
    setSending(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSending(true);
    
    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: newMessage
      });

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      setNewMessage('');
      await loadTicketMessages(selectedTicket.id);
      toast.success('Message envoyé');
    }
    
    setSending(false);
  };

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await loadTicketMessages(ticket.id);
    setShowTicketView(true);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      default: return status;
    }
  };

  const getCategoryBadge = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Support client</h1>
          <p className="text-gray-500 mt-2">Obtenez de l'aide rapidement</p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans la FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Nouveau ticket
          </button>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Foire aux questions</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredFaq.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucun résultat pour "{searchQuery}"
              </div>
            ) : (
              filteredFaq.map((item, idx) => (
                <div key={idx} className="border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50 transition flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-900">{item.question}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${openFaqIndex === idx ? 'rotate-90' : ''}`} />
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-6 pb-4 text-gray-600 text-sm">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Mes tickets</h2>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {tickets.length}
              </span>
            </div>
          </div>
          
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun ticket</p>
              <p className="text-xs text-gray-400 mt-1">Créez un ticket pour contacter le support</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => openTicket(ticket)}
                  className="p-4 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-gray-500">{ticket.ticket_number}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                          {getCategoryBadge(ticket.category)}
                        </span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          <span className="text-xs text-gray-500">{getStatusLabel(ticket.status)}</span>
                        </div>
                      </div>
                      <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact direct */}
        <div className="mt-6 flex justify-center gap-4">
          <a
            href="mailto:support@bdb-consulting.com"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition"
          >
            <Mail className="w-4 h-4" />
            support@bdb-consulting.com
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="tel:+22912345678"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition"
          >
            <Phone className="w-4 h-4" />
            +229 12 34 56 78
          </a>
        </div>
      </div>

      {/* Modal création ticket */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Nouveau ticket
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  placeholder="Décrivez brièvement votre problème"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Détaillez votre demande..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={createTicket}
                disabled={sending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal visualisation ticket */}
      {showTicketView && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">{selectedTicket.ticket_number}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                    {getCategoryBadge(selectedTicket.category)}
                  </span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedTicket.status)}
                    <span className="text-xs text-gray-500">{getStatusLabel(selectedTicket.status)}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setShowTicketView(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-xl ${
                      msg.is_admin
                        ? 'bg-gray-100 text-gray-800 rounded-bl-none'
                        : 'bg-blue-600 text-white rounded-br-none'
                    }`}
                  >
                    {msg.is_admin && (
                      <p className="text-xs font-medium mb-1 text-gray-500">
                        Support BDB Consulting
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Votre réponse..."
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}