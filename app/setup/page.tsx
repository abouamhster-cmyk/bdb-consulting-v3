'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Building2, Target, User, Map, Edit3, Palette, Megaphone,
  CheckCircle, ArrowRight, ArrowLeft, Save
} from 'lucide-react';

interface CompanyConfig {
  company_name: string;
  logo_url: string;
  brand_positioning: string;
  persona: string;
  customer_journey: string;
  editorial_charter: string;
  graphic_charter: string;
  communication_strategy: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<CompanyConfig>({
    company_name: '',
    logo_url: '',
    brand_positioning: '',
    persona: '',
    customer_journey: '',
    editorial_charter: '',
    graphic_charter: '',
    communication_strategy: ''
  });

  const steps = [
    { name: 'Entreprise', icon: Building2, field: 'company_name', description: 'Informations générales' },
    { name: 'Positionnement', icon: Target, field: 'brand_positioning', description: 'Votre identité unique' },
    { name: 'Persona', icon: User, field: 'persona', description: 'Votre client idéal' },
    { name: 'Parcours', icon: Map, field: 'customer_journey', description: 'Le chemin de vos clients' },
    { name: 'Éditorial', icon: Edit3, field: 'editorial_charter', description: 'Ton et sujets' },
    { name: 'Graphique', icon: Palette, field: 'graphic_charter', description: 'Couleurs et styles' },
    { name: 'Communication', icon: Megaphone, field: 'communication_strategy', description: 'Objectifs et canaux' }
  ];

  useEffect(() => {
    loadExistingConfig();
  }, []);

  const loadExistingConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('company_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setConfig({
        company_name: data.company_name || '',
        logo_url: data.logo_url || '',
        brand_positioning: data.brand_positioning || '',
        persona: data.persona || '',
        customer_journey: data.customer_journey || '',
        editorial_charter: data.editorial_charter || '',
        graphic_charter: data.graphic_charter || '',
        communication_strategy: data.communication_strategy || ''
      });
    }
  };

  const handleChange = (field: keyof CompanyConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!config.company_name) {
      alert('Veuillez saisir le nom de votre entreprise');
      return;
    }
    
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Utilisateur non trouvé');
      setLoading(false);
      return;
    }
    
    // Vérifier si une config existe déjà
    const { data: existingConfig } = await supabase
      .from('company_config')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    let error = null;
    
    if (existingConfig) {
      // Mise à jour
      const { error: updateError } = await supabase
        .from('company_config')
        .update({
          company_name: config.company_name,
          logo_url: config.logo_url,
          brand_positioning: config.brand_positioning,
          persona: config.persona,
          customer_journey: config.customer_journey,
          editorial_charter: config.editorial_charter,
          graphic_charter: config.graphic_charter,
          communication_strategy: config.communication_strategy,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      error = updateError;
    } else {
      // Insertion
      const { error: insertError } = await supabase
        .from('company_config')
        .insert({
          user_id: user.id,
          company_name: config.company_name,
          logo_url: config.logo_url,
          brand_positioning: config.brand_positioning,
          persona: config.persona,
          customer_journey: config.customer_journey,
          editorial_charter: config.editorial_charter,
          graphic_charter: config.graphic_charter,
          communication_strategy: config.communication_strategy,
          status: 'completed'
        });
      error = insertError;
    }
    
    if (error) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    } else {
      router.push('/params');
    }
    setLoading(false);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const CurrentIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Configurez votre entreprise</h1>
          <p className="text-gray-500 mt-2">Ces informations serviront de base à toute votre stratégie</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Progression</span>
            <span className="font-medium text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between mb-10 overflow-x-auto pb-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className="flex flex-col items-center gap-2 min-w-[70px] group"
              >
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md scale-105' 
                    : isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-white border border-gray-200 text-gray-400 group-hover:border-gray-300'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Step Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <CurrentIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{currentStepData.name}</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">{currentStepData.description}</p>

            {currentStep === 0 && (
              <div>
                <input
                  type="text"
                  value={config.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Nom de votre entreprise"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            )}

            {currentStep >= 1 && (
              <div>
                <textarea
                  value={config[currentStepData.field as keyof CompanyConfig] as string}
                  onChange={(e) => handleChange(currentStepData.field as keyof CompanyConfig, e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={8}
                  placeholder={`Décrivez ${currentStepData.name.toLowerCase()}...`}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="bg-gray-50 px-8 py-5 flex justify-between items-center border-t border-gray-100">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>
            ) : (
              <div />
            )}
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Terminer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}