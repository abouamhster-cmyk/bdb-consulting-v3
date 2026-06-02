'use client';

import { useState, useEffect } from 'react';
import ChatAssistant from '@/components/ChatAssistant';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles, CheckCircle, MessageSquare, Image, Video,
  CalendarCheck, LayoutGrid, Loader2, Edit2,
  MessageCircle, ExternalLink
} from 'lucide-react';
import { FaLinkedin, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Post {
  id: string;
  day: number;
  title: string;
  hook: string;
  cta: string;
  content_type: string;
  text_linkedin?: string;
  text_instagram?: string;
  text_facebook?: string;
  text_twitter?: string;
  image_prompt_linkedin?: string;
  image_prompt_instagram?: string;
  image_prompt_facebook?: string;
  image_prompt_twitter?: string;
  image_url_linkedin?: string;
  image_url_instagram?: string;
  image_url_facebook?: string;
  image_url_twitter?: string;
  video_url?: string;
  video_script?: string;
  scheduled_at?: string;
  scheduled_platform?: string;
  scheduled_platforms?: Record<string, { scheduled_at?: string; status?: string }>;
  status_text: string;
  status_image_linkedin: string;
  status_image_instagram: string;
  status_image_facebook: string;
  status_image_twitter: string;
  status_video: string;
  status_scheduled: string;
  [key: string]: any;
}

interface Platform {
  id: string;
  name: string;
  icon: any;
  color: string;
}

type ScheduleSettings = Record<string, { date: string; time: string }>;

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSafeDate = (value?: string) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function CampaignVerticalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoGenerate = searchParams.get('generate') === 'true';

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatingTextMap, setGeneratingTextMap] = useState<Record<string, boolean>>({});
  const [generatingImageMap, setGeneratingImageMap] = useState<Record<string, boolean>>({});
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [activePlatforms, setActivePlatforms] = useState<Platform[]>([]);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({});
  const [promptsReady, setPromptsReady] = useState(false);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);

  const [editingText, setEditingText] = useState<{ postId: string; platform: string; content: string } | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<{ postId: string; platform: string; prompt: string } | null>(null);
  const [editingScript, setEditingScript] = useState<{ postId: string; script: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatType, setChatType] = useState<'text' | 'image' | 'video'>('text');
  const [chatPlatform, setChatPlatform] = useState('');
  const [chatPostId, setChatPostId] = useState('');
  const [chatCurrentContent, setChatCurrentContent] = useState('');


  const allPlatforms: Platform[] = [
    { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'bg-[#0077b5]' },
    { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'bg-[#e4405f]' },
    { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'bg-[#1877f2]' },
    { id: 'twitter', name: 'Twitter', icon: FaTwitter, color: 'bg-[#1da1f2]' }
  ];

  const steps = [
    { name: 'Textes', key: 'text', icon: MessageSquare },
    { name: 'Images', key: 'image', icon: Image },
    { name: 'Vidéo', key: 'video', icon: Video },
    { name: 'Programmation', key: 'schedule', icon: CalendarCheck }
  ];

  const currentPost = posts.find(p => p.id === selectedPostId);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (shouldAutoGenerate && posts.length > 0 && !generating && !hasGeneratedOnce) {
      setHasGeneratedOnce(true);
      generateAllContents();
    }
  }, [shouldAutoGenerate, posts, generating, hasGeneratedOnce]);

  useEffect(() => {
    if (activePlatforms.length === 0) return;

    const defaultDate = formatDateForInput(selectedDate);

    setScheduleSettings(prev => {
      const next = { ...prev };

      for (const platform of activePlatforms) {
        if (!next[platform.id]) {
          next[platform.id] = {
            date: defaultDate,
            time: selectedTime,
          };
        }
      }

      return next;
    });
  }, [activePlatforms, selectedDate, selectedTime]);

  const loadData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push('/auth');
      return;
    }

    const { data: params } = await supabase
      .from('generation_params')
      .select('selected_platforms')
      .eq('user_id', user.id)
      .maybeSingle();

    const selectedPlatforms: string[] = Array.isArray(params?.selected_platforms)
      ? params.selected_platforms
      : [];
    
    if (selectedPlatforms.length > 0) {
      const filtered = allPlatforms.filter(p => selectedPlatforms.includes(p.id));
      setActivePlatforms(filtered.length > 0 ? filtered : allPlatforms);
    } else {
      setActivePlatforms(allPlatforms);
    }

    const { data } = await supabase
      .from('post_skeleton')
      .select('*')
      .eq('user_id', user.id)
      .order('day', { ascending: true });

    if (data && data.length > 0) {
      setPosts(data);
      setSelectedPostId(data[0].id);
    }

    setLoading(false);
  };

  const updatePost = async (id: string, updates: any) => {
    const { error } = await supabase
      .from('post_skeleton')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }

    return !error;
  };

  const generateAllImagePrompts = async () => {
    if (isGeneratingPrompts) return;

    setIsGeneratingPrompts(true);
    setPromptsReady(false);
    setGenerationStatus('🎨 Génération des prompts images...');

    const { data: { user } } = await supabase.auth.getUser();

    for (const post of posts) {
      for (const platform of activePlatforms) {
        const promptField = `image_prompt_${platform.id}`;

        if (!post[promptField]) {
          try {
            const response = await fetch('/api/generate-image-prompt-by-platform', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postId: post.id, platform: platform.id, userId: user?.id })
            });

            const result = await response.json();

            if (result.success) {
              setPosts(prev => prev.map(p =>
                p.id === post.id ? { ...p, [promptField]: result.imagePrompt } : p
              ));
            }
          } catch (error) {
            console.error('Erreur prompt image:', error);
          }
        }
      }
    }

    setPromptsReady(true);
    setGenerationStatus('');
    setIsGeneratingPrompts(false);
  };

  const generateAllVideoScripts = async () => {
    if (isGeneratingScripts) return;

    setIsGeneratingScripts(true);
    setScriptsReady(false);
    setGenerationStatus('🎬 Génération des scripts vidéo...');

    const { data: { user } } = await supabase.auth.getUser();

    for (const post of posts) {
      if (!post.video_script) {
        try {
          const response = await fetch('/api/generate-video-script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post.id, userId: user?.id })
          });

          const result = await response.json();

          if (result.success) {
            setPosts(prev => prev.map(p =>
              p.id === post.id ? { ...p, video_script: result.script } : p
            ));
          }
        } catch (error) {
          console.error('Erreur script vidéo:', error);
        }
      }
    }

    setScriptsReady(true);
    setGenerationStatus('');
    setIsGeneratingScripts(false);
  };

  const generateAllContents = async () => {
    setGenerating(true);
    setGenerationProgress(0);

    const totalPosts = posts.length;
    const totalPlatforms = activePlatforms.length;
    const totalSteps = totalPosts * totalPlatforms;
    let completed = 0;

    const { data: { user } } = await supabase.auth.getUser();

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      setGenerationStatus(`📝 Génération du post ${i + 1}/${totalPosts}...`);

      for (const platform of activePlatforms) {
        const textField = `text_${platform.id}`;

        if (!post[textField]) {
          setGeneratingTextMap(prev => ({ ...prev, [`${post.id}_${platform.id}`]: true }));

          const response = await fetch('/api/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post.id, platform: platform.id, userId: user?.id })
          });

          const result = await response.json();

          if (result.success) {
            setPosts(prev => prev.map(p =>
              p.id === post.id ? { ...p, [textField]: result.content, status_text: 'completed' } : p
            ));
          }

          setGeneratingTextMap(prev => ({ ...prev, [`${post.id}_${platform.id}`]: false }));
        }

        completed++;
        setGenerationProgress((completed / totalSteps) * 100);
      }
    }

    setGenerationStatus('✅ Tous les textes ont été générés !');

    setTimeout(() => {
      setGenerationStatus('');
      setGenerating(false);
    }, 2000);
  };

  const generateText = async (platform: string) => {
    if (!currentPost) return;

    const postId = currentPost.id;
    setGeneratingTextMap(prev => ({ ...prev, [`${postId}_${platform}`]: true }));

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Vous devez être connecté');
      setGeneratingTextMap(prev => ({ ...prev, [`${postId}_${platform}`]: false }));
      return;
    }

    const response = await fetch('/api/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, platform, userId: user.id })
    });

    const result = await response.json();

    if (result.success) {
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, [`text_${platform}`]: result.content, status_text: 'completed' } : p
      ));
      toast.success(`Texte généré pour ${platform}`);
    } else {
      toast.error(result.error || 'Erreur de génération');
    }

    setGeneratingTextMap(prev => ({ ...prev, [`${postId}_${platform}`]: false }));
  };

  const generateImage = async (platform: string) => {
    if (!currentPost) return;

    const postId = currentPost.id;
    setGeneratingImageMap(prev => ({ ...prev, [`${postId}_${platform}`]: true }));

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Vous devez être connecté');
      setGeneratingImageMap(prev => ({ ...prev, [`${postId}_${platform}`]: false }));
      return;
    }

    const response = await fetch('/api/generate-image-by-platform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, platform, userId: user.id })
    });

    const result = await response.json();

    if (result.success) {
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, [`image_url_${platform}`]: result.imageUrl, [`status_image_${platform}`]: 'completed' } : p
      ));
      toast.success(`Image générée pour ${platform}`);
    } else {
      toast.error(result.error || 'Erreur génération image');
    }

    setGeneratingImageMap(prev => ({ ...prev, [`${postId}_${platform}`]: false }));
  };

  const generateVideo = async () => {
    if (!currentPost) return;

    setGeneratingVideo(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Vous devez être connecté');
      setGeneratingVideo(false);
      return;
    }

    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: currentPost.id,
        userId: user.id,
        script: currentPost.video_script
      })
    });

    const result = await response.json();

    if (result.success) {
      setPosts(prev => prev.map(p =>
        p.id === currentPost.id ? { ...p, video_url: result.videoUrl, status_video: 'completed' } : p
      ));
      toast.success('Vidéo générée');
    } else {
      toast.error(result.error || 'Erreur génération vidéo');
    }

    setGeneratingVideo(false);
  };

  const saveTextEdit = async () => {
    if (!editingText) return;

    setSaving(true);

    const success = await updatePost(editingText.postId, {
      [`text_${editingText.platform}`]: editingText.content
    });

    if (success) {
      setEditingText(null);
      toast.success('Texte modifié');
    }

    setSaving(false);
  };

  const savePromptEdit = async () => {
    if (!editingPrompt) return;

    setSaving(true);

    const success = await updatePost(editingPrompt.postId, {
      [`image_prompt_${editingPrompt.platform}`]: editingPrompt.prompt
    });

    if (success) {
      setEditingPrompt(null);
      toast.success('Prompt image modifié');
    }

    setSaving(false);
  };

  const saveScriptEdit = async () => {
    if (!editingScript) return;

    setSaving(true);

    const success = await updatePost(editingScript.postId, {
      video_script: editingScript.script
    });

    if (success) {
      setEditingScript(null);
      toast.success('Script vidéo modifié');
    }

    setSaving(false);
  };

  const validateStep = async (step: string, nextStep: number) => {
    if (!currentPost) return;

    await updatePost(currentPost.id, { [`status_${step}`]: 'completed' });
    setCurrentStep(nextStep);
    toast.success('Étape validée');
  };

  const getScheduledPlatforms = (post?: Post) => {
    if (!post?.scheduled_platforms || typeof post.scheduled_platforms !== 'object') {
      return {};
    }

    return post.scheduled_platforms;
  };

  const getPlatformSchedule = (platform: string) => {
    const schedules = getScheduledPlatforms(currentPost);

    if (schedules[platform]) {
      return schedules[platform];
    }

    if (currentPost?.scheduled_platform === platform && currentPost?.scheduled_at) {
      return { scheduled_at: currentPost.scheduled_at, status: currentPost.status_scheduled || 'scheduled' };
    }

    return null;
  };

  const updatePlatformScheduleSetting = (platform: string, field: 'date' | 'time', value: string) => {
    setScheduleSettings(prev => ({
      ...prev,
      [platform]: {
        date: prev[platform]?.date || formatDateForInput(selectedDate),
        time: prev[platform]?.time || selectedTime,
        [field]: value,
      },
    }));
  };

  const schedulePost = async (platform: string) => {
    if (!currentPost) return;

    setScheduling(true);

    const settings = scheduleSettings[platform] || {
      date: formatDateForInput(selectedDate),
      time: selectedTime,
    };

    const dateTime = new Date(`${settings.date}T${settings.time}:00`);

    if (Number.isNaN(dateTime.getTime())) {
      toast.error('Date ou heure invalide');
      setScheduling(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Vous devez être connecté');
      setScheduling(false);
      return;
    }

    const response = await fetch('/api/schedule-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: currentPost.id,
        platform,
        userId: user.id,
        scheduledDate: dateTime.toISOString(),
      })
    });

    const result = await response.json();

    if (result.success) {
      const previousSchedules = getScheduledPlatforms(currentPost);
      const nextSchedules = {
        ...previousSchedules,
        [platform]: {
          scheduled_at: dateTime.toISOString(),
          status: 'scheduled',
        },
      };

      setPosts(prev => prev.map(post => (
        post.id === currentPost.id
          ? {
              ...post,
              status_scheduled: 'scheduled',
              scheduled_at: dateTime.toISOString(),
              scheduled_platform: platform,
              scheduled_platforms: nextSchedules,
              updated_at: new Date().toISOString(),
            }
          : post
      )));

      toast.success(`✅ Post programmé en interne pour ${platform}`);
      setShowScheduler(false);
    } else {
      toast.error(result.error || 'Erreur de programmation');
    }

    setScheduling(false);
  };

  const openChat = (type: 'text' | 'image' | 'video', platform?: string) => {
    if (!currentPost) return;

    setChatType(type);
    setChatPlatform(platform || '');
    setChatPostId(currentPost.id);

    if (type === 'text' && platform) {
      setChatCurrentContent(currentPost[`text_${platform}`] || '');
    } else if (type === 'image' && platform) {
      setChatCurrentContent(currentPost[`image_prompt_${platform}`] || '');
    } else if (type === 'video') {
      setChatCurrentContent(currentPost.video_script || '');
    }

    setShowChat(true);
  };

  const updateContentFromChat = async (newContent: string) => {
    if (!currentPost || !chatType) return;

    if (chatType === 'text' && chatPlatform) {
      await updatePost(currentPost.id, { [`text_${chatPlatform}`]: newContent });
      toast.success('Texte mis à jour');
    } else if (chatType === 'image' && chatPlatform) {
      await updatePost(currentPost.id, { [`image_prompt_${chatPlatform}`]: newContent });
      toast.success('Prompt image mis à jour');
    } else if (chatType === 'video') {
      await updatePost(currentPost.id, { video_script: newContent });
      toast.success('Script vidéo mis à jour');
    }
  };

  const handleStepChange = (idx: number) => {
    setCurrentStep(idx);

    if (idx === 1 && !promptsReady && !isGeneratingPrompts && !generating) {
      generateAllImagePrompts();
    }

    if (idx === 2 && !scriptsReady && !isGeneratingScripts && !generating) {
      generateAllVideoScripts();
    }
  };

  const getImageStatus = (platform: string) => {
    return currentPost?.[`status_image_${platform}`] === 'completed';
  };

  const getImageUrl = (platform: string) => {
    return currentPost?.[`image_url_${platform}`];
  };

  const getImagePrompt = (platform: string) => {
    return currentPost?.[`image_prompt_${platform}`];
  };

  const isScheduled = Boolean(
    currentPost && (
      Object.keys(getScheduledPlatforms(currentPost)).length > 0 ||
      currentPost.status_scheduled === 'scheduled' ||
      currentPost.status_scheduled === 'completed'
    )
  );

  const ProgressBar = () => (
    <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border">
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {generationStatus}
        </span>
        <span className="text-blue-600 font-medium">{Math.round(generationProgress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
          style={{ width: `${generationProgress}%` }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <LayoutGrid className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-gray-500 mb-4">Aucun post trouvé</p>
          <button
            onClick={() => router.push('/skeleton')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium"
          >
            Générer un squelette
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow de création</h1>
          <p className="text-gray-500 mt-2">Générez vos contenus post par post</p>
        </div>

        {generating && <ProgressBar />}

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {posts.map(post => {
            const postScheduled = post.status_scheduled === 'scheduled' || post.status_scheduled === 'completed';

            return (
              <button
                key={post.id}
                onClick={() => { setSelectedPostId(post.id); setCurrentStep(0); }}
                className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1 ${
                  selectedPostId === post.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CalendarCheck className="w-3 h-3" />
                Jour {post.day}
                {postScheduled && <CheckCircle className="w-3 h-3 text-green-500 ml-1" />}
              </button>
            );
          })}
        </div>

        {currentPost && (
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Jour {currentPost.day}</h2>
                  <p className="text-blue-100 text-sm">{currentPost.title}</p>
                </div>

                <button
                  onClick={() => openChat('text')}
                  className="px-3 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Assistant IA
                </button>
              </div>
            </div>

            <div className="flex border-b">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isCurrent = idx === currentStep;

                return (
                  <button
                    key={step.key}
                    onClick={() => handleStepChange(idx)}
                    className={`flex-1 py-3 text-center transition ${
                      isCurrent ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'
                    }`}
                  >
                    <StepIcon className="w-4 h-4 inline mr-1" />
                    {step.name}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">Générez du contenu adapté à chaque réseau social</p>

                  {activePlatforms.map(platform => {
                    const PlatformIcon = platform.icon;
                    const text = currentPost[`text_${platform.id}`];
                    const isGenerating = generatingTextMap[`${currentPost.id}_${platform.id}`];

                    return (
                      <div key={platform.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <PlatformIcon className="w-5 h-5" />
                            <span className="font-semibold">{platform.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {text && (
                              <button onClick={() => openChat('text', platform.id)} className="text-purple-600 text-xs">
                                <MessageCircle className="w-3 h-3 inline" /> IA
                              </button>
                            )}

                            {!text && !isGenerating && !generating && (
                              <button onClick={() => generateText(platform.id)} className="text-blue-600 text-sm">
                                Générer
                              </button>
                            )}

                            {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
                          </div>
                        </div>

                        {text ? (
                          editingText?.postId === currentPost.id && editingText?.platform === platform.id ? (
                            <div>
                              <textarea
                                value={editingText.content}
                                onChange={(e) => setEditingText({ ...editingText, content: e.target.value })}
                                className="w-full text-sm bg-gray-50 p-3 rounded-lg border"
                                rows={6}
                              />
                              <div className="flex gap-2 mt-2">
                                <button onClick={saveTextEdit} disabled={saving} className="text-green-600 text-sm">Sauvegarder</button>
                                <button onClick={() => setEditingText(null)} className="text-gray-500 text-sm">Annuler</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">{text}</p>
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => generateText(platform.id)} className="text-amber-600 text-sm">Regénérer</button>
                                <button
                                  onClick={() => setEditingText({ postId: currentPost.id, platform: platform.id, content: text })}
                                  className="text-blue-600 text-sm"
                                >
                                  Modifier
                                </button>
                              </div>
                            </div>
                          )
                        ) : !isGenerating && (
                          <p className="text-gray-400 text-sm italic">Non généré</p>
                        )}
                      </div>
                    );
                  })}

                  <button onClick={() => validateStep('text', 1)} className="w-full bg-green-600 text-white py-3 rounded-xl font-medium mt-4">
                    Valider les textes
                  </button>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  {isGeneratingPrompts && (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Génération des prompts images...</p>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mb-4">Générez une image adaptée à chaque réseau social</p>

                  {activePlatforms.map(platform => {
                    const PlatformIcon = platform.icon;
                    const hasImage = getImageStatus(platform.id);
                    const imageUrl = getImageUrl(platform.id);
                    const imagePrompt = getImagePrompt(platform.id);
                    const isGenerating = generatingImageMap[`${currentPost.id}_${platform.id}`];

                    return (
                      <div key={platform.id} className="border rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <PlatformIcon className="w-5 h-5" />
                            <span className="font-semibold">{platform.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {imagePrompt && (
                              <button onClick={() => openChat('image', platform.id)} className="text-purple-600 text-xs">
                                <MessageCircle className="w-3 h-3 inline" /> IA
                              </button>
                            )}

                            {!hasImage && !isGenerating && !generating && !isGeneratingPrompts && (
                              <button onClick={() => generateImage(platform.id)} className="text-blue-600 text-sm">
                                Générer image
                              </button>
                            )}

                            {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
                            {hasImage && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="text-xs text-gray-500 mb-1">Prompt</div>

                          {editingPrompt?.postId === currentPost.id && editingPrompt?.platform === platform.id ? (
                            <div>
                              <textarea
                                value={editingPrompt.prompt}
                                onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: e.target.value })}
                                className="w-full text-sm p-2 border rounded-lg"
                                rows={3}
                              />
                              <div className="flex gap-2 mt-2">
                                <button onClick={savePromptEdit} disabled={saving} className="text-green-600 text-xs">Sauvegarder</button>
                                <button onClick={() => setEditingPrompt(null)} className="text-gray-500 text-xs">Annuler</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-gray-600 line-clamp-4">
                                {imagePrompt || (isGeneratingPrompts ? 'Génération...' : 'Non généré')}
                              </p>
                              {imagePrompt && (
                                <button
                                  onClick={() => setEditingPrompt({ postId: currentPost.id, platform: platform.id, prompt: imagePrompt })}
                                  className="text-blue-600 text-xs mt-1"
                                >
                                  Modifier
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {imageUrl ? (
                          <div>
                            <div className="relative w-full rounded-xl overflow-hidden bg-gray-100 border">
                              <img
                                src={imageUrl}
                                alt={`${platform.name} - ${currentPost.title}`}
                                className="w-full max-h-[520px] object-contain bg-gray-100"
                              />
                            </div>

                            <div className="flex flex-wrap gap-3 mt-3">
                              <button onClick={() => generateImage(platform.id)} className="text-amber-600 text-sm">
                                Regénérer
                              </button>
                              <a href={imageUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                Ouvrir
                              </a>
                              <a href={imageUrl} download className="text-gray-600 text-sm">
                                Télécharger
                              </a>
                            </div>
                          </div>
                        ) : !isGenerating && !generating && !isGeneratingPrompts && (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">Image non générée</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button onClick={() => validateStep('image', 2)} className="w-full bg-green-600 text-white py-3 rounded-xl font-medium mt-4">
                    Valider les images
                  </button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  {isGeneratingScripts && (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Génération des scripts vidéo...</p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Script vidéo</span>
                      {currentPost.video_script && (
                        <button onClick={() => openChat('video')} className="text-purple-600 text-xs">
                          <MessageCircle className="w-3 h-3 inline" /> IA
                        </button>
                      )}
                    </div>

                    {editingScript?.postId === currentPost.id ? (
                      <div>
                        <textarea
                          value={editingScript.script}
                          onChange={(e) => setEditingScript({ ...editingScript, script: e.target.value })}
                          className="w-full p-3 border rounded-lg"
                          rows={5}
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={saveScriptEdit} disabled={saving} className="text-green-600 text-sm">Sauvegarder</button>
                          <button onClick={() => setEditingScript(null)} className="text-gray-500 text-sm">Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">
                          {currentPost.video_script || (isGeneratingScripts ? 'Génération...' : 'Non généré')}
                        </p>
                        {currentPost.video_script && (
                          <button
                            onClick={() => setEditingScript({ postId: currentPost.id, script: currentPost.video_script || '' })}
                            className="text-blue-600 text-sm mt-2"
                          >
                            Modifier le script
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {!currentPost.video_url ? (
                    <button
                      onClick={generateVideo}
                      disabled={generatingVideo || isGeneratingScripts}
                      className="w-full py-3 bg-purple-600 text-white rounded-xl disabled:opacity-50"
                    >
                      {generatingVideo ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                      {generatingVideo ? 'Génération vidéo en cours...' : 'Générer la vidéo'}
                    </button>
                  ) : (
                    <div className="border rounded-xl overflow-hidden bg-black">
                      <video
                        src={currentPost.video_url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-[520px] bg-black"
                      />
                      <div className="bg-white p-3 flex flex-wrap gap-3">
                        <button onClick={generateVideo} className="text-amber-600 text-sm">
                          Regénérer
                        </button>
                        <a href={currentPost.video_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Ouvrir
                        </a>
                        <a href={currentPost.video_url} download className="text-gray-600 text-sm">
                          Télécharger
                        </a>
                      </div>
                    </div>
                  )}

                  <button onClick={() => validateStep('video', 3)} className="w-full bg-green-600 text-white py-3 rounded-xl mt-4">
                    Valider la vidéo
                  </button>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5">
                  {isScheduled && (
                    <div className="text-green-700 py-6 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <CheckCircle className="w-6 h-6" />
                        <p className="font-semibold">Programmation enregistrée</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
                        {activePlatforms.map(platform => {
                          const PlatformIcon = platform.icon;
                          const platformSchedule = getPlatformSchedule(platform.id);

                          if (!platformSchedule?.scheduled_at) return null;

                          return (
                            <div key={platform.id} className="bg-white rounded-lg p-3 border text-left">
                              <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <PlatformIcon className="w-4 h-4" />
                                {platform.name}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Le {getSafeDate(platformSchedule.scheduled_at).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 border rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Type de post</p>
                    <p className="font-semibold text-gray-900">
                      {currentPost.content_type || 'Post marketing'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Choisissez une date et une heure différentes pour chaque plateforme. La programmation est enregistrée en interne, sans Buffer.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {activePlatforms.map(platform => {
                      const PlatformIcon = platform.icon;
                      const text = currentPost[`text_${platform.id}`];
                      const image = currentPost[`image_url_${platform.id}`];
                      const hasVideo = Boolean(currentPost.video_url);
                      const platformSchedule = getPlatformSchedule(platform.id);
                      const settings = scheduleSettings[platform.id] || {
                        date: formatDateForInput(selectedDate),
                        time: selectedTime,
                      };

                      return (
                        <div key={platform.id} className="border rounded-xl p-4 bg-white">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <PlatformIcon className="w-5 h-5" />
                              <span className="font-semibold">{platform.name}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${text ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {text ? 'Texte prêt' : 'Texte manquant'}
                            </span>
                          </div>

                          {platformSchedule?.scheduled_at && (
                            <div className="mb-3 bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-700">
                              Déjà programmé : {getSafeDate(platformSchedule.scheduled_at).toLocaleString('fr-FR')}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Date pour {platform.name}
                              </label>
                              <input
                                type="date"
                                value={settings.date}
                                onChange={(e) => updatePlatformScheduleSetting(platform.id, 'date', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Heure pour {platform.name}
                              </label>
                              <input
                                type="time"
                                value={settings.time}
                                onChange={(e) => updatePlatformScheduleSetting(platform.id, 'time', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                            <p className="text-xs text-gray-600">Publication prévue sur {platform.name}</p>
                            <p className="font-semibold text-gray-900">
                              {getSafeDate(`${settings.date}T${settings.time}:00`).toLocaleString('fr-FR')}
                            </p>
                          </div>

                          {text ? (
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-3 line-clamp-4 whitespace-pre-wrap">
                              {text}
                            </p>
                          ) : (
                            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mb-3">
                              Générez d'abord le texte pour {platform.name} avant de programmer.
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <p className="text-xs text-gray-500 mb-1">Image</p>
                              <p className={image ? 'text-green-600 text-sm font-medium' : 'text-red-500 text-sm'}>
                                {image ? 'Disponible' : 'Non générée'}
                              </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <p className="text-xs text-gray-500 mb-1">Vidéo</p>
                              <p className={hasVideo ? 'text-green-600 text-sm font-medium' : 'text-gray-400 text-sm'}>
                                {hasVideo ? 'Disponible' : 'Optionnelle'}
                              </p>
                            </div>
                          </div>

                          {image && (
                            <div className="mb-3 rounded-lg overflow-hidden border bg-gray-100">
                              <img
                                src={image}
                                alt={`Aperçu ${platform.name}`}
                                className="w-full max-h-[450px] object-contain bg-gray-100"
                              />
                            </div>
                          )}

                          {currentPost.video_url && (
                            <div className="mb-3 rounded-lg overflow-hidden border bg-black">
                              <video
                                src={currentPost.video_url}
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full max-h-[420px] bg-black"
                              />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => schedulePost(platform.id)}
                            disabled={!text || scheduling}
                            className={`${platform.color} w-full text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50`}
                          >
                            {scheduling ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <PlatformIcon className="w-4 h-4" />
                            )}
                            {platformSchedule?.scheduled_at ? `Reprogrammer sur ${platform.name}` : `Programmer sur ${platform.name}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-green-600 text-white py-3 rounded-xl mt-4"
                  >
                    Terminer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showChat && (
        <ChatAssistant
          postId={chatPostId}
          currentContent={chatCurrentContent}
          type={chatType}
          onUpdate={updateContentFromChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
