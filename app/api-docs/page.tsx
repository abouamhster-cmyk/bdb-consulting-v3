'use client';

import { useState } from 'react';
import { 
  BookOpen, Code, Key, Globe, Server, 
  Database, Lock, Clock, CheckCircle, 
  Copy, Check, ExternalLink, Terminal,
  Mail, Shield, Zap, Users, FileText,
  Image, Video, Calendar, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  responses?: { code: number; description: string }[];
  example?: string;
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/campaigns',
    description: 'Récupère la liste des campagnes de l\'utilisateur',
    auth: true,
    parameters: [
      { name: 'limit', type: 'number', required: false, description: 'Nombre de résultats (défaut: 50)' },
      { name: 'offset', type: 'number', required: false, description: 'Décalage pour la pagination' },
      { name: 'status', type: 'string', required: false, description: 'Filtrer par statut (draft, active, completed)' }
    ],
    responses: [
      { code: 200, description: 'Liste des campagnes' },
      { code: 401, description: 'Non authentifié' },
      { code: 403, description: 'Permission refusée' }
    ],
    example: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Campagne été 2026",
      "status": "active",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}`
  },
  {
    method: 'POST',
    path: '/api/v1/campaigns',
    description: 'Crée une nouvelle campagne',
    auth: true,
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Nom de la campagne' },
      { name: 'description', type: 'string', required: false, description: 'Description de la campagne' }
    ],
    responses: [
      { code: 200, description: 'Campagne créée' },
      { code: 400, description: 'Données invalides' },
      { code: 401, description: 'Non authentifié' }
    ],
    example: `{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nouvelle campagne",
    "status": "draft"
  }
}`
  },
  {
    method: 'GET',
    path: '/api/v1/posts',
    description: 'Récupère les posts d\'une campagne',
    auth: true,
    parameters: [
      { name: 'campaign_id', type: 'string', required: true, description: 'ID de la campagne' },
      { name: 'limit', type: 'number', required: false, description: 'Nombre de résultats (défaut: 50)' }
    ],
    responses: [
      { code: 200, description: 'Liste des posts' },
      { code: 404, description: 'Campagne non trouvée' }
    ],
    example: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "day": 1,
      "title": "Titre du post",
      "status": "pending"
    }
  ]
}`
  },
  {
    method: 'POST',
    path: '/api/v1/generate/text',
    description: 'Génère un texte pour un post',
    auth: true,
    parameters: [
      { name: 'post_id', type: 'string', required: true, description: 'ID du post' },
      { name: 'platform', type: 'string', required: true, description: 'Plateforme (linkedin, instagram, facebook, twitter)' }
    ],
    responses: [
      { code: 200, description: 'Texte généré' },
      { code: 402, description: 'Crédits insuffisants' },
      { code: 404, description: 'Post non trouvé' }
    ],
    example: `{
  "success": true,
  "content": "Texte généré par IA...",
  "remaining": 99
}`
  },
  {
    method: 'POST',
    path: '/api/v1/generate/image',
    description: 'Génère une image pour un post',
    auth: true,
    parameters: [
      { name: 'post_id', type: 'string', required: true, description: 'ID du post' },
      { name: 'platform', type: 'string', required: true, description: 'Plateforme' },
      { name: 'prompt', type: 'string', required: false, description: 'Prompt personnalisé' }
    ],
    responses: [
      { code: 200, description: 'Image générée' },
      { code: 402, description: 'Crédits insuffisants' },
      { code: 403, description: 'Fonctionnalité non disponible' }
    ],
    example: `{
  "success": true,
  "image_url": "https://...",
  "remaining": 49
}`
  },
  {
    method: 'POST',
    path: '/api/v1/generate/video',
    description: 'Génère une vidéo pour un post',
    auth: true,
    parameters: [
      { name: 'post_id', type: 'string', required: true, description: 'ID du post' }
    ],
    responses: [
      { code: 200, description: 'Vidéo générée' },
      { code: 402, description: 'Crédits insuffisants' },
      { code: 403, description: 'Fonctionnalité non disponible' }
    ],
    example: `{
  "success": true,
  "video_url": "https://...",
  "remaining": 49
}`
  },
  {
    method: 'GET',
    path: '/api/v1/insights',
    description: 'Récupère les insights d\'une campagne',
    auth: true,
    parameters: [
      { name: 'campaign_id', type: 'string', required: true, description: 'ID de la campagne' }
    ],
    responses: [
      { code: 200, description: 'Liste des insights' }
    ],
    example: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "insight": "Insight généré...",
      "category": "content"
    }
  ]
}`
  },
  {
    method: 'POST',
    path: '/api/v1/schedule',
    description: 'Programme un post sur les réseaux sociaux',
    auth: true,
    parameters: [
      { name: 'post_id', type: 'string', required: true, description: 'ID du post' },
      { name: 'platform', type: 'string', required: true, description: 'Plateforme' },
      { name: 'scheduled_at', type: 'string', required: true, description: 'Date de programmation (ISO)' }
    ],
    responses: [
      { code: 200, description: 'Post programmé' },
      { code: 400, description: 'Compte non connecté' }
    ],
    example: `{
  "success": true,
  "scheduled_id": "buffer_123",
  "scheduled_at": "2026-06-01T10:00:00Z"
}`
  },
  {
    method: 'GET',
    path: '/api/v1/analytics',
    description: 'Récupère les statistiques de performance',
    auth: true,
    parameters: [
      { name: 'campaign_id', type: 'string', required: true, description: 'ID de la campagne' },
      { name: 'period', type: 'string', required: false, description: 'Période (7d, 30d, 90d)' }
    ],
    responses: [
      { code: 200, description: 'Statistiques' }
    ],
    example: `{
  "success": true,
  "data": {
    "impressions": 15000,
    "engagements": 1200,
    "engagement_rate": 8.0
  }
}`
  },
  {
    method: 'GET',
    path: '/api/v1/subscription',
    description: 'Récupère les informations d\'abonnement',
    auth: true,
    parameters: [],
    responses: [
      { code: 200, description: 'Informations abonnement' }
    ],
    example: `{
  "success": true,
  "plan": "pro",
  "usage": {
    "text": 45,
    "image": 12,
    "video": 0
  },
  "limits": {
    "text": 100,
    "image": 50,
    "video": 0
  }
}`
  }
];

const codeExamples = {
  curl: `curl -X GET "https://api.bdb-consulting.com/api/v1/campaigns" \\
  -H "Authorization: Bearer VOTRE_API_KEY" \\
  -H "Content-Type: application/json"`,
  javascript: `// Installation: npm install axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.bdb-consulting.com/api/v1',
  headers: {
    'Authorization': 'Bearer VOTRE_API_KEY'
  }
});

