import { useState } from 'react';
import { format } from 'date-fns';
import { Bot, ChevronDown, ChevronUp, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import type { CopilotResponse } from '@/types/copilot';

interface EtrRunwayExplainerProps {
  event: ScenarioWithIntelligence;
}

export function EtrRunwayExplainer({ event }: EtrRunwayExplainerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleToggle = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build specialized ETR + Runway analysis prompt
      const analysisPrompt = buildEtrRunwayPrompt(event);

      const { data, error: fnError } = await supabase.functions.invoke('copilot', {
        body: {
          mode: 'DEMO',
          user_message: analysisPrompt,
          scenario_id: event.id,
          scenario: {
            scenario_name: event.name,
            lifecycle_stage: event.lifecycle_stage,
            stage: event.stage,
            operator_role: event.operator_role,
            scenario_time: event.scenario_time,
            notes: event.notes,
            description: event.description,
            outage_type: event.outage_type,
            // Include ETR and critical load fields for context
            etr_earliest: event.etr_earliest,
            etr_expected: event.etr_expected,
            etr_latest: event.etr_latest,
            etr_confidence: event.etr_confidence,
            etr_uncertainty_drivers: event.etr_uncertainty_drivers,
            has_critical_load: event.has_critical_load,
            critical_load_types: event.critical_load_types,
            backup_runtime_remaining_hours: event.backup_runtime_remaining_hours,
            critical_escalation_threshold_hours: event.critical_escalation_threshold_hours,
            location_name: event.location_name,
            service_area: event.service_area,
            // Derived fields
            etr_band_hours: event.etr_band_hours,
            etr_risk_level: event.etr_risk_level,
            critical_runway_status: event.critical_runway_status,
            requires_escalation: event.requires_escalation,
          },
          constraints: [
            'Focus specifically on ETR confidence and critical load runway analysis',
            'Do not recommend autonomous switching or field actions',
            'Use advisory language throughout',
          ],
        },
      });

      if (fnError) throw fnError;

      setResponse(data as CopilotResponse);
      setIsOpen(true);
    } catch (err) {
      console.error('ETR Explainer error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate explanation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!response) return;
    
    const textContent = formatResponseForCopy(response);
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
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Bot className="w-3.5 h-3.5" />
        )}
        Explain ETR + Runway (Copilot)
        {!isLoading && (
          isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />
        )}
      </Button>

      <AnimatePresence>
        {/* Error State */}
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}

        {/* Response Display */}
        {isOpen && response && (
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
                    {response.mode_banner}
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

              {/* Framing Line */}
              {response.framing_line && (
                <p className="text-sm font-medium text-foreground leading-relaxed border-l-2 border-muted-foreground/30 pl-3">
                  {response.framing_line}
                </p>
              )}

              {/* Insights */}
              <div className="space-y-4">
                {response.insights.map((insight, index) => (
                  <div key={index}>
                    <h4 className="text-xs font-semibold text-foreground mb-2 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{insight.title}</span>
                    </h4>
                    <ul className="space-y-1.5 ml-7">
                      {insight.bullets.map((bullet, bulletIdx) => (
                        <li key={bulletIdx} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                          <span className="text-muted-foreground/50 mt-0.5">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Assumptions */}
              {response.assumptions && response.assumptions.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <div className="p-3 rounded bg-muted/50 border border-border">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Assumptions
                    </h4>
                    <ul className="space-y-1">
                      {response.assumptions.map((assumption, idx) => (
                        <li key={idx} className="text-[11px] text-muted-foreground flex items-start gap-2">
                          <span className="mt-0.5">•</span>
                          <span>{assumption}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Source Notes */}
              {response.source_notes && response.source_notes.length > 0 && (
                <div className="p-3 rounded bg-muted/50 border border-border">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Source Notes
                  </h4>
                  <ul className="space-y-1">
                    {response.source_notes.map((note, idx) => (
                      <li key={idx} className="text-[11px] text-muted-foreground">
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Disclaimer */}
              <div className="p-2.5 rounded bg-warning/5 border border-warning/20">
                <p className="text-[10px] text-warning leading-relaxed">
                  <strong>Disclaimer:</strong> {response.disclaimer}
                </p>
              </div>

              {/* Reset Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setIsOpen(false);
                  setResponse(null);
                }}
              >
                Close explanation
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ===== Prompt Builder =====

function buildEtrRunwayPrompt(event: ScenarioWithIntelligence): string {
  const parts: string[] = [];

  parts.push('Provide a structured ETR Confidence and Critical Load Runway analysis for this event.');
  parts.push('');
  parts.push('## ETR Data');
  
  if (event.etr_earliest && event.etr_latest) {
    parts.push(`- Restoration Window: ${format(new Date(event.etr_earliest), 'h:mm a')} to ${format(new Date(event.etr_latest), 'h:mm a')}`);
  }
  if (event.etr_expected) {
    parts.push(`- Expected ETR: ${format(new Date(event.etr_expected), 'h:mm a')}`);
  }
  if (event.etr_band_hours !== null && event.etr_band_hours !== undefined) {
    parts.push(`- Band Width: ${event.etr_band_hours.toFixed(1)} hours`);
  }
  if (event.etr_confidence) {
    parts.push(`- Confidence Level: ${event.etr_confidence}`);
  }
  if (event.etr_risk_level) {
    parts.push(`- Risk Level: ${event.etr_risk_level}`);
  }
  
  const drivers = event.etr_uncertainty_drivers || [];
  if (drivers.length > 0) {
    parts.push(`- Uncertainty Drivers: ${drivers.join(', ')}`);
  }

  parts.push('');
  parts.push('## Critical Load Data');
  parts.push(`- Has Critical Load: ${event.has_critical_load ? 'Yes' : 'No'}`);
  
  if (event.has_critical_load) {
    const loadTypes = event.critical_load_types || [];
    if (loadTypes.length > 0) {
      parts.push(`- Critical Facilities: ${loadTypes.join(', ')}`);
    }
    if (event.backup_runtime_remaining_hours !== null && event.backup_runtime_remaining_hours !== undefined) {
      parts.push(`- Backup Runtime Remaining: ${event.backup_runtime_remaining_hours.toFixed(1)} hours`);
    }
    if (event.critical_escalation_threshold_hours !== null && event.critical_escalation_threshold_hours !== undefined) {
      parts.push(`- Escalation Threshold: ${event.critical_escalation_threshold_hours.toFixed(1)} hours`);
    }
    if (event.critical_runway_status) {
      parts.push(`- Runway Status: ${event.critical_runway_status}`);
    }
    if (event.requires_escalation) {
      parts.push(`- Escalation Required: Yes`);
    }
  }

  if (event.location_name || event.service_area) {
    parts.push('');
    parts.push('## Location');
    if (event.location_name) parts.push(`- Location: ${event.location_name}`);
    if (event.service_area) parts.push(`- Service Area: ${event.service_area}`);
  }

  parts.push('');
  parts.push('## Required Analysis Sections');
  parts.push('1. ETR Confidence Summary (1-2 sentences on the restoration window and confidence)');
  parts.push('2. Why the ETR is Uncertain (3-5 bullets tied to uncertainty drivers)');
  parts.push('3. Critical Load Runway (explicit remaining hours and status)');
  parts.push('4. Escalation Triggers (communication and coordination guidance only, no switching instructions)');
  parts.push('');
  parts.push('Use advisory language. State "Unknown" for missing data. Do not recommend field actions.');

  return parts.join('\n');
}

// ===== Copy Formatter =====

function formatResponseForCopy(response: CopilotResponse): string {
  const lines: string[] = [];
  
  lines.push(`MODE: ${response.mode_banner}`);
  lines.push('');

  if (response.framing_line) {
    lines.push(response.framing_line);
    lines.push('');
  }

  response.insights.forEach((insight, index) => {
    lines.push(`${index + 1}. ${insight.title}`);
    insight.bullets.forEach(bullet => {
      lines.push(`   • ${bullet}`);
    });
    lines.push('');
  });

  if (response.assumptions && response.assumptions.length > 0) {
    lines.push('ASSUMPTIONS');
    response.assumptions.forEach(assumption => {
      lines.push(`• ${assumption}`);
    });
    lines.push('');
  }

  if (response.source_notes && response.source_notes.length > 0) {
    lines.push('SOURCE NOTES');
    response.source_notes.forEach(note => {
      lines.push(`• ${note}`);
    });
    lines.push('');
  }

  lines.push('DISCLAIMER');
  lines.push(response.disclaimer);

  return lines.join('\n');
}
