import { supabase } from '@/integrations/supabase/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function subscribeToPushNotifications(
  userId: string,
  clinicId: string
): Promise<boolean> {
  try {
    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID_PUBLIC_KEY not configured');
      return false;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push not supported');
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // Request permission (shows browser dialog)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permission not granted:', permission);
      return false;
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const subJson = subscription.toJSON();
    if (!subJson.endpoint) {
      console.error('Subscription has no endpoint');
      return false;
    }

    // Save to Supabase
    const { error } = await (supabase as any).from('push_subscriptions').upsert(
      {
        user_id: userId,
        clinic_id: clinicId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh ?? '',
        auth_key: subJson.keys?.auth ?? '',
        subscription: subJson,
      },
      { onConflict: 'user_id,endpoint' }
    );

    if (error) {
      console.error('Failed to save subscription:', error);
      return false;
    }

    console.log('Push subscription saved successfully');
    return true;
  } catch (err) {
    console.error('subscribeToPushNotifications error:', err);
    return false;
  }
}