// Récupérer les campagnes
const response = await api.get('/campaigns');
console.log(response.data);`,
  python: `# Installation: pip install requests
import requests

url = "https://api.bdb-consulting.com/api/v1/campaigns"
headers = {
    "Authorization": "Bearer VOTRE_API_KEY",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
print(response.json())`,
  php: `<?php
// Installation: composer require guzzlehttp/guzzle
use GuzzleHttp\\Client;

$client = new Client([
    'base_uri' => 'https://api.bdb-consulting.com/api/v1',
    'headers' => [
        'Authorization' => 'Bearer VOTRE_API_KEY',
        'Content-Type' => 'application/json'
    ]
]);

$response = $client->get('/campaigns');
$data = json_decode($response->getBody(), true);
print_r($data);`
};

export default function ApiDocsPage() {
  const [activeLang, setActiveLang] = useState('javascript');
  const [copied, setCopied] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodColor = (method: string) => {
    switch(method) {
      case 'GET': return 'bg-green-100 text-green-700';
      case 'POST': return 'bg-blue-100 text-blue-700';
      case 'PUT': return 'bg-amber-100 text-amber-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold">API Documentation</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Intégrez facilement BDB Consulting dans vos applications avec notre API REST.
          </p>
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1.5 rounded-lg">
              <Server className="w-4 h-4" />
              REST API
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1.5 rounded-lg">
              <Lock className="w-4 h-4" />
              Authentification par clé API
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1.5 rounded-lg">
              <Zap className="w-4 h-4" />
              Rate limit: 100/min
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Authentication Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Authentification</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Ajoutez votre clé API dans l'en-tête Authorization
                </p>
                <code className="block text-xs bg-gray-100 p-2 rounded font-mono break-all">
                  Authorization: Bearer votre_clé_api
                </code>
                <button className="mt-3 text-xs text-blue-600 hover:underline">
                  Obtenir une clé API →
                </button>
              </div>

              {/* Base URL */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Base URL</h3>
                </div>
                <code className="block text-xs bg-gray-100 p-2 rounded font-mono">
                  https://api.bdb-consulting.com/api/v1
                </code>
              </div>

              {/* Endpoints List */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Endpoints</h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {endpoints.map((endpoint, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEndpoint(endpoint)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                        selectedEndpoint?.path === endpoint.path ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getMethodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                        <span className="text-xs font-mono text-gray-600 truncate">{endpoint.path}</span>
                      </div>
                      <p className="text-xs text-gray-500">{endpoint.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedEndpoint ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getMethodColor(selectedEndpoint.method)}`}>
                      {selectedEndpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-700">{selectedEndpoint.path}</code>
                    {selectedEndpoint.auth && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        Auth required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{selectedEndpoint.description}</p>
                </div>

                {/* Parameters */}
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Paramètres</h3>
                    <div className="space-y-2">
                      {selectedEndpoint.parameters.map((param, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            {param.name}
                          </code>
                          <span className="text-xs text-gray-500">{param.type}</span>
                          {param.required && <span className="text-xs text-red-500">*</span>}
                          <span className="text-xs text-gray-600 ml-2">{param.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Responses */}
                {selectedEndpoint.responses && selectedEndpoint.responses.length > 0 && (
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Réponses</h3>
                    <div className="space-y-2">
                      {selectedEndpoint.responses.map((resp, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            resp.code === 200 ? 'bg-green-100 text-green-700' :
                            resp.code === 400 ? 'bg-red-100 text-red-700' :
                            resp.code === 401 ? 'bg-orange-100 text-orange-700' :
                            resp.code === 403 ? 'bg-red-100 text-red-700' :
                            resp.code === 404 ? 'bg-yellow-100 text-yellow-700' :
                            resp.code === 402 ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {resp.code}
                          </span>
                          <span className="text-xs text-gray-600">{resp.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Example */}
                {selectedEndpoint.example && (
                  <div className="px-6 py-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">Exemple de réponse</h3>
                      <button
                        onClick={() => copyToClipboard(selectedEndpoint.example!)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Copier
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs">
                      <code>{selectedEndpoint.example}</code>
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <Code className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Sélectionnez un endpoint</h3>
                <p className="text-sm text-gray-500">
                  Choisissez un endpoint dans le menu de gauche pour voir sa documentation
                </p>
              </div>
            )}

            {/* Code Examples */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">Exemples d'intégration</h3>
              </div>
              <div className="p-6">
                <div className="flex gap-2 mb-4">
                  {Object.keys(codeExamples).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        activeLang === lang
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs">
                    <code>{codeExamples[activeLang as keyof typeof codeExamples]}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeExamples[activeLang as keyof typeof codeExamples])}
                    className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded hover:bg-gray-700 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mt-6">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Besoin d'aide ?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Notre équipe est disponible pour vous accompagner dans l'intégration de notre API.
              </p>
              <div className="flex gap-3">
                <a
                  href="mailto:api@bdb-consulting.com"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Mail className="w-4 h-4" />
                  api@bdb-consulting.com
                </a>
                <a
                  href="/docs/api.pdf"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  Documentation PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}