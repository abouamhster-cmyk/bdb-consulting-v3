import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface SubscriptionInfo {
  hasTokens: boolean;
  remaining: number;
  plan: string;
  loading: boolean;
  usageText: number;
  usageImage: number;
  usageVideo: number;
  limitText: number;
  limitImage: number;
  limitVideo: number;
}

const PLAN_LIMITS: Record<string, { text: number; image: number; video: number }> = {
  starter: { text: 30, image: 0, video: 0 },
  pro: { text: 100, image: 50, video: 0 },
  business: { text: 500, image: 200, video: 50 }
};

export function useSubscription(type: 'text' | 'image' | 'video') {
  const [info, setInfo] = useState<SubscriptionInfo>({
    hasTokens: false,
    remaining: 0,
    plan: 'starter',
    loading: true,
    usageText: 0,
    usageImage: 0,
    usageVideo: 0,
    limitText: 30,
    limitImage: 0,
    limitVideo: 0
  });

  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMounted.current = true;
    checkSubscription();

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [type]);

  const checkSubscription = async () => {
    try {
      abortControllerRef.current = new AbortController();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (isMounted.current) {
          setInfo(prev => ({ ...prev, loading: false }));
        }
        return;
      }

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('plan_name, usage_text, usage_image, usage_video')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && isMounted.current) {
        console.error('Erreur subscription:', error);
        setInfo(prev => ({ ...prev, loading: false }));
        return;
      }

      const planName = subscription?.plan_name || 'starter';
      const limits = PLAN_LIMITS[planName];
      
      const usage = {
        text: subscription?.usage_text || 0,
        image: subscription?.usage_image || 0,
        video: subscription?.usage_video || 0
      };

      const limit = limits[type];
      const remaining = Math.max(0, limit - usage[type]);
      const hasTokens = remaining > 0;

      if (isMounted.current) {
        setInfo({
          hasTokens,
          remaining,
          plan: planName,
          loading: false,
          usageText: usage.text,
          usageImage: usage.image,
          usageVideo: usage.video,
          limitText: limits.text,
          limitImage: limits.image,
          limitVideo: limits.video
        });
      }
    } catch (err) {
      if (isMounted.current) {
        setInfo(prev => ({ ...prev, loading: false }));
      }
    }
  };

  return info;
}