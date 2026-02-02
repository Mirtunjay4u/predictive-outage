import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, ChevronRight, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Scenario, CopilotMessage } from '@/types/scenario';

interface CopilotPanelProps {
  scenario: Scenario | null;
  isOpen: boolean;
  onToggle: () => void;
}

const suggestedPrompts = [
  { label: 'Summarize scenario', icon: Sparkles },
  { label: 'Find risks', icon: Sparkles },
  { label: 'Generate operator checklist', icon: Sparkles },
  { label: 'Recommend next steps', icon: Sparkles },
];

function generateMockResponse(prompt: string, scenario: Scenario | null): string {
  if (!scenario) return "Please select a scenario to get AI assistance.";

  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
    return `**Scenario Summary: ${scenario.name}**

This ${scenario.stage ? 'activated' : 'inactive'} scenario is in the **${scenario.lifecycle_stage}** phase.

${scenario.description ? `**Overview:** ${scenario.description}` : ''}

${scenario.operator_role ? `**Assigned Operator:** ${scenario.operator_role}` : 'No operator currently assigned.'}

${scenario.scenario_time ? `**Scheduled:** ${new Date(scenario.scenario_time).toLocaleString()}` : 'No specific time scheduled.'}

${scenario.notes ? `**Notes:** ${scenario.notes}` : ''}`;
  }

  if (lowerPrompt.includes('risk')) {
    return `**Risk Analysis for: ${scenario.name}**

Based on the scenario parameters, here are potential risks:

1. ${scenario.stage ? '✅ Scenario is activated - monitoring in place' : '⚠️ **Inactive Status** - Scenario not yet activated, may miss critical timing'}

2. ${scenario.operator_role ? `✅ ${scenario.operator_role} assigned` : '⚠️ **No Operator Assigned** - Critical roles unfilled'}

3. ${scenario.lifecycle_stage === 'Pre-Event' ? '⚠️ **Pre-Event Phase** - Ensure all preparations are verified' : scenario.lifecycle_stage === 'Event' ? '⚠️ **Active Event** - Monitor closely for deviations' : '✅ **Post-Event** - Focus on documentation and lessons learned'}

4. ${!scenario.scenario_time ? '⚠️ **No Timeline** - Missing scheduled time could affect coordination' : '✅ Timeline established'}

**Recommendation:** ${!scenario.stage ? 'Consider activating this scenario before the scheduled time.' : 'Continue monitoring and ensure all stakeholders are informed.'}`;
  }

  if (lowerPrompt.includes('checklist')) {
    return `**Operator Checklist for: ${scenario.name}**

${scenario.operator_role ? `*For: ${scenario.operator_role}*` : ''}

**Pre-Execution:**
- [ ] Verify scenario parameters are correct
- [ ] Confirm all stakeholders are notified
- [ ] Review emergency contacts and escalation paths
- [ ] Check equipment and systems readiness

**During ${scenario.lifecycle_stage}:**
- [ ] Monitor key performance indicators
- [ ] Document any deviations from plan
- [ ] Maintain communication with command center
- [ ] Log all significant events with timestamps

**Post-Execution:**
- [ ] Complete incident/event report
- [ ] Gather feedback from team members
- [ ] Update scenario documentation
- [ ] Schedule debrief meeting`;
  }

  if (lowerPrompt.includes('next') || lowerPrompt.includes('recommend')) {
    const recommendations = [];
    
    if (!scenario.stage) {
      recommendations.push('**Activate the scenario** to enable monitoring and tracking');
    }
    if (!scenario.operator_role) {
      recommendations.push('**Assign an operator** to ensure accountability');
    }
    if (scenario.lifecycle_stage === 'Pre-Event') {
      recommendations.push('**Complete pre-event verification** checklist');
      recommendations.push('**Schedule stakeholder briefing** before event time');
    }
    if (scenario.lifecycle_stage === 'Event') {
      recommendations.push('**Increase monitoring frequency** during active phase');
      recommendations.push('**Prepare contingency resources** for rapid response');
    }
    if (scenario.lifecycle_stage === 'Post-Event') {
      recommendations.push('**Conduct lessons learned** session within 48 hours');
      recommendations.push('**Archive documentation** for future reference');
    }

    return `**Recommended Next Steps for: ${scenario.name}**

${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}

**Priority Action:** ${recommendations[0] || 'Continue current operations'}`;
  }

  return `I understand you're asking about "${prompt}" for the scenario "${scenario.name}".

This is a ${scenario.stage ? 'currently active' : 'inactive'} ${scenario.lifecycle_stage.toLowerCase()} scenario${scenario.operator_role ? ` managed by ${scenario.operator_role}` : ''}.

How can I help you further? Try asking me to:
- Summarize the scenario
- Identify risks
- Generate a checklist
- Recommend next steps`;
}

export function CopilotPanel({ scenario, isOpen, onToggle }: CopilotPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useMockAI, setUseMockAI] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([]);
  }, [scenario?.id]);

  const handleSend = async (prompt: string = input) => {
    if (!prompt.trim()) return;

    const userMessage: CopilotMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    const response = generateMockResponse(prompt, scenario);
    
    const assistantMessage: CopilotMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
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
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <AnimatePresence mode="popLayout">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground mb-6">
                    {scenario 
                      ? 'Ask me anything about this scenario' 
                      : 'Select a scenario to get started'
                    }
                  </p>
                  
                  {scenario && (
                    <div className="space-y-2">
                      {suggestedPrompts.map((prompt) => (
                        <Button
                          key={prompt.label}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 text-left"
                          onClick={() => handleSend(prompt.label)}
                        >
                          <prompt.icon className="w-4 h-4 text-primary" />
                          {prompt.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'mb-4',
                    message.role === 'user' ? 'text-right' : 'text-left'
                  )}
                >
                  <div
                    className={cn(
                      'inline-block max-w-[90%] rounded-lg px-4 py-3 text-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">Thinking...</span>
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
