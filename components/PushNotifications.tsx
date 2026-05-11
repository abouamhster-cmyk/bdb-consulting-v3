'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
      checkSubscription();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré');
    } catch (error) {
      console.error('Erreur SW:', error);
    }
  };

  const checkSubscription = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
  };

  const subscribe = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Vous devez être connecté');
      setIsLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, userId: user.id })
      });

      if (response.ok) {
        setIsSubscribed(true);
        toast.success('Notifications push activées');
      } else {
        toast.error('Erreur activation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'activation');
    }
    setIsLoading(false);
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }

    await fetch('/api/push-subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });

    setIsSubscribed(false);
    toast.success('Notifications push désactivées');
    setIsLoading(false);
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">⚠️ Votre navigateur ne supporte pas les notifications push.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="font-medium flex items-center gap-2">
          {isSubscribed ? <Bell className="w-4 h-4 text-green-600" /> : <BellOff className="w-4 h-4 text-gray-400" />}
          Notifications push
        </span>
        <p className="text-xs text-gray-500">Alertes même quand l'application est fermée</p>
      </div>
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition ${
          isSubscribed 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSubscribed ? 'Désactiver' : 'Activer')}
      </button>
    </div>
  );
}