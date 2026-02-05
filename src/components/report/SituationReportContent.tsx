import { useState } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEventStatusHistory } from '@/hooks/useEventStatusHistory';
import { CustomerCommunicationsPack } from './CustomerCommunicationsPack';
import { cn } from '@/lib/utils';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import type { SituationReport, ReportStatus, DeliveryChannel, AudienceType, CustomerCommsMetadata } from '@/types/situation-report';

interface SituationReportContentProps {
  event: ScenarioWithIntelligence;
}

export function SituationReportContent({ event }: SituationReportContentProps) {
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

  const handleCommsGenerated = (comms: CustomerCommsMetadata) => {
    if (!report) return;
    setReport({
      ...report,
      customer_comms: comms,
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
        return <CheckCircle2 className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'rejected':
        return <Ban className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  const isSent = report?.approval?.status === 'sent';

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Situation Report</h1>
            <p className="text-sm text-muted-foreground">
              {report ? 'Review and approve before sending' : 'Generate an executive-ready draft'}
            </p>
          </div>
        </div>
      </div>

      {/* Generate Button (when no report) */}
      {!report && !isGenerating && !error && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Generate an executive-grade situation report based on current event data, 
              ETR analysis, and status history timeline.
            </p>
            <Button onClick={generateReport} size="lg" className="gap-2">
              <FileText className="w-5 h-5" />
              Generate Situation Report
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Creates a draft for review and approval
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isGenerating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Generating situation report...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <span className="font-medium text-destructive">Generation Failed</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={generateReport}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Report Preview */}
      {report && (
        <div className="space-y-6">
          {/* Status Badge */}
          <div className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-lg border',
            getStatusBadgeStyle(report.approval?.status || 'draft')
          )}>
            {getStatusIcon(report.approval?.status || 'draft')}
            <span className="text-sm font-medium">{getStatusLabel(report.approval?.status || 'draft')}</span>
          </div>

          {/* Report Header Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generated: {format(new Date(report.generated_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[10px]">
                  {report.mode_banner}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Situation Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Situation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{report.sections.situation_summary}</p>
            </CardContent>
          </Card>

          {/* What Changed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                What Changed Since Last Update
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {report.sections.what_changed.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Critical Load Continuity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Critical Load Continuity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Backup Remaining</span>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {report.sections.critical_load_continuity.remaining_backup_hours !== null 
                      ? `${report.sections.critical_load_continuity.remaining_backup_hours}h`
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Runway Status</span>
                  <Badge 
                    variant="outline" 
                    className={cn('mt-2', getRunwayStatusStyle(report.sections.critical_load_continuity.runway_status))}
                  >
                    {report.sections.critical_load_continuity.runway_status || 'NORMAL'}
                  </Badge>
                </div>
              </div>
              {report.sections.critical_load_continuity.escalation_required && (
                <div className="mt-3 p-2 rounded bg-warning/10 border border-warning/20 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-xs text-warning font-medium">Escalation Required</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Uncertainties */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-primary" />
                Key Uncertainties & Constraints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {report.sections.key_uncertainties.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-warning mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Leadership Implications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                What This Helps Leadership Understand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {report.sections.leadership_implications.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground italic">{report.disclaimer}</p>
          </div>

          {/* Approval Log */}
          {(report.approval?.approved_at || report.approval?.rejected_at) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Approval Log
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                {report.approval.approved_at && (
                  <p>Approved by {report.approval.approved_by} on {format(new Date(report.approval.approved_at), 'MMM d, h:mm a')}</p>
                )}
                {report.approval.rejected_at && (
                  <>
                    <p>Rejected by {report.approval.rejected_by} on {format(new Date(report.approval.rejected_at), 'MMM d, h:mm a')}</p>
                    {report.approval.reviewer_comments && (
                      <p className="mt-1 italic">"{report.approval.reviewer_comments}"</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delivery Log */}
          {report.delivery && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Delivery Log
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Sent by {report.delivery.sent_by} on {format(new Date(report.delivery.sent_at), 'MMM d, h:mm a')}</p>
                <p>Channel: {report.delivery.delivery_channel === 'email' ? 'Email' : 'Message'}</p>
                <p>Audience: {getAudienceLabel(report.delivery.audience)}</p>
                {report.delivery.message_note && (
                  <p className="mt-1 italic">Note: "{report.delivery.message_note}"</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Customer Communications Pack */}
          {(report.approval?.status === 'approved' || report.approval?.status === 'sent') && (
            <CustomerCommunicationsPack 
              event={event} 
              report={report} 
              onCommsGenerated={handleCommsGenerated} 
            />
          )}

          {/* Send Panel */}
          {showSendPanel && !isSent && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" />
                  Send Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Delivery Channel */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Delivery Channel</Label>
                  <RadioGroup value={deliveryChannel} onValueChange={(v) => setDeliveryChannel(v as DeliveryChannel)}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email" className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="message" id="message" />
                        <Label htmlFor="message" className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Message
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Audience */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Audience</Label>
                  <Select value={audience} onValueChange={(v) => setAudience(v as AudienceType)}>
                    <SelectTrigger className="h-9">
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
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Demo Recipients</span>
                  <p className="text-xs font-mono text-foreground mt-1">{getAudienceEmail(audience)}</p>
                </div>

                {/* Subject Preview */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Subject Line</Label>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded px-3 py-2 border border-border">
                    Situation Report — {event.service_area || event.name}
                  </p>
                </div>

                {/* Optional Note */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Message Note (Optional)</Label>
                  <Textarea
                    placeholder="Add a brief note to accompany the report..."
                    value={messageNote}
                    onChange={(e) => setMessageNote(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowSendPanel(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={sendReport} className="flex-1 gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    Confirm Send
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  Decision support only. Demo-safe delivery.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Reject Dialog */}
          {showRejectDialog && !isSent && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <Ban className="w-4 h-4" />
                  Reject Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Reviewer Comments (Optional)</Label>
                  <Textarea
                    placeholder="Explain why the report was rejected..."
                    value={reviewerComments}
                    onChange={(e) => setReviewerComments(e.target.value)}
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowRejectDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={rejectReport} className="flex-1 gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Confirm Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={copyReportToClipboard} className="gap-1.5">
              <Copy className="w-3.5 h-3.5" />
              Copy
            </Button>

            {!isSent && report.approval?.status === 'draft' && (
              <>
                <Button variant="outline" size="sm" onClick={discardDraft} className="gap-1.5 text-muted-foreground">
                  Discard
                </Button>
                <div className="flex-1" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowRejectDialog(true)}
                  className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
                <Button size="sm" onClick={approveReport} className="gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </Button>
              </>
            )}

            {!isSent && report.approval?.status === 'approved' && (
              <>
                <div className="flex-1" />
                <Button size="sm" onClick={() => setShowSendPanel(true)} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Send Report
                </Button>
              </>
            )}

            {isSent && (
              <div className="flex-1 text-right">
                <span className="text-xs text-muted-foreground">Report delivered and locked</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
