import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, ChevronRight, ShieldAlert, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
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
  const [useMockAI, setUseMockAI] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        context_packet: scenario ? {
          scenario_id: scenario.id,
          scenario_name: scenario.name,
          lifecycle_stage: scenario.lifecycle_stage,
          stage: scenario.stage,
          operator_role: scenario.operator_role,
          scenario_time: scenario.scenario_time,
          notes: scenario.notes,
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
      animate={{ width: isOpen ? 400 : 48 }}
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
            className="flex items-center justify-between flex-1"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Copilot</h3>
                <p className="text-xs text-muted-foreground">
                  {scenario ? scenario.name : 'No scenario selected'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Mock</span>
              <Switch
                checked={useMockAI}
                onCheckedChange={setUseMockAI}
                className="scale-75"
              />
            </div>
          </motion.div>
        )}
      </div>

      {isOpen && (
        <>
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
                    <p className="text-sm font-semibold text-foreground">
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

                  {/* Disclaimer */}
                  <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border">
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
          <div className="p-4 border-t border-border">
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
