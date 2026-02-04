import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Bot, ChevronDown, ChevronUp, Copy, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { ScenarioWithIntelligence } from '@/types/scenario';

interface EtrRunwayExplainerProps {
  event: ScenarioWithIntelligence;
}

interface ExplanationSection {
  id: string;
  title: string;
  content: string[];
}

export function EtrRunwayExplainer({ event }: EtrRunwayExplainerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate explanation based on event data
  const explanation = useMemo(() => {
    if (!isOpen) return null;
    return generateExplanation(event);
  }, [event, isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      setIsGenerating(true);
      // Simulate brief generation delay for UX
      setTimeout(() => {
        setIsOpen(true);
        setIsGenerating(false);
      }, 300);
    } else {
      setIsOpen(false);
    }
  };

  const handleCopy = async () => {
    if (!explanation) return;
    
    const textContent = formatExplanationForCopy(explanation);
    await navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast.success('Explanation copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mt-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 h-10 text-xs font-medium"
        onClick={handleToggle}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Bot className="w-3.5 h-3.5" />
        )}
        Explain ETR + Runway (Copilot)
        {!isGenerating && (
          isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && explanation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-lg bg-muted/40 border border-border space-y-4">
              {/* Mode Banner */}
              <div className="flex items-center justify-between">
                <div className="px-2.5 py-1 rounded bg-primary/10 border border-primary/20">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                    MODE: DEMO MODE — Decision support only
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1.5"
                  onClick={handleCopy}
                >
                {copied ? (
                  <Check className="w-3 h-3 text-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                  <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>

              {/* Explanation Sections */}
              <div className="space-y-4">
                {explanation.sections.map((section) => (
                  <div key={section.id}>
                    <h4 className="text-xs font-semibold text-foreground mb-2">
                      {section.title}
                    </h4>
                    {section.content.length === 1 ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.content[0]}
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {section.content.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                            <span className="text-muted-foreground/50 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <Separator className="my-3" />

              {/* Source Notes */}
              <div className="p-3 rounded bg-muted/50 border border-border">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Source Notes
                </h4>
                <ul className="space-y-1">
                  {explanation.sourceNotes.map((note, idx) => (
                    <li key={idx} className="text-[11px] text-muted-foreground">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Safety Disclaimer */}
              <div className="p-2.5 rounded bg-warning/5 border border-warning/20">
                <p className="text-[10px] text-warning leading-relaxed">
                  <strong>Advisory only.</strong> This analysis is for situational awareness and does not authorize 
                  autonomous switching, field dispatch, or operational actions. All decisions require operator review.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ===== Explanation Generation Logic =====

interface GeneratedExplanation {
  sections: ExplanationSection[];
  sourceNotes: string[];
}

function generateExplanation(event: ScenarioWithIntelligence): GeneratedExplanation {
  const sections: ExplanationSection[] = [];
  const sourceNotes: string[] = [];

  // Track which fields were used
  const usedFields: string[] = [];

  // Section A: ETR Confidence Summary
  const etrSummary = generateEtrSummary(event, usedFields);
  sections.push({
    id: 'etr-summary',
    title: 'A. ETR Confidence Summary',
    content: [etrSummary],
  });

  // Section B: Why the ETR is uncertain
  const uncertaintyBullets = generateUncertaintyBullets(event, usedFields);
  sections.push({
    id: 'uncertainty',
    title: 'B. Why the ETR is Uncertain',
    content: uncertaintyBullets,
  });

  // Section C: Critical Load Runway
  const runwayContent = generateRunwayContent(event, usedFields);
  sections.push({
    id: 'runway',
    title: 'C. Critical Load Runway',
    content: [runwayContent],
  });

  // Section D: Escalation Triggers
  const escalationBullets = generateEscalationTriggers(event, usedFields);
  sections.push({
    id: 'escalation',
    title: 'D. Escalation Triggers',
    content: escalationBullets,
  });

  // Source Notes
  sourceNotes.push(`Event record: "${event.name}" (${event.lifecycle_stage})`);
  if (usedFields.length > 0) {
    sourceNotes.push(`Fields referenced: ${usedFields.join(', ')}`);
  }
  if (event.location_name || event.service_area) {
    sourceNotes.push(`Location context: ${event.location_name || 'Unknown'} ${event.service_area ? `(${event.service_area})` : ''}`);
  }
  sourceNotes.push('Analysis generated from demo event data');

  return { sections, sourceNotes };
}

function generateEtrSummary(event: ScenarioWithIntelligence, usedFields: string[]): string {
  const parts: string[] = [];

  if (event.etr_earliest && event.etr_latest) {
    usedFields.push('etr_earliest', 'etr_latest');
    const earliest = format(new Date(event.etr_earliest), 'h:mm a');
    const latest = format(new Date(event.etr_latest), 'h:mm a');
    parts.push(`The estimated restoration window spans from ${earliest} to ${latest}`);

    if (event.etr_band_hours !== null) {
      usedFields.push('etr_band_hours');
      parts.push(`(${event.etr_band_hours.toFixed(1)} hour band)`);
    }
  } else if (event.etr_expected) {
    usedFields.push('etr_expected');
    const expected = format(new Date(event.etr_expected), 'h:mm a');
    parts.push(`The expected restoration time is ${expected}`);
  } else {
    parts.push('No ETR window data is currently available');
  }

  if (event.etr_confidence) {
    usedFields.push('etr_confidence');
    const confidenceDesc = event.etr_confidence === 'HIGH' 
      ? 'high confidence based on available information'
      : event.etr_confidence === 'MEDIUM'
      ? 'moderate confidence with some uncertainty factors'
      : 'low confidence due to significant unknowns';
    parts.push(`with ${confidenceDesc}.`);
  } else {
    parts.push('.');
  }

  if (event.etr_risk_level) {
    usedFields.push('etr_risk_level');
    const riskDesc = event.etr_risk_level === 'HIGH'
      ? 'This represents elevated risk that the restoration may extend beyond the estimated window.'
      : event.etr_risk_level === 'MEDIUM'
      ? 'This represents moderate risk of schedule variation.'
      : 'This represents low risk of schedule deviation.';
    parts.push(riskDesc);
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function generateUncertaintyBullets(event: ScenarioWithIntelligence, usedFields: string[]): string[] {
  const bullets: string[] = [];
  const drivers = event.etr_uncertainty_drivers || [];

  if (drivers.length > 0) {
    usedFields.push('etr_uncertainty_drivers');
    
    drivers.forEach(driver => {
      const driverLower = driver.toLowerCase();
      if (driverLower.includes('weather')) {
        bullets.push('Weather conditions may affect crew access and work safety, potentially extending restoration time.');
      } else if (driverLower.includes('access')) {
        bullets.push('Access constraints such as road conditions or site accessibility may delay crew arrival.');
      } else if (driverLower.includes('crew') || driverLower.includes('resource')) {
        bullets.push('Crew availability or resource allocation may impact the restoration timeline.');
      } else if (driverLower.includes('damage') || driverLower.includes('extent')) {
        bullets.push('The full extent of damage may not yet be assessed, which could reveal additional work.');
      } else if (driverLower.includes('equipment') || driverLower.includes('parts')) {
        bullets.push('Equipment or parts availability may affect the ability to complete repairs.');
      } else {
        bullets.push(`${driver} has been identified as an uncertainty factor.`);
      }
    });
  }

  // Add contextual bullets based on other factors
  if (event.etr_band_hours && event.etr_band_hours > 4) {
    bullets.push('The wide restoration window suggests multiple potential scenarios that operators would need to monitor.');
  }

  if (event.etr_confidence === 'LOW') {
    bullets.push('Low confidence rating indicates significant unknowns that require ongoing assessment.');
  }

  if (bullets.length === 0) {
    bullets.push('No specific uncertainty drivers have been documented for this event.');
    bullets.push('An operator would review field reports and system data for additional context.');
  }

  // Ensure 3-5 bullets
  while (bullets.length < 3) {
    bullets.push('Additional situational factors may be identified as the event progresses.');
  }

  return bullets.slice(0, 5);
}

function generateRunwayContent(event: ScenarioWithIntelligence, usedFields: string[]): string {
  if (!event.has_critical_load) {
    usedFields.push('has_critical_load');
    return 'No critical load facilities are flagged for this event. Standard restoration prioritization would apply.';
  }

  usedFields.push('has_critical_load');
  const parts: string[] = [];

  // Critical load types
  const loadTypes = event.critical_load_types || [];
  if (loadTypes.length > 0) {
    usedFields.push('critical_load_types');
    parts.push(`Critical facilities affected include: ${loadTypes.join(', ')}.`);
  } else {
    parts.push('Critical load facilities are affected.');
  }

  // Remaining hours
  if (event.backup_runtime_remaining_hours !== null) {
    usedFields.push('backup_runtime_remaining_hours');
    parts.push(`Backup power runway shows ${event.backup_runtime_remaining_hours.toFixed(1)} hours remaining.`);
  } else {
    parts.push('Backup runtime data is not available.');
  }

  // Threshold comparison
  if (event.critical_escalation_threshold_hours !== null) {
    usedFields.push('critical_escalation_threshold_hours');
    parts.push(`The escalation threshold is set at ${event.critical_escalation_threshold_hours.toFixed(1)} hours.`);
  }

  // Status
  if (event.critical_runway_status) {
    usedFields.push('critical_runway_status');
    const statusDesc = event.critical_runway_status === 'BREACH'
      ? 'The runway has been breached — immediate attention is required.'
      : event.critical_runway_status === 'AT_RISK'
      ? 'The runway is at risk of breach if restoration is delayed.'
      : 'The runway status is normal with adequate backup time.';
    parts.push(statusDesc);
  }

  return parts.join(' ');
}

function generateEscalationTriggers(event: ScenarioWithIntelligence, usedFields: string[]): string[] {
  const bullets: string[] = [];

  if (event.requires_escalation) {
    usedFields.push('requires_escalation');
    bullets.push('This event has triggered escalation requirements based on critical load runway status.');
  }

  if (event.critical_runway_status === 'BREACH') {
    bullets.push('Operator would coordinate with facility contacts regarding backup power status and fuel reserves.');
    bullets.push('Escalation to operations leadership helps surface this event for priority resource allocation.');
  } else if (event.critical_runway_status === 'AT_RISK') {
    bullets.push('Proactive communication with affected facilities helps them prepare contingency plans.');
    bullets.push('Operator would consider flagging this event for priority in crew dispatch decisions.');
  }

  if (event.etr_risk_level === 'HIGH') {
    bullets.push('High ETR risk suggests operators may need to communicate uncertainty to stakeholders.');
  }

  // Default guidance if no specific triggers
  if (bullets.length === 0) {
    bullets.push('No immediate escalation triggers have been identified for this event.');
    bullets.push('Standard monitoring and communication protocols would apply.');
  }

  // Add coordination note
  bullets.push('All escalation decisions require operator judgment and appropriate authorization.');

  return bullets.slice(0, 5);
}

function formatExplanationForCopy(explanation: GeneratedExplanation): string {
  const lines: string[] = [];
  
  lines.push('MODE: DEMO MODE — Decision support only');
  lines.push('');

  explanation.sections.forEach(section => {
    lines.push(section.title);
    section.content.forEach(item => {
      if (section.content.length === 1) {
        lines.push(item);
      } else {
        lines.push(`• ${item}`);
      }
    });
    lines.push('');
  });

  lines.push('SOURCE NOTES');
  explanation.sourceNotes.forEach(note => {
    lines.push(`• ${note}`);
  });
  lines.push('');
  lines.push('Advisory only. This analysis does not authorize operational actions.');

  return lines.join('\n');
}
