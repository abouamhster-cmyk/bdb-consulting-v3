'use client';

import { useState } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  postId: string;
  currentContent?: string;
  type: 'text' | 'image' | 'video';
  onUpdate: (newContent: string) => void;
  onClose: () => void;
}

export default function ChatAssistant({ 
  postId, 
  currentContent, 
  type, 
  onUpdate, 
  onClose 
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Bonjour ! Je suis votre assistant IA. Je peux vous aider à améliorer ce ${type === 'text' ? 'texte' : type === 'image' ? 'prompt d\'image' : 'script vidéo'}. Que souhaitez-vous modifier ?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          currentContent,
          type,
          userMessage: input,
          conversation: messages.slice(-5),
          userId: user?.id
        })
      });

      const result = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.reply || "Je n'ai pas compris. Pouvez-vous reformuler ?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (result.suggestedContent) {
        onUpdate(result.suggestedContent);
        toast.success('Contenu mis à jour par l\'IA !');
      }

    } catch (error) {
      console.error('Erreur:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir le label du type
  const getTypeLabel = () => {
    switch(type) {
      case 'text': return 'texte';
      case 'image': return "prompt d'image";
      case 'video': return 'script vidéo';
      default: return 'contenu';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">Assistant IA</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{type}</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 rounded-lg p-1 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-xl text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-xl rounded-bl-none">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Demandez une modification du ${getTypeLabel()}...`}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Exemples : "Rends ce texte plus professionnel", "Ajoute des hashtags", "Raccourcis ce prompt"
        </p>
      </div>
    </div>
  );
}