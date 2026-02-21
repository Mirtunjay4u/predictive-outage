import { ShieldCheck } from 'lucide-react';

export default function KnowledgePolicy() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" strokeWidth={1.75} />
        <h1 className="text-xl font-semibold text-foreground">Knowledge & Policy</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Governance, operational constraints, and explanation of system logic.
      </p>
      <div className="rounded-lg border border-border/40 bg-surface-0 p-8 text-center text-muted-foreground/60 text-sm">
        Content will be populated in a future update.
      </div>
    </div>
  );
}
