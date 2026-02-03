import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, AlertTriangle, ShieldAlert, Lightbulb, FileText, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OutageTypeBadge } from '@/components/ui/outage-type-badge';
import { supabase } from '@/integrations/supabase/client';
import type { CopilotMode, CopilotRequest, CopilotResponse } from '@/types/copilot';
import type { OutageType } from '@/types/scenario';
import { OUTAGE_TYPES } from '@/types/scenario';

const modeOptions: { value: CopilotMode; label: string; icon: string }[] = [
  { value: 'DEMO', label: 'Demo Mode', icon: '🎯' },
  { value: 'ACTIVE_EVENT', label: 'Active Event', icon: '🔴' },
  { value: 'PLANNING', label: 'Planning', icon: '📋' },
  { value: 'POST_EVENT_REVIEW', label: 'Post-Event Review', icon: '📊' },
];

export default function CopilotStudio() {
  const [mode, setMode] = useState<CopilotMode>('DEMO');
  const [outageType, setOutageType] = useState<OutageType>('Storm');
  const [scenarioName, setScenarioName] = useState('Test Scenario');
  const [userMessage, setUserMessage] = useState('');
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatResponseForCopy = (res: CopilotResponse): string => {
    let text = `[${res.mode_banner}]\n\n`;
    
    if (res.framing_line) {
      text += `${res.framing_line}\n\n`;
    }
    
    if (res.insights && res.insights.length > 0) {
      res.insights.forEach((insight, index) => {
        text += `${index + 1}. ${insight.title}\n`;
        insight.bullets.forEach((bullet) => {
          text += `   • ${bullet}\n`;
        });
        text += '\n';
      });
    }
    
    if (res.assumptions && res.assumptions.length > 0) {
      text += `ASSUMPTIONS:\n`;
      res.assumptions.forEach((assumption) => {
        text += `• ${assumption}\n`;
      });
      text += '\n';
    }
    
    if (res.source_notes && res.source_notes.length > 0) {
      text += `SOURCE NOTES:\n`;
      res.source_notes.forEach((note) => {
        text += `• ${note}\n`;
      });
      text += '\n';
    }
    
    if (res.disclaimer) {
      text += `DISCLAIMER: ${res.disclaimer}`;
    }
    
    return text;
  };

  const handleCopyResponse = async () => {
    if (!response) return;
    
    try {
      await navigator.clipboard.writeText(formatResponseForCopy(response));
      setCopied(true);
      toast.success('Response copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy response');
    }
  };

  const handleSend = async () => {
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    const request: CopilotRequest = {
      mode,
      user_message: userMessage,
      scenario: {
        scenario_name: scenarioName,
        outage_type: outageType,
        lifecycle_stage: 'Event',
        stage: false,
      },
      retrieved_knowledge: [],
      constraints: [],
    };

    try {
      const { data, error: fnError } = await supabase.functions.invoke('copilot', {
        body: request,
      });

      if (fnError) throw fnError;
      setResponse(data as CopilotResponse);
    } catch (err) {
      console.error('Copilot error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Operator Copilot</h1>
              <p className="text-sm text-muted-foreground">Scenario Studio</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-warning/10 text-warning border-warning/30">
              Phase 1 — Deterministic Mock
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Panel */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="w-5 h-5 text-primary" />
                Copilot Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mode</label>
                <Select value={mode} onValueChange={(v) => setMode(v as CopilotMode)}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Outage Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Outage Type</label>
                <Select value={outageType} onValueChange={(v) => setOutageType(v as OutageType)}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTAGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your Message</label>
                <Textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Ask the Copilot about your scenario..."
                  className="min-h-[140px] resize-none bg-background"
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={!userMessage.trim() || isLoading}
                className="w-full gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to Copilot
                  </>
                )}
              </Button>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="w-5 h-5 text-primary" />
                  Copilot Response
                </CardTitle>
                {response && !isLoading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={handleCopyResponse}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {!response && !isLoading && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="mb-2">Send a message to see the Copilot response.</p>
                    <p className="text-xs">
                      Responses are deterministically generated from mode + outage_type + scenario fields.
                    </p>
                  </motion.div>
                )}

                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Skeleton Outage Type Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>

                    {/* Skeleton Mode Banner */}
                    <Skeleton className="h-8 w-40 rounded-full" />

                    {/* Skeleton Framing Line */}
                    <div className="border-l-2 border-muted pl-3 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* Skeleton Insights */}
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.15 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <Skeleton className="w-5 h-5 rounded-full" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                          <div className="pl-7 space-y-1.5">
                            <div className="flex items-start gap-2">
                              <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5" />
                              <Skeleton className="h-3 w-full" />
                            </div>
                            <div className="flex items-start gap-2">
                              <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5" />
                              <Skeleton className="h-3 w-5/6" />
                            </div>
                            <div className="flex items-start gap-2">
                              <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5" />
                              <Skeleton className="h-3 w-4/5" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Skeleton Assumptions Block */}
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>

                    {/* Skeleton Disclaimer */}
                    <div className="pt-4 border-t border-border">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-start gap-2">
                          <Skeleton className="w-4 h-4 rounded mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-5/6" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Processing indicator */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-4 h-4 text-primary" />
                      </motion.div>
                      <span className="text-sm text-muted-foreground">Generating response...</span>
                    </div>
                  </motion.div>
                )}

                {response && !isLoading && (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Outage Type Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Outage Type:</span>
                      <OutageTypeBadge type={outageType} />
                    </div>

                    {/* Mode Banner */}
                    <div className="flex items-center justify-start">
                      <Badge className="bg-primary/90 text-primary-foreground text-sm font-bold px-4 py-1.5 rounded-full">
                        {response.mode_banner}
                      </Badge>
                    </div>

                    {/* Framing Line (only if present) */}
                    {response.framing_line && (
                      <p className="text-sm font-semibold text-foreground border-l-2 border-primary pl-3">
                        {response.framing_line}
                      </p>
                    )}

                    {/* Insights */}
                    <div className="space-y-4">
                      {response.insights && response.insights.length > 0 ? (
                        response.insights.map((insight, index) => (
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
                            <ul className="space-y-1.5 pl-7">
                              {insight.bullets.map((bullet, bulletIndex) => (
                                <li
                                  key={bulletIndex}
                                  className="text-sm text-muted-foreground flex items-start gap-2"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 flex-shrink-0" />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                          No insights returned.
                        </div>
                      )}
                    </div>

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
                    <div className="pt-4 border-t border-border">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              Disclaimer
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {response.disclaimer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
