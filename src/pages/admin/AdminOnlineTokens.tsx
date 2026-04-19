import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Ticket, Users, Clock, Settings, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";

const AdminOnlineTokens = () => {
  const { clinicId } = useClinicId();
  const [loading, setLoading] = useState(true);
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [popupEnglish, setPopupEnglish] = useState("");
  const [popupSecondLang, setPopupSecondLang] = useState("");
  const [popupSecondLangEnabled, setPopupSecondLangEnabled] = useState(false);
  const [onlineTokens, setOnlineTokens] = useState<any[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('clinics').select('online_tokens_enabled, online_tokens_daily_limit, online_token_popup_english, online_token_popup_second_lang, online_token_popup_second_lang_enabled').eq('id', clinicId).single();
      if (data) {
        setOnlineEnabled(data.online_tokens_enabled || false);
        setDailyLimit(data.online_tokens_daily_limit || 10);
        setPopupEnglish(data.online_token_popup_english || "");
        setPopupSecondLang(data.online_token_popup_second_lang || "");
        setPopupSecondLangEnabled(data.online_token_popup_second_lang_enabled || false);
      }
    };

    const fetchTokens = async () => {
      const { data } = await supabase
        .from('online_tokens')
        .select(`*, doctors(name)`)
        .eq('clinic_id', clinicId)
        .eq('token_date', today)
        .order('created_at', { ascending: true });
      setOnlineTokens(data || []);
    };

    if (clinicId) {
      Promise.all([fetchSettings(), fetchTokens()]).then(() => setLoading(false));

      const channel = supabase
        .channel("admin-online-tokens")
        .on("postgres_changes", { event: "*", schema: "public", table: "online_tokens", filter: `clinic_id=eq.${clinicId}` }, () => {
          fetchTokens();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [clinicId, today]);

  const handleToggleOnline = async (checked: boolean) => {
    const { error } = await supabase.from('clinics').update({ online_tokens_enabled: checked }).eq('id', clinicId);
    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      setOnlineEnabled(checked);
      toast.success(checked ? 'Online Tokens enabled' : 'Online Tokens disabled');
    }
  };

  const handleSaveLimit = async () => {
    const { error } = await supabase.from('clinics').update({ online_tokens_daily_limit: dailyLimit }).eq('id', clinicId);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success('Daily limit saved');
    }
  };

  const handleSavePopupSettings = async () => {
    const { error } = await supabase.from('clinics').update({
      online_token_popup_english: popupEnglish || null,
      online_token_popup_second_lang: popupSecondLangEnabled ? (popupSecondLang || null) : null,
      online_token_popup_second_lang_enabled: popupSecondLangEnabled,
    }).eq('id', clinicId);
    
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success('Popup settings saved');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="font-display text-2xl font-bold text-foreground">Online Tokens</h2>
      </div>

      <div className="space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card shadow-soft">
          <div>
            <h3 className="font-semibold text-foreground">Enable Online Token Menu</h3>
            <p className="text-sm text-muted-foreground">
              Shows "Online Token" in public navbar and a button in homepage footer
            </p>
          </div>
          <Switch checked={onlineEnabled} onCheckedChange={handleToggleOnline} />
        </div>

        {/* Daily limit */}
        {onlineEnabled && (
          <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card shadow-soft">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Daily Online Token Limit</h3>
              <p className="text-sm text-muted-foreground">Maximum online tokens that can be issued per day</p>
            </div>
            <Input
              type="number"
              min={1}
              max={100}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-24 border rounded-lg p-2 text-center font-bold text-lg"
            />
            <Button onClick={handleSaveLimit} size="sm">Save</Button>
          </div>
        )}

        {/* Popup settings */}
        {onlineEnabled && (
          <div className="p-4 border border-border rounded-xl bg-card shadow-soft space-y-4">
            <h3 className="font-semibold text-foreground">Token Receipt Popup Instructions</h3>
            <p className="text-xs text-muted-foreground">
              This message appears after a patient receives their online token. It is shown as a popup with a downloadable token image.
            </p>
            <Textarea
              value={popupEnglish}
              onChange={(e) => setPopupEnglish(e.target.value)}
              rows={4}
              placeholder="Default: Please download your token slip and bring it to the clinic. Present this token when your number is called. Do not rely on live token count — please arrive early. The clinic is not responsible if your number passes while you are away."
              className="w-full"
            />
            <div className="flex items-center gap-3">
              <Switch checked={popupSecondLangEnabled} onCheckedChange={setPopupSecondLangEnabled} />
              <label className="text-sm font-medium">Show second language translation</label>
            </div>
            {popupSecondLangEnabled && (
              <Textarea
                value={popupSecondLang}
                onChange={(e) => setPopupSecondLang(e.target.value)}
                rows={4}
                dir="rtl"
                placeholder="براہِ کرم اپنا ٹوکن سلپ ڈاؤن لوڈ کریں اور کلینک آتے وقت ساتھ لائیں۔ جب آپ کا نمبر آئے تو یہ ٹوکن پیش کریں۔ لائیو ٹوکن نمبر پر انحصار نہ کریں — برائے مہربانی جلدی پہنچیں۔ کلینک اس بات کا ذمہ دار نہیں کہ آپ کا نمبر آپ کی غیر موجودگی میں گزر جائے۔"
                className="w-full font-arabic"
                style={{ fontFamily: 'serif' }}
              />
            )}
            <Button onClick={handleSavePopupSettings} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> Save Popup Settings
            </Button>
          </div>
        )}
      </div>

      {/* Online Tokens List */}
      {onlineEnabled && (
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-lg text-foreground">
            Today's Online Tokens — {new Date().toLocaleDateString()}
          </h3>
          <div className="overflow-hidden border border-border rounded-xl bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-3 text-left font-semibold">Token #</th>
                    <th className="p-3 text-left font-semibold">Doctor</th>
                    <th className="p-3 text-left font-semibold">Patient Name</th>
                    <th className="p-3 text-left font-semibold">Phone</th>
                    <th className="p-3 text-left font-semibold">Time</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {onlineTokens.map(token => (
                    <tr key={token.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-bold text-purple-600">#{token.token_number}</td>
                      <td className="p-3">Dr. {token.doctors?.name || '—'}</td>
                      <td className="p-3 font-medium">{token.patient_name}</td>
                      <td className="p-3 text-muted-foreground">{token.patient_phone || '—'}</td>
                      <td className="p-3 text-muted-foreground">{new Date(token.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-3">
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Online
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {onlineTokens.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Ticket className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No online tokens issued today.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminOnlineTokens;
