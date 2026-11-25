'use client';
import { useState, useEffect } from 'react';

const API = 'http://127.0.0.1:8000/api/v1';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function EnableAlertsButton({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'subscribed' | 'unsupported' | 'denied'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    navigator.serviceWorker.getRegistration('/sw.js').then((reg) => {
      if (!reg) return;
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setStatus('subscribed');
      });
    });
  }, []);

  const handleSubscribe = async () => {
    setStatus('loading');
    setMsg('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        setMsg('Browser permission denied.');
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const keyRes = await fetch(`${API}/notifications/vapid-key/`);
      const { public_key } = await keyRes.json();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });

      const subRes = await fetch(`${API}/notifications/subscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      if (!subRes.ok) throw new Error('Failed to register subscription on server');
      setStatus('subscribed');
      setMsg('Free browser & lock-screen alerts enabled!');
    } catch (e: unknown) {
      setStatus('idle');
      setMsg(e instanceof Error ? e.message : 'Could not enable alerts');
    }
  };

  if (status === 'unsupported') return null;

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={status === 'loading' || status === 'subscribed'}
        className={`pill-btn px-4 py-2 text-xs font-bold transition-all ${
          status === 'subscribed'
            ? 'bg-green-600/20 text-green-300 border border-green-400/40 cursor-default'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/25'
        }`}
        title={msg || 'Enable free instant recall push alerts'}
      >
        {status === 'subscribed' ? '✅ Alerts On' : status === 'loading' ? '⏳...' : '🔔 Enable Alerts'}
      </button>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={status === 'loading' || status === 'subscribed'}
        className={`pill-btn px-5 py-2.5 text-sm font-bold shadow-md transition-all ${
          status === 'subscribed'
            ? 'bg-green-600 text-white cursor-default'
            : status === 'denied'
            ? 'bg-red-100 text-red-700 border border-red-300'
            : 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white'
        }`}
      >
        {status === 'subscribed'
          ? '✅ Free Push Alerts Enabled'
          : status === 'loading'
          ? '⏳ Enabling...'
          : status === 'denied'
          ? '🚫 Notifications Blocked in Browser'
          : '🔔 Enable Free Push Alerts (₹0)'}
      </button>
      {msg && <span className="text-xs text-green-700 font-semibold">{msg}</span>}
    </div>
  );
}
