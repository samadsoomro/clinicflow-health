import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      "mailto:admin@clinicflow.health",
      vapidPublicKey,
      vapidPrivateKey
    );

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const bodyData = await req.json();
    const { user_id, title, body } = bodyData;

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get all push subscriptions for this user
    const { data: subscriptions } = await adminClient
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: false, reason: "No subscriptions" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "clinic-reply",
      data: { url: "/messages" },
    });

    const results = [];

    for (const sub of subscriptions) {
      try {
        // Get subscription object
        const subscriptionObj = sub.subscription
          ? (typeof sub.subscription === "string" ? JSON.parse(sub.subscription) : sub.subscription)
          : { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } };

        if (!subscriptionObj?.endpoint) {
          await adminClient.from("push_subscriptions").delete().eq("id", sub.id);
          continue;
        }

        // Send using proper web-push with VAPID
        await webpush.sendNotification(subscriptionObj, payload);
        results.push({ id: sub.id, status: "sent" });

      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired — delete it
          await adminClient.from("push_subscriptions").delete().eq("id", sub.id);
          results.push({ id: sub.id, status: "deleted_expired" });
        } else {
          results.push({ id: sub.id, status: "error", error: err.message });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
