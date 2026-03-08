import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface StatItem {
  title: string;
  value: string;
  icon: string;
}

interface StatsContent {
  items: StatItem[];
}

interface StatsEditorProps {
  content: StatsContent;
  onChange: (content: StatsContent) => void;
}

const ICON_OPTIONS = ["users", "stethoscope", "clock", "heart", "building", "shield", "star", "award", "activity", "zap"];

export const StatsEditor = ({ content, onChange }: StatsEditorProps) => {
  const items = content.items || [];

  const addStat = () => {
    if (items.length >= 6) return;
    onChange({ items: [...items, { title: "", value: "", icon: "users" }] });
  };

  const updateStat = (index: number, field: keyof StatItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ items: updated });
  };

  const removeStat = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length}/6 statistics</p>
        <Button variant="outline" size="sm" onClick={addStat} disabled={items.length >= 6}>
          <Plus className="mr-1 h-3 w-3" /> Add Stat
        </Button>
      </div>

      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-4">
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input value={item.title} onChange={(e) => updateStat(i, "title", e.target.value)} placeholder="Patients Treated" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Value</Label>
              <Input value={item.value} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="15,000+" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Icon</Label>
              <select
                value={item.icon}
                onChange={(e) => updateStat(i, "icon", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeStat(i)} className="text-destructive hover:text-destructive mt-5">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {items.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">No statistics added yet. Click "Add Stat" to start.</p>
      )}
    </div>
  );
};
