import { supabase } from '@/integrations/supabase/client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function subscribeToPushNotifications(userId: string, clinicId: string) {
  const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID public key not set');
    return false;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported in this browser');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const subJson = subscription.toJSON();

    // Make sure endpoint exists before saving
    if (!subJson.endpoint) {
      console.error('No endpoint in subscription');
      return false;
    }

    await (supabase as any).from('push_subscriptions').upsert({
      user_id: userId,
      clinic_id: clinicId,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh ?? '',
      auth_key: subJson.keys?.auth ?? '',
      subscription: subJson,
    }, { onConflict: 'user_id,endpoint' });

    return true;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return false;
  }
}

export async function checkPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}
