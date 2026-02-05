import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
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
  FileWarning,
  Ban,
  ClipboardCheck,
  History,
  Send,
  Mail,
  MessageSquare,
  Users,
  Building2,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEventStatusHistory } from '@/hooks/useEventStatusHistory';
import { cn } from '@/lib/utils';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import type { SituationReport, ReportStatus, DeliveryChannel, AudienceType } from '@/types/situation-report';

interface SituationReportPanelProps {
  event: ScenarioWithIntelligence;
  onClose: () => void;
}

export function SituationReportPanel({ event, onClose }: SituationReportPanelProps) {
  const [report, setReport] = useState<SituationReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [reviewerComments, setReviewerComments] = useState('');
  
  // Send panel state
  const [showSendPanel, setShowSendPanel] = useState(false);
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel>('email');
  const [audience, setAudience] = useState<AudienceType>('executive_leadership');
  const [messageNote, setMessageNote] = useState('');
  
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
        approval: {
          status: 'draft',
        },
      };

      setReport(situationReport);
    } catch (err) {
      console.error('Situation report generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate situation report');
    } finally {
      setIsGenerating(false);
    }
  };

  const approveReport = () => {
    if (!report) return;
    
    setReport({
      ...report,
      approval: {
        status: 'approved',
        approved_by: 'Demo Operator',
        approved_at: new Date().toISOString(),
      },
    });
    
    toast({ 
      description: 'Report approved — ready for sending (when enabled)', 
      duration: 3000 
    });
  };

  const rejectReport = () => {
    if (!report) return;
    
    setReport({
      ...report,
      approval: {
        status: 'rejected',
        rejected_by: 'Demo Operator',
        rejected_at: new Date().toISOString(),
        reviewer_comments: reviewerComments || undefined,
      },
    });
    
    setShowRejectDialog(false);
    setReviewerComments('');
    
    toast({ 
      description: 'Report rejected — changes required', 
      duration: 3000 
    });
  };

  const sendReport = () => {
    if (!report || report.approval?.status !== 'approved') return;
    
    setReport({
      ...report,
      approval: {
        ...report.approval,
        status: 'sent',
      },
      delivery: {
        sent_by: 'Demo Operator',
        sent_at: new Date().toISOString(),
        delivery_channel: deliveryChannel,
        audience: audience,
        message_note: messageNote || undefined,
      },
    });
    
    setShowSendPanel(false);
    setMessageNote('');
    
    toast({ 
      description: 'Report sent successfully (demo).', 
      duration: 3000 
    });
  };

  const getAudienceLabel = (aud: AudienceType) => {
    switch (aud) {
      case 'executive_leadership':
        return 'Executive Leadership';
      case 'operations_team':
        return 'Operations Team';
      case 'external_stakeholders':
        return 'External Stakeholders (Demo)';
    }
  };

  const getAudienceEmail = (aud: AudienceType) => {
    switch (aud) {
      case 'executive_leadership':
        return 'exec-leadership@utility-demo.com';
      case 'operations_team':
        return 'ops-team@utility-demo.com';
      case 'external_stakeholders':
        return 'stakeholders@utility-demo.com';
    }
  };

  const getStatusBadgeStyle = (status: ReportStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'sent':
        return 'bg-primary/15 text-primary border-primary/30';
      case 'rejected':
        return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
    }
  };

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case 'approved':
        return 'Approved — Ready for Sending';
      case 'sent':
        return 'Sent — Delivered';
      case 'rejected':
        return 'Rejected — Changes Required';
      default:
        return 'Draft — Awaiting Approval';
    }
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'sent':
        return <Send className="w-3.5 h-3.5" />;
      case 'rejected':
        return <Ban className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
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
              {/* Status Badge */}
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border',
                getStatusBadgeStyle(report.approval?.status || 'draft')
              )}>
                {getStatusIcon(report.approval?.status || 'draft')}
                <span className="text-sm font-medium">
                  {getStatusLabel(report.approval?.status || 'draft')}
                </span>
              </div>

              {/* Title & Mode Banner */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">{report.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
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

              {/* Approval Log */}
              {report.approval && (report.approval.status !== 'draft') && (
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <History className="w-3.5 h-3.5" />
                    Approval Log
                  </h4>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <Badge 
                        variant="outline" 
                        className={cn('text-[10px]', getStatusBadgeStyle(report.approval.status))}
                      >
                        {report.approval.status.toUpperCase()}
                      </Badge>
                    </div>
                    {report.approval.approved_by && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Approved By</span>
                        <span className="text-xs font-medium text-foreground">{report.approval.approved_by}</span>
                      </div>
                    )}
                    {report.approval.approved_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Approved At</span>
                        <span className="text-xs text-foreground">{format(new Date(report.approval.approved_at), 'MMM d, h:mm a')}</span>
                      </div>
                    )}
                    {report.approval.rejected_by && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Rejected By</span>
                        <span className="text-xs font-medium text-foreground">{report.approval.rejected_by}</span>
                      </div>
                    )}
                    {report.approval.rejected_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Rejected At</span>
                        <span className="text-xs text-foreground">{format(new Date(report.approval.rejected_at), 'MMM d, h:mm a')}</span>
                      </div>
                    )}
                    {report.approval.reviewer_comments && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Reviewer Notes</span>
                        <p className="text-xs text-foreground italic">"{report.approval.reviewer_comments}"</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Delivery Log */}
              {report.delivery && (
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                    Delivery Log
                  </h4>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/30">
                        SENT
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Channel</span>
                      <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        {report.delivery.delivery_channel === 'email' ? (
                          <><Mail className="w-3 h-3" /> Email</>
                        ) : (
                          <><MessageSquare className="w-3 h-3" /> Message</>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Audience</span>
                      <span className="text-xs font-medium text-foreground">{getAudienceLabel(report.delivery.audience)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Sent By</span>
                      <span className="text-xs font-medium text-foreground">{report.delivery.sent_by}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Sent At</span>
                      <span className="text-xs text-foreground">{format(new Date(report.delivery.sent_at), 'MMM d, h:mm a')}</span>
                    </div>
                    {report.delivery.message_note && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Message Note</span>
                        <p className="text-xs text-foreground italic">"{report.delivery.message_note}"</p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Reject Dialog */}
          {showRejectDialog && (
            <div className="p-4 rounded-lg bg-muted border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-foreground">Request Changes / Reject</span>
              </div>
              <Textarea
                placeholder="Optional: Add reviewer comments..."
                value={reviewerComments}
                onChange={(e) => setReviewerComments(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setReviewerComments('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={rejectReport}
                  className="flex-1 gap-1"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
          {/* Send Panel */}
          {showSendPanel && report?.approval?.status === 'approved' && (
            <div className="p-4 rounded-lg bg-muted border border-border space-y-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Send Situation Report</span>
              </div>
              
              {/* Subject Preview */}
              <div className="p-2 rounded bg-background border border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Subject</span>
                <p className="text-xs text-foreground font-medium">{report.title}</p>
              </div>
              
              {/* Delivery Channel */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Delivery Channel</Label>
                <RadioGroup 
                  value={deliveryChannel} 
                  onValueChange={(val) => setDeliveryChannel(val as DeliveryChannel)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="text-sm flex items-center gap-1.5 cursor-pointer">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="message" id="message" />
                    <Label htmlFor="message" className="text-sm flex items-center gap-1.5 cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Audience Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Audience</Label>
                <Select value={audience} onValueChange={(val) => setAudience(val as AudienceType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive_leadership">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        Executive Leadership
                      </div>
                    </SelectItem>
                    <SelectItem value="operations_team">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        Operations Team
                      </div>
                    </SelectItem>
                    <SelectItem value="external_stakeholders">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />
                        External Stakeholders (Demo)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Recipient Preview */}
              <div className="p-2 rounded bg-background/50 border border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Demo Recipients</span>
                <p className="text-xs text-foreground font-mono">{getAudienceEmail(audience)}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1 italic">Demo recipients — no actual delivery</p>
              </div>
              
              {/* Optional Message Note */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Message Note (optional)</Label>
                <Textarea
                  placeholder="Add a brief note..."
                  value={messageNote}
                  onChange={(e) => setMessageNote(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>
              
              {/* Demo disclaimer */}
              <div className="p-2 rounded border border-border/60 bg-muted/20">
                <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                  <span className="font-medium">Decision support only.</span> This demo simulates report delivery without external integrations.
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSendPanel(false);
                    setMessageNote('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={sendReport}
                  className="flex-1 gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Confirm Send
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <footer className="flex-shrink-0 p-4 border-t border-border bg-muted/30 space-y-3">
        {report ? (
          <>
            {/* Approval Actions - Only visible for Draft status */}
            {report.approval?.status === 'draft' && !showRejectDialog && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <Ban className="w-4 h-4" />
                  Request Changes
                </Button>
                <Button
                  onClick={approveReport}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Approve Report
                </Button>
              </div>
            )}

            {/* Approved state - Send button */}
            {report.approval?.status === 'approved' && !showSendPanel && (
              <div className="space-y-2">
                <Button
                  onClick={() => setShowSendPanel(true)}
                  className="w-full gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Report
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Report approved — ready for controlled delivery
                </p>
              </div>
            )}

            {/* Sent state - read only */}
            {report.approval?.status === 'sent' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Report Delivered</span>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Report sent — no further edits allowed
                </p>
              </div>
            )}

            {/* Rejected state - allow regenerate */}
            {report.approval?.status === 'rejected' && (
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setReport(null);
                    setError(null);
                  }}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate New Report
                </Button>
              </div>
            )}

            <Separator />

            {/* Utility Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={discardDraft}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <XCircle className="w-3.5 h-3.5" />
                Discard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyReportToClipboard}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Report
              </Button>
            </div>
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
