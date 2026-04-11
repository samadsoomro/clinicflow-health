import { useState, useEffect } from "react";
import { MessageSquare, Bell, BellOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = "BPHFAUKxOCLPEF_Jh8Mdf2c42Y90h3AmWfNxbgeaCNj8lCnGcrVO-n33vEbri5hD8ub5948HHCDQlUqWnaJnMk4";

export const PushNotificationManager = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    const checkSubscription = async () => {
      if (!user || !("serviceWorker" in navigator)) return;
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    };

    checkSubscription();
  }, [user]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    if (!user) {
      toast.error("Please login to enable notifications.");
      return;
    }

    setLoading(true);
    try {
      // 1. Register Service Worker (if not already)
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker not supported");
      }

      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;

      // 2. Request Permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        throw new Error("Notification permission denied");
      }

      // 3. Subscribe to Push Manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 4. Save to Database
      const { error } = await (supabase as any).from("push_subscriptions").insert({
        user_id: user.id,
        subscription: subscription.toJSON(),
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Notifications enabled!", {
        description: "You will now get alerts when the clinic replies.",
      });

      // Play a test sound
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(() => {});
      
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to enable notifications.");
    } finally {
      setLoading(false);
    }
  };

  if (!("Notification" in window)) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 max-w-md w-full">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSubscribed ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
          {isSubscribed ? <Bell className="text-green-500" /> : <BellOff className="text-blue-500" />}
        </div>
        <div>
          <h3 className="font-bold text-lg">Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isSubscribed ? "You're all set to receive alerts." : "Get alerts for clinic replies on your lock screen."}
          </p>
        </div>
      </div>

      {!isSubscribed ? (
        <Button 
          onClick={subscribe} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? "Enabling..." : (
            <>
              <CheckCircle size={18} />
              Enable Push Notifications
            </>
          )}
        </Button>
      ) : (
        <div className="text-center py-2 text-green-500 text-sm font-medium flex items-center justify-center gap-1">
          <CheckCircle size={16} /> Notifications Active
        </div>
      )}
    </div>
  );
};
