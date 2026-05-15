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

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    // Unsubscribe any existing stale subscription first
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      await existingSub.unsubscribe();
    }

    // Create fresh subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const subJson = subscription.toJSON();
    if (!subJson.endpoint) {
      console.error('Subscription has no endpoint');
      return false;
    }

    // Delete old records for this user first
    await (supabase as any).from('push_subscriptions').delete().eq('user_id', userId);

    // Save to Supabase (fresh insert)
    const { error } = await (supabase as any).from('push_subscriptions').insert({
      user_id: userId,
      clinic_id: clinicId,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh ?? '',
      auth_key: subJson.keys?.auth ?? '',
      subscription: subJson,
    });

    if (error) {
      console.error('Failed to save subscription:', error);
      return false;
    }

    // After insert, verify it was saved
    const { data: saved, error: verifyError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint')
      .eq('user_id', userId)
      .maybeSingle();

    if (verifyError || !saved) {
      console.error('Subscription not saved to Supabase:', verifyError);
      return false;
    }

    console.log('Push subscription verified in Supabase:', saved.id);
    return true;
  } catch (err) {
    console.error('subscribeToPushNotifications error:', err);
    return false;
  }
}
