import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, AlertTriangle, Lightbulb, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { CopilotMode, CopilotRequest, CopilotResponse } from '@/types/copilot';

const modeOptions: { value: CopilotMode; label: string; icon: string }[] = [
  { value: 'DEMO', label: 'Demo Mode', icon: '🎯' },
  { value: 'ACTIVE_EVENT', label: 'Active Event', icon: '🔴' },
  { value: 'PLANNING', label: 'Planning', icon: '📋' },
  { value: 'POST_EVENT_REVIEW', label: 'Post-Event Review', icon: '📊' },
];

export default function CopilotStudio() {
  const [mode, setMode] = useState<CopilotMode>('DEMO');
  const [userMessage, setUserMessage] = useState('');
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    const request: CopilotRequest = {
      mode,
      user_message: userMessage,
      context_packet: {},
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
              Phase 1 — I/O Contract
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

          {/* Response Panel */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="w-5 h-5 text-primary" />
                Copilot Response
              </CardTitle>
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
                    <p>Send a message to see the Copilot response</p>
                  </motion.div>
                )}

                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 py-8"
                  >
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                      >
                        <Sparkles className="w-8 h-8 text-primary" />
                      </motion.div>
                    </div>
                    <p className="text-center text-muted-foreground">Analyzing your request...</p>
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
                    {/* Mode Banner */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                      <p className="font-bold text-foreground tracking-wide">{response.mode_banner}</p>
                    </div>

                    {/* Framing Line */}
                    {response.framing_line && (
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-sm text-foreground italic">{response.framing_line}</p>
                      </div>
                    )}

                    {/* Insights */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-warning" />
                        Insights
                      </h4>
                      <ul className="space-y-2">
                        {response.insights.map((insight, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30"
                          >
                            {insight}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Tradeoffs */}
                    {response.tradeoffs && response.tradeoffs.length > 0 && (
                      <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        Tradeoffs
                      </h4>
                      <ul className="space-y-1">
                        {response.tradeoffs.map((tradeoff, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-destructive/30">
                              {tradeoff}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Source Notes */}
                    {response.source_notes && response.source_notes.length > 0 && (
                      <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Source Notes
                      </h4>
                      <ul className="space-y-1">
                        {response.source_notes.map((note, i) => (
                          <li key={i} className="text-xs text-muted-foreground pl-4 border-l-2 border-primary/30">
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Disclaimer */}
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground italic">{response.disclaimer}</p>
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
