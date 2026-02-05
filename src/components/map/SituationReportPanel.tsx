import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  AlertTriangle,
  Clock,
  Shield,
  Activity,
  FileWarning
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEventStatusHistory } from '@/hooks/useEventStatusHistory';
import { cn } from '@/lib/utils';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import type { SituationReport } from '@/types/situation-report';

interface SituationReportPanelProps {
  event: ScenarioWithIntelligence;
  onClose: () => void;
}

export function SituationReportPanel({ event, onClose }: SituationReportPanelProps) {
  const [report, setReport] = useState<SituationReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: statusHistory = [] } = useEventStatusHistory(event.id || null);

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Build the context for the AI
      const eventData = {
        name: event.name,
        service_area: event.service_area,
        outage_type: event.outage_type,
        priority: event.priority,
        lifecycle_stage: event.lifecycle_stage,
        etr_earliest: event.etr_earliest,
        etr_latest: event.etr_latest,
        etr_expected: event.etr_expected,
        etr_confidence: event.etr_confidence,
        etr_risk_level: event.etr_risk_level,
        critical_runway_status: event.critical_runway_status,
        backup_runtime_remaining_hours: event.backup_runtime_remaining_hours,
        has_critical_load: event.has_critical_load,
        critical_load_types: Array.isArray(event.critical_load_types) ? event.critical_load_types : [],
        requires_escalation: event.requires_escalation,
        customers_impacted: event.customers_impacted,
        etr_uncertainty_drivers: Array.isArray(event.etr_uncertainty_drivers) ? event.etr_uncertainty_drivers : [],
      };

      // Build the specialized prompt for situation report
      const historyContext = statusHistory.length > 0
        ? statusHistory.map((h, idx) => {
            const parts = [`Snapshot ${idx + 1} (${format(new Date(h.recorded_at), 'MMM d, h:mm a')}):`];
            if (h.etr_earliest || h.etr_latest) {
              parts.push(`  ETR: ${h.etr_earliest ? format(new Date(h.etr_earliest), 'h:mm a') : '?'} – ${h.etr_latest ? format(new Date(h.etr_latest), 'h:mm a') : '?'}`);
            }
            if (h.etr_confidence) parts.push(`  Confidence: ${h.etr_confidence}`);
            if (h.critical_runway_status) parts.push(`  Runway: ${h.critical_runway_status}`);
            if (h.change_note) parts.push(`  Note: ${h.change_note}`);
            return parts.join('\n');
          }).join('\n\n')
        : 'No status history available.';

      const userMessage = `Generate a Situation Report for this event.

## Event Data
- Event Name: ${eventData.name}
- Service Area: ${eventData.service_area || 'Not specified'}
- Outage Type: ${eventData.outage_type || 'Unknown'}
- Priority: ${eventData.priority || 'Not set'}
- Lifecycle Stage: ${eventData.lifecycle_stage}
- ETR Window: ${eventData.etr_earliest ? format(new Date(eventData.etr_earliest), 'h:mm a') : '?'} – ${eventData.etr_latest ? format(new Date(eventData.etr_latest), 'h:mm a') : '?'}
- ETR Confidence: ${eventData.etr_confidence || 'Not assessed'}
- ETR Risk Level: ${eventData.etr_risk_level || 'Not assessed'}
- Critical Runway Status: ${eventData.critical_runway_status || 'NORMAL'}
- Backup Runtime Remaining: ${eventData.backup_runtime_remaining_hours !== null ? `${eventData.backup_runtime_remaining_hours} hours` : 'N/A'}
- Has Critical Load: ${eventData.has_critical_load ? 'Yes' : 'No'}
- Critical Load Types: ${eventData.critical_load_types.length > 0 ? eventData.critical_load_types.join(', ') : 'None'}
- Requires Escalation: ${eventData.requires_escalation ? 'Yes' : 'No'}
- Customers Impacted: ${eventData.customers_impacted?.toLocaleString() || 'Unknown'}
- Uncertainty Drivers: ${eventData.etr_uncertainty_drivers.length > 0 ? eventData.etr_uncertainty_drivers.join(', ') : 'None identified'}

## Status History (Timeline Context)
${historyContext}

## Required Output Format
Generate a structured situation report with these sections:
1. Situation Summary (3-4 sentences on current state, ETR uncertainty, risk posture)
2. What Changed Since Last Update (3-5 bullets from status history, mention ETR band movement and confidence changes)
3. Critical Load Continuity (remaining backup hours, runway status, escalation awareness)
4. Key Uncertainties & Constraints (weather, access, crew, damage factors)
5. What This Helps Leadership Understand (2-3 bullets on implications, not actions)
6. Source Notes (data fields and timestamps used)

Use advisory language only. Decision support only. No operational instructions.`;

      const { data, error: fnError } = await supabase.functions.invoke('copilot', {
        body: {
          mode: 'DEMO',
          user_message: userMessage,
          scenario_id: event.id,
          scenario: {
            scenario_name: event.name,
            lifecycle_stage: event.lifecycle_stage,
            outage_type: event.outage_type,
            service_area: event.service_area,
          },
        },
      });

      if (fnError) throw fnError;

      // Transform copilot response into situation report format
      const situationReport: SituationReport = {
        title: `Situation Report — ${event.name || event.service_area || 'Event'}`,
        mode_banner: 'DEMO MODE — Decision support only',
        generated_at: new Date().toISOString(),
        sections: {
          situation_summary: data.framing_line || 'No summary available.',
          what_changed: extractBulletsFromInsight(data.insights, 'Changed') || 
            extractBulletsFromInsight(data.insights, 'Update') ||
            ['No status history changes recorded.'],
          critical_load_continuity: {
            remaining_backup_hours: eventData.backup_runtime_remaining_hours,
            runway_status: eventData.critical_runway_status,
            escalation_required: eventData.requires_escalation || false,
            critical_load_types: eventData.critical_load_types,
          },
          key_uncertainties: extractBulletsFromInsight(data.insights, 'Uncertain') ||
            extractBulletsFromInsight(data.insights, 'Risk') ||
            eventData.etr_uncertainty_drivers,
          leadership_implications: extractBulletsFromInsight(data.insights, 'Leadership') ||
            extractBulletsFromInsight(data.insights, 'Understand') ||
            ['This report provides situational awareness for executive review.'],
          source_notes: data.source_notes || ['Event record', 'Status history timeline'],
        },
        disclaimer: data.disclaimer || 'Decision support only. This system does not access live SCADA, OMS, ADMS, or weather feeds.',
      };

      setReport(situationReport);
    } catch (err) {
      console.error('Situation report generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate situation report');
    } finally {
      setIsGenerating(false);
    }
  };

  const extractBulletsFromInsight = (
    insights: Array<{ title: string; bullets: string[] }> | undefined,
    keyword: string
  ): string[] | null => {
    if (!insights) return null;
    const insight = insights.find(i => i.title.toLowerCase().includes(keyword.toLowerCase()));
    return insight?.bullets || null;
  };

  const copyReportToClipboard = () => {
    if (!report) return;

    const lines: string[] = [];
    lines.push(report.title);
    lines.push(`[${report.mode_banner}]`);
    lines.push(`Generated: ${format(new Date(report.generated_at), 'MMM d, yyyy h:mm a')}`);
    lines.push('');
    
    lines.push('SITUATION SUMMARY');
    lines.push(report.sections.situation_summary);
    lines.push('');
    
    lines.push('WHAT CHANGED SINCE LAST UPDATE');
    report.sections.what_changed.forEach(item => lines.push(`• ${item}`));
    lines.push('');
    
    lines.push('CRITICAL LOAD CONTINUITY');
    const cl = report.sections.critical_load_continuity;
    lines.push(`• Remaining Backup: ${cl.remaining_backup_hours !== null ? `${cl.remaining_backup_hours} hours` : 'N/A'}`);
    lines.push(`• Runway Status: ${cl.runway_status || 'NORMAL'}`);
    lines.push(`• Escalation Required: ${cl.escalation_required ? 'Yes' : 'No'}`);
    if (cl.critical_load_types.length > 0) {
      lines.push(`• Critical Load Types: ${cl.critical_load_types.join(', ')}`);
    }
    lines.push('');
    
    lines.push('KEY UNCERTAINTIES & CONSTRAINTS');
    report.sections.key_uncertainties.forEach(item => lines.push(`• ${item}`));
    lines.push('');
    
    lines.push('WHAT THIS HELPS LEADERSHIP UNDERSTAND');
    report.sections.leadership_implications.forEach(item => lines.push(`• ${item}`));
    lines.push('');
    
    lines.push('SOURCE NOTES');
    report.sections.source_notes.forEach(note => lines.push(`• ${note}`));
    lines.push('');
    
    lines.push('DISCLAIMER');
    lines.push(report.disclaimer);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      toast({ description: 'Report copied to clipboard', duration: 2000 });
    });
  };

  const discardDraft = () => {
    setReport(null);
    setError(null);
  };

  const getRunwayStatusStyle = (status: string | null) => {
    switch (status) {
      case 'BREACH':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30';
      case 'AT_RISK':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-[440px] top-0 h-full w-[480px] max-w-[calc(100vw-480px)] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <header className="flex-shrink-0 px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Situation Report</h2>
              <p className="text-xs text-muted-foreground">Draft Preview — Not Sent</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-muted"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-4">
          {/* Generate Button (when no report) */}
          {!report && !isGenerating && !error && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Generate an executive-grade situation report based on current event data and status history.
              </p>
              <Button onClick={generateReport} className="gap-2">
                <FileText className="w-4 h-4" />
                Generate Situation Report
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Generating situation report...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Generation Failed</span>
              </div>
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={generateReport}>
                Try Again
              </Button>
            </div>
          )}

          {/* Report Preview */}
          {report && (
            <div className="space-y-5">
              {/* Title & Mode Banner */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">{report.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600">
                    {report.mode_banner}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Generated {format(new Date(report.generated_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Section 1: Situation Summary */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Situation Summary
                </h4>
                <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-lg p-3 border border-border">
                  {report.sections.situation_summary}
                </p>
              </section>

              {/* Section 2: What Changed */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  What Changed Since Last Update
                </h4>
                <ul className="space-y-1.5">
                  {report.sections.what_changed.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 3: Critical Load Continuity */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Critical Load Continuity
                </h4>
                <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Remaining Backup</span>
                    <span className="text-sm font-medium text-foreground">
                      {report.sections.critical_load_continuity.remaining_backup_hours !== null
                        ? `${report.sections.critical_load_continuity.remaining_backup_hours} hours`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Runway Status</span>
                    <Badge 
                      variant="outline" 
                      className={cn('text-[10px]', getRunwayStatusStyle(report.sections.critical_load_continuity.runway_status))}
                    >
                      {report.sections.critical_load_continuity.runway_status || 'NORMAL'}
                    </Badge>
                  </div>
                  {report.sections.critical_load_continuity.escalation_required && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="text-xs font-medium text-warning">Escalation awareness required</span>
                    </div>
                  )}
                  {report.sections.critical_load_continuity.critical_load_types.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground block mb-1">Critical Load Types</span>
                      <div className="flex flex-wrap gap-1">
                        {report.sections.critical_load_continuity.critical_load_types.map((type, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px]">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Section 4: Key Uncertainties */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <FileWarning className="w-3.5 h-3.5" />
                  Key Uncertainties & Constraints
                </h4>
                <ul className="space-y-1.5">
                  {report.sections.key_uncertainties.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-warning mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 5: Leadership Implications */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  What This Helps Leadership Understand
                </h4>
                <ul className="space-y-1.5">
                  {report.sections.leadership_implications.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 6: Source Notes */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Source Notes
                </h4>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <ul className="space-y-1">
                    {report.sections.source_notes.map((note, idx) => (
                      <li key={idx} className="text-[11px] text-muted-foreground">
                        • {note}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Disclaimer */}
              <div className="p-3 rounded border border-border/60 bg-muted/20">
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                  <span className="font-medium uppercase tracking-wide">Disclaimer:</span>{' '}
                  {report.disclaimer}
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <footer className="flex-shrink-0 p-4 border-t border-border bg-muted/30 space-y-2">
        {report ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={discardDraft}
                className="gap-2"
              >
                <XCircle className="w-4 h-4" />
                Discard Draft
              </Button>
              <Button
                variant="outline"
                onClick={copyReportToClipboard}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Report
              </Button>
            </div>
            <Button
              disabled
              className="w-full gap-2 opacity-50 cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve for Sending
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Sending functionality not yet enabled — draft preview only
            </p>
          </>
        ) : (
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        )}
      </footer>
    </motion.div>
  );
}
