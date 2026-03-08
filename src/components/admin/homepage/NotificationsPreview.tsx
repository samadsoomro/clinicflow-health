import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface NotificationsContent {
  title: string;
  subtitle: string;
}

interface NotificationsPreviewProps {
  content: NotificationsContent;
  onChange: (content: NotificationsContent) => void;
  clinicId: string;
}

export const NotificationsPreview = ({ content, onChange, clinicId }: NotificationsPreviewProps) => {
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, priority, created_at")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      setNotifs(data || []);
    };
    fetch();
  }, [clinicId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} placeholder="Latest Updates" />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input value={content.subtitle} onChange={(e) => onChange({ ...content, subtitle: e.target.value })} placeholder="Stay informed" />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Preview (Latest 3 Active Notifications)</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Notifications are managed from the Notifications page. The latest 3 active ones will automatically appear on the homepage.
        </p>
        {notifs.length > 0 ? (
          <div className="space-y-2">
            {notifs.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.priority === "urgent" && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-muted-foreground text-sm">No active notifications. This section will be hidden on the homepage.</p>
        )}
      </div>
    </div>
  );
};
