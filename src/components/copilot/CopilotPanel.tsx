import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, ChevronRight, AlertCircle, Copy, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { OutageTypeBadge } from '@/components/ui/outage-type-badge';
import type { Scenario } from '@/types/scenario';
import type { CopilotResponse, CopilotMode, CopilotRequest } from '@/types/copilot';

interface CopilotPanelProps {
  scenario: Scenario | null;
  isOpen: boolean;
  onToggle: () => void;
}

const suggestedPrompts = [
  { label: 'Continue in Demo Mode', mode: 'DEMO' as CopilotMode, icon: Sparkles },
  { label: 'Analyze Active Event', mode: 'ACTIVE_EVENT' as CopilotMode, icon: Sparkles },
  { label: 'Planning & Training', mode: 'PLANNING' as CopilotMode, icon: Sparkles },
  { label: 'Post-Event Review', mode: 'POST_EVENT_REVIEW' as CopilotMode, icon: Sparkles },
];

function getModeBannerStyles(banner: string): string {
  if (banner.includes('DEMO')) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (banner.includes('ACTIVE')) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (banner.includes('PLANNING') || banner.includes('TRAINING')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (banner.includes('POST-EVENT') || banner.includes('REVIEW')) return 'bg-violet-50 text-violet-700 border-violet-200';
  return 'bg-muted text-muted-foreground border-border';
}

export function CopilotPanel({ scenario, isOpen, onToggle }: CopilotPanelProps) {
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const copyResponseToClipboard = () => {
    if (!response) return;
    const lines: string[] = [];
    lines.push(`[${response.mode_banner}]`);
    lines.push('');
    if (response.framing_line) { lines.push(response.framing_line); lines.push(''); }
    if (response.insights?.length > 0) {
      response.insights.forEach((insight, index) => {
        lines.push(`${index + 1}. ${insight.title}`);
        insight.bullets.forEach(bullet => lines.push(`   • ${bullet}`));
        lines.push('');
      });
    }
    if (response.assumptions?.length > 0) {
      lines.push('ASSUMPTIONS:');
      response.assumptions.forEach(a => lines.push(`• ${a}`));
      lines.push('');
    }
    if (response.source_notes?.length > 0) {
      lines.push('SOURCE NOTES:');
      response.source_notes.forEach(n => lines.push(`• ${n}`));
      lines.push('');
    }
    lines.push('DISCLAIMER:');
    lines.push(response.disclaimer);
    if (response.model_engine) {
      lines.push('');
      lines.push(`MODEL: ${response.model_engine}`);
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      toast({ description: "Copied", duration: 2000 });
    });
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [response]);

  useEffect(() => {
    setResponse(null);
    setError(null);
  }, [scenario?.id]);

  const handleSend = async (prompt: string = input, mode?: CopilotMode) => {
    if (!prompt.trim() && !mode) return;

    setError(null);
    setIsLoading(true);

    try {
      // Single endpoint: copilot — uses NVIDIA Nemotron NIM as primary
      const requestBody: CopilotRequest = {
        mode: mode,
        user_message: prompt || `Analyze scenario in ${mode} mode`,
        scenario_id: scenario?.id,
        scenario: scenario ? {
          scenario_name: scenario.name,
          lifecycle_stage: scenario.lifecycle_stage,
          stage: scenario.stage,
          operator_role: scenario.operator_role,
          scenario_time: scenario.scenario_time,
          notes: scenario.notes,
          description: scenario.description,
          outage_type: scenario.outage_type,
        } : {},
        retrieved_knowledge: [],
        constraints: [],
      };

      const { data, error: fnError } = await supabase.functions.invoke('copilot', {
        body: requestBody,
      });

      if (fnError) throw fnError;
      setResponse(data as CopilotResponse);
      setInput('');
    } catch (err) {
      console.error('Copilot error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response from Copilot');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 420 : 48 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full border-l border-border bg-card flex flex-col"
    >
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center px-4 gap-3">
        <Button variant="ghost" size="icon" onClick={onToggle} className="flex-shrink-0">
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </Button>
        
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between flex-1 min-w-0">
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-semibold text-foreground">Operator Copilot</h3>
              <p className="text-xs text-muted-foreground">Decision Support Only</p>
            </div>
            {response && (
              <Button variant="ghost" size="icon" onClick={copyResponseToClipboard} className="h-8 w-8 flex-shrink-0" title="Copy response">
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {isOpen && (
        <>
          {/* Model Attribution + Mode Banner */}
          <div className="px-4 py-2 border-b border-border bg-muted/20 space-y-1.5">
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal border-primary/30 text-primary">
                  <Zap className="w-3 h-3" />
                  {response?.model_engine || 'NVIDIA Nemotron (NIM)'}
                </Badge>
                {response?.fallback_used && (
                  <Badge variant="outline" className="text-[10px] h-5 font-normal border-amber-500/30 text-amber-600 dark:text-amber-400">
                    {response.model_engine?.includes('Model Router') ? 'Model Router' : 'Deterministic Fallback'}
                  </Badge>
                )}
            </div>
            {response && (
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                getModeBannerStyles(response.mode_banner)
              )}>
                {response.mode_banner}
              </span>
            )}
          </div>

          {/* Outage Type Header */}
          {scenario && (
            <div className="px-4 py-2 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Outage Type:</span>
                <OutageTypeBadge type={scenario.outage_type} />
              </div>
            </div>
          )}

          {/* Content */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <AnimatePresence mode="popLayout">
              {/* Empty State */}
              {!response && !isLoading && !error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {scenario ? 'Select a mode to begin analysis' : 'Select a scenario to get started'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-6">
                    Powered by NVIDIA Nemotron NIM — all outputs are advisory only.
                  </p>
                  
                  {scenario && (
                    <div className="space-y-2">
                      {suggestedPrompts.map((prompt) => (
                        <Button key={prompt.label} variant="outline" size="sm" className="w-full justify-start gap-2 text-left" onClick={() => handleSend(prompt.label, prompt.mode)}>
                          <prompt.icon className="w-4 h-4 text-primary" />
                          {prompt.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Error State */}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Error</span>
                  </div>
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              {/* Structured Response */}
              {response && (
                <div className="space-y-6">
                  {/* Context */}
                  {scenario && (
                    <p className="text-xs text-muted-foreground/70">
                      Context: Scenario '{scenario.name}' • Outage Type: {scenario.outage_type || 'Unknown'}
                    </p>
                  )}

                  {/* Framing Line */}
                  {response.framing_line && (
                    <p className="text-sm font-medium text-foreground leading-relaxed border-l-2 border-muted-foreground/30 pl-4 max-w-prose">
                      {response.framing_line}
                    </p>
                  )}

                  {/* Insights */}
                  {response.insights?.length > 0 ? (
                    <div className="space-y-5">
                      {response.insights.map((insight, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="leading-snug">{insight.title}</span>
                          </h4>
                          <ul className="space-y-1.5 ml-7 max-w-prose">
                            {insight.bullets.map((bullet, bulletIndex) => (
                              <li key={bulletIndex} className="text-sm text-muted-foreground flex items-start gap-2 leading-relaxed">
                                <span className="text-muted-foreground/60 mt-1">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                      No insights returned.
                    </div>
                  )}

                  {/* Assumptions */}
                  {response.assumptions?.length > 0 && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Assumptions</p>
                      <ul className="space-y-1.5 max-w-prose">
                        {response.assumptions.map((a, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                            <span className="mt-0.5">•</span><span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Source Notes */}
                  {response.source_notes?.length > 0 && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Source Notes</p>
                      <ul className="space-y-1.5 max-w-prose">
                        {response.source_notes.map((n, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                            <span className="mt-0.5">•</span><span>{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Model Attribution */}
                  <div className="p-2 rounded bg-muted/20 border border-border/50">
                    <p className="text-[11px] text-muted-foreground/80">
                      <span className="font-medium">Model:</span> {response.model_engine || 'NVIDIA Nemotron (NIM)'}
                      {response.fallback_used && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400">
                          • Fallback: {response.fallback_reason || 'Nemotron unavailable'}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-3 rounded border border-border/60 bg-muted/20">
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed max-w-prose">
                      <span className="font-medium uppercase tracking-wide">Disclaimer:</span>{' '}
                      {response.disclaimer}
                    </p>
                  </div>

                  {/* Reset */}
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setResponse(null)}>
                    Ask another question
                  </Button>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">Analyzing via Nemotron NIM…</span>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border space-y-3">
            {scenario && !isLoading && (
              <div className="flex flex-wrap gap-2">
                {['Executive summary', 'Risks & constraints', 'Trade-offs', 'After-action review'].map((prompt) => (
                  <Button key={prompt} variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleSend(prompt)}>
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={scenario ? "Ask about this scenario..." : "Select a scenario first"}
                disabled={!scenario || isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!scenario || !input.trim() || isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </motion.div>
  );
}
