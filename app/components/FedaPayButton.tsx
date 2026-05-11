'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface FedaPayButtonProps {
  amount: number;
  planName: string;
  planId: string;
  customerEmail: string;
  customerName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function FedaPayButton({
  amount,
  planName,
  planId,
  customerEmail,
  customerName,
  onSuccess,
  onError
}: FedaPayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (window.FedaPay) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.fedapay.com/v1/fedapay.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      onError('Chargement du système de paiement... Veuillez patienter');
      return;
    }

    setLoading(true);

    try {
      const publicKey = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY;
      
      if (!publicKey) {
        onError('Configuration de paiement manquante. Veuillez contacter le support.');
        setLoading(false);
        return;
      }

      window.FedaPay.init({
        public_key: publicKey,
        version: 'v1.1'
      });

      const response = await fetch('/api/fedapay/create-transaction-front', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          planName,
          amount,
          customerEmail,
          customerName
        })
      });

      const data = await response.json();

      if (data.error) {
        onError(data.error);
        setLoading(false);
        return;
      }

      const transactionId = data.transactionId;

      window.FedaPay.popup({
        transaction_id: transactionId,
        callback: (result: any) => {
          if (result.status === 'approved') {
            onSuccess();
          } else if (result.status === 'canceled') {
            onError('Paiement annulé');
          } else {
            onError('Paiement échoué');
          }
          setLoading(false);
        },
        onClose: () => {
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Erreur:', err);
      onError('Erreur lors du paiement');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || !scriptLoaded}
      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Traitement...
        </>
      ) : !scriptLoaded ? (
        <>
          Chargement...
        </>
      ) : (
        <>
          Payer {amount.toLocaleString()} FCFA
        </>
      )}
    </button>
  );
}
