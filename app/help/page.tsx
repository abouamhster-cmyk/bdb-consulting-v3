'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  HelpCircle, Search, BookOpen, Video, FileText, 
  MessageCircle, ArrowRight, CheckCircle, Zap,
  Users, CreditCard, Image, Share2, Layout, Calendar,
  Sparkles, Eye, Target, Menu, X, ChevronRight
} from 'lucide-react';

// Composant Settings avant son utilisation
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'débutant' | 'intermédiaire' | 'avancé';
  category: string;
  link: string;
}

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const tutorials: Tutorial[] = [
  {
    id: '1',
    title: 'Premiers pas sur BDB Consulting',
    description: 'Découvrez comment configurer votre entreprise et lancer votre première campagne.',
    duration: '5 min',
    level: 'débutant',
    category: 'Démarrage',
    link: '/help/getting-started'
  },
  {
    id: '2',
    title: 'Configurer son entreprise (7 étapes)',
    description: 'Guide complet pour remplir les 7 étapes de configuration de votre entreprise.',
    duration: '10 min',
    level: 'débutant',
    category: 'Configuration',
    link: '/help/setup-guide'
  },
  {
    id: '3',
    title: 'Générer des insights concurrentiels',
    description: 'Apprenez à utiliser l\'IA pour analyser vos concurrents.',
    duration: '8 min',
    level: 'intermédiaire',
    category: 'Veille',
    link: '/help/competitive-intelligence'
  },
  {
    id: '4',
    title: 'Créer votre planning éditorial',
    description: 'Générez et personnalisez votre squelette de posts.',
    duration: '7 min',
    level: 'débutant',
    category: 'Squelette',
    link: '/help/skeleton'
  },
  {
    id: '5',
    title: 'Produire des contenus avec l\'IA',
    description: 'Textes, images et vidéos : maîtrisez le workflow de création.',
    duration: '12 min',
    level: 'intermédiaire',
    category: 'Production',
    link: '/help/content-generation'
  },
  {
    id: '6',
    title: 'Programmer sur les réseaux sociaux',
    description: 'Connectez vos comptes et planifiez vos publications.',
    duration: '6 min',
    level: 'intermédiaire',
    category: 'Programmation',
    link: '/help/scheduling'
  },
  {
    id: '7',
    title: 'Optimiser vos résultats avec l\'IA',
    description: 'Conseils avancés pour améliorer la performance de vos posts.',
    duration: '15 min',
    level: 'avancé',
    category: 'Optimisation',
    link: '/help/optimization'
  },
  {
    id: '8',
    title: 'Comprendre les abonnements',
    description: 'Tarifs, fonctionnalités et gestion de votre abonnement.',
    duration: '4 min',
    level: 'débutant',
    category: 'Facturation',
    link: '/help/subscriptions'
  }
];

const faqData: FaqItem[] = [
  {
    question: "Comment modifier mon mot de passe ?",
    answer: "Rendez-vous dans 'Paramètres' → 'Sécurité', puis cliquez sur 'Changer mon mot de passe'.",
    category: "Compte"
  },
  {
    question: "Puis-je ajouter plusieurs utilisateurs ?",
    answer: "Oui, les plans Pro et Business permettent d'ajouter des membres d'équipe. Allez dans 'Paramètres' → 'Équipe'.",
    category: "Équipe"
  },
  {
    question: "Comment réinitialiser ma configuration ?",
    answer: "Dans 'Setup', vous pouvez modifier vos informations à tout moment. Les données existantes ne sont pas perdues.",
    category: "Configuration"
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument. Toutes vos données sont chiffrées et nous ne les partageons jamais avec des tiers.",
    category: "Sécurité"
  },
  {
    question: "Comment exporter mes données ?",
    answer: "Dans 'Paramètres' → 'Données', cliquez sur 'Exporter mes données'.",
    category: "Données"
  },
  {
    question: "Que faire si l'IA génère du contenu inapproprié ?",
    answer: "Vous pouvez modifier manuellement le contenu ou utiliser le bouton 'Régénérer' pour une nouvelle version.",
    category: "IA"
  }
];

const categories = [
  { name: 'Démarrage', icon: Zap, color: 'bg-blue-100 text-blue-600', tours: 3 },
  { name: 'Configuration', icon: SettingsIcon, color: 'bg-purple-100 text-purple-600', tours: 2 },
  { name: 'Veille', icon: Eye, color: 'bg-green-100 text-green-600', tours: 2 },
  { name: 'Squelette', icon: Calendar, color: 'bg-amber-100 text-amber-600', tours: 2 },
  { name: 'Production', icon: Sparkles, color: 'bg-indigo-100 text-indigo-600', tours: 3 },
  { name: 'Programmation', icon: Share2, color: 'bg-pink-100 text-pink-600', tours: 2 },
  { name: 'Facturation', icon: CreditCard, color: 'bg-emerald-100 text-emerald-600', tours: 2 },
  { name: 'Équipe', icon: Users, color: 'bg-cyan-100 text-cyan-600', tours: 1 }
];

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const filteredTutorials = tutorials.filter(tutorial => 
    (selectedCategory === null || tutorial.category === selectedCategory) &&
    (tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFaq = faqData.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'débutant': return 'bg-green-100 text-green-700';
      case 'intermédiaire': return 'bg-blue-100 text-blue-700';
      case 'avancé': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Comment pouvons-nous vous aider ?</h1>
          <p className="text-blue-100 max-w-2xl mx-auto">
            Tutoriels, guides et réponses aux questions fréquentes
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un tutoriel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Categories Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tous
            </button>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                    selectedCategory === cat.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tutorials Grid */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Tutoriels</h2>
          </div>
          
          {filteredTutorials.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
              Aucun tutoriel trouvé pour "{searchQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(tutorial.link)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(tutorial.level)}`}>
                        {tutorial.level}
                      </span>
                      <span className="text-xs text-gray-400">{tutorial.duration}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{tutorial.title}</h3>
                  <p className="text-sm text-gray-500">{tutorial.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Questions fréquentes</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredFaq.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucune question trouvée pour "{searchQuery}"
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredFaq.map((faq, idx) => (
                  <div key={idx}>
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full text-left px-6 py-4 hover:bg-gray-50 transition flex justify-between items-center"
                    >
                      <div>
                        <span className="text-xs text-gray-400 mb-1 block">{faq.category}</span>
                        <span className="font-medium text-gray-900">{faq.question}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${openFaqIndex === idx ? 'rotate-90' : ''}`} />
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-6 pb-4 text-gray-600 text-sm">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Vous n'avez pas trouvé votre bonheur ?</h3>
            <p className="text-sm text-gray-500">Notre équipe est là pour vous aider</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/support"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
            >
              <MessageCircle className="w-4 h-4" />
              Contacter le support
            </Link>
            <Link
              href="/legal/privacy"
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              <FileText className="w-4 h-4" />
              Confidentialité
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              <CreditCard className="w-4 h-4" />
              Tarifs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}