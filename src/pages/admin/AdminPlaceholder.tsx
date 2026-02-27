import { Construction } from "lucide-react";

const AdminPlaceholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
      <Construction className="h-8 w-8" />
    </div>
    <h2 className="mb-2 font-display text-xl font-bold text-foreground">{title}</h2>
    <p className="text-sm text-muted-foreground">
      This module will be available once Lovable Cloud is enabled with database and auth.
    </p>
  </div>
);

export default AdminPlaceholder;
