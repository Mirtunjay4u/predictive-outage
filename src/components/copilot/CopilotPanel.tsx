import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, ChevronRight, ShieldAlert, AlertCircle, FileText, Lightbulb, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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

function getModeBannerVariant(banner: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (banner.includes('DEMO')) return 'secondary';
  if (banner.includes('ACTIVE')) return 'destructive';
  if (banner.includes('PLANNING')) return 'outline';
  return 'default';
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
    
    // Mode banner
    lines.push(`[${response.mode_banner}]`);
    lines.push('');
    
    // Framing line
    if (response.framing_line) {
      lines.push(response.framing_line);
      lines.push('');
    }
    
    // Insights
    if (response.insights && response.insights.length > 0) {
      response.insights.forEach((insight, index) => {
        lines.push(`${index + 1}. ${insight.title}`);
        insight.bullets.forEach(bullet => {
          lines.push(`   • ${bullet}`);
        });
        lines.push('');
      });
    }
    
    // Assumptions
    if (response.assumptions && response.assumptions.length > 0) {
      lines.push('ASSUMPTIONS:');
      response.assumptions.forEach(assumption => {
        lines.push(`• ${assumption}`);
      });
      lines.push('');
    }
    
    // Source Notes
    if (response.source_notes && response.source_notes.length > 0) {
      lines.push('SOURCE NOTES:');
      response.source_notes.forEach(note => {
        lines.push(`• ${note}`);
      });
      lines.push('');
    }
    
    // Disclaimer
    lines.push('DISCLAIMER:');
    lines.push(response.disclaimer);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      toast({
        description: "Copied",
        duration: 2000,
      });
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="flex-shrink-0"
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </Button>
        
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between flex-1 min-w-0"
          >
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-semibold text-foreground">Operator Copilot</h3>
              <p className="text-xs text-muted-foreground">
                Predictive Outage Management — Decision Support Only
              </p>
            </div>
            {response && (
              <Button
                variant="ghost"
                size="icon"
                onClick={copyResponseToClipboard}
                className="h-8 w-8 flex-shrink-0"
                title="Copy response"
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {isOpen && (
        <>
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {scenario 
                      ? 'Select a mode to begin analysis' 
                      : 'Select a scenario to get started'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mb-6">
                    You can ask for: summary, risks, trade-offs, restoration prioritization, post-event outcomes.
                  </p>
                  
                  {scenario && (
                    <div className="space-y-2">
                      {suggestedPrompts.map((prompt) => (
                        <Button
                          key={prompt.label}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 text-left"
                          onClick={() => handleSend(prompt.label, prompt.mode)}
                        >
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Error</span>
                  </div>
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              {/* Structured Response */}
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Mode Banner */}
                  <Badge 
                    variant={getModeBannerVariant(response.mode_banner)}
                    className="text-xs font-bold tracking-wide"
                  >
                    {response.mode_banner}
                  </Badge>

                  {/* Framing Line */}
                  {response.framing_line && (
                    <p className="text-sm font-semibold text-foreground border-l-2 border-primary pl-3">
                      {response.framing_line}
                    </p>
                  )}

                  {/* Insights */}
                  {response.insights && response.insights.length > 0 ? (
                    <div className="space-y-4">
                      {response.insights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="space-y-2"
                        >
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            {insight.title}
                          </h4>
                          <ul className="space-y-1 ml-7">
                            {insight.bullets.map((bullet, bulletIndex) => (
                              <li key={bulletIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1.5">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                      No insights returned. You can ask for: summary, risks, trade-offs, restoration prioritization, post-event outcomes.
                    </div>
                  )}

                  {/* Assumptions Block */}
                  {response.assumptions && response.assumptions.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                          Assumptions
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {response.assumptions.map((assumption, index) => (
                          <li key={index} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>{assumption}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Source Notes Block */}
                  {response.source_notes && response.source_notes.length > 0 && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                          Source Notes
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {response.source_notes.map((note, index) => (
                          <li key={index} className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Disclaimer</p>
                        <p className="text-xs text-muted-foreground italic">
                          {response.disclaimer}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setResponse(null)}
                  >
                    Ask another question
                  </Button>
                </motion.div>
              )}

              {/* Loading State */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-muted-foreground py-8 justify-center"
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">Analyzing...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Quick Prompt Chips */}
            {scenario && !isLoading && (
              <div className="flex flex-wrap gap-2">
                {['Executive summary', 'Risks & constraints', 'Trade-offs', 'After-action review'].map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={scenario ? "Ask about this scenario..." : "Select a scenario first"}
                disabled={!scenario || isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!scenario || !input.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </motion.div>
  );
}
