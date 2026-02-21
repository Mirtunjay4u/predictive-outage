import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Loader2, ChevronRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DecisionTrace } from '@/components/copilot/DecisionTrace';

const QUICK_PROMPTS = [
  'How is ETR confidence calculated?',
  'How does this differ from OMS?',
  'What governance safeguards exist?',
  'How does NVIDIA Nemotron integrate?',
  'Is switching automated?',
  'What is Phase 2 roadmap?',
  'How does the rule engine constrain AI?',
  'What data sources are integrated?',
];

interface StructuredAnswer {
  context: string;
  technical_mechanism: string[];
  governance_controls: string;
  strategic_value: string;
}

function parseAnswer(raw: string): StructuredAnswer | null {
  try {
    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.context && parsed.technical_mechanism && parsed.governance_controls && parsed.strategic_value) {
      return parsed as StructuredAnswer;
    }
    return null;
  } catch {
    return null;
  }
}

export function ExecutiveIntelligenceConsole() {
  const location = useLocation();
  const isOutageMap = location.pathname === '/outage-map';
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<StructuredAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = useCallback(async (question: string) => {
    setActiveQuestion(question);
    setAnswer(null);
    setError(null);
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('executive-console', {
        body: { question },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.answer) {
        const parsed = parseAnswer(typeof data.answer === 'string' ? data.answer : JSON.stringify(data.answer));
        if (parsed) {
          setAnswer(parsed);
        } else {
          // If it didn't parse into structured format, build a fallback
          setAnswer({
            context: typeof data.answer === 'string' ? data.answer : JSON.stringify(data.answer),
            technical_mechanism: [],
            governance_controls: 'All outputs are advisory. No autonomous control actions.',
            strategic_value: '',
          });
        }
      } else {
        setError('No response received.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      {/* Floating Button */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen(true)}
            className={cn(
              'fixed z-50 flex items-center justify-center rounded-full',
              'w-14 h-14 shadow-lg transition-all duration-200',
              'hover:shadow-xl hover:scale-105',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
              isOutageMap ? 'bottom-20 left-6' : 'bottom-6 right-6',
              open && 'scale-0 opacity-0 pointer-events-none'
            )}
            style={{
              background: 'linear-gradient(135deg, #0B1220 0%, #1E3A8A 100%)',
            }}
            aria-label="Open Executive Intelligence Console"
          >
            {/* Shield + neural node icon */}
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L4 6V12C4 17.52 7.84 22.74 13 24C18.16 22.74 22 17.52 22 12V6L13 2Z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" fill="none" />
              <circle cx="13" cy="11" r="2" fill="rgba(255,255,255,0.85)" />
              <circle cx="9" cy="15" r="1.2" fill="rgba(147,197,253,0.7)" />
              <circle cx="17" cy="15" r="1.2" fill="rgba(147,197,253,0.7)" />
              <circle cx="13" cy="7" r="1.2" fill="rgba(147,197,253,0.7)" />
              <line x1="13" y1="11" x2="9" y2="15" stroke="rgba(147,197,253,0.5)" strokeWidth="0.8" />
              <line x1="13" y1="11" x2="17" y2="15" stroke="rgba(147,197,253,0.5)" strokeWidth="0.8" />
              <line x1="13" y1="11" x2="13" y2="7" stroke="rgba(147,197,253,0.5)" strokeWidth="0.8" />
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs font-medium">
          Executive Intelligence Console
        </TooltipContent>
      </Tooltip>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-[420px] flex flex-col',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{
          background: 'linear-gradient(180deg, #0F172A 0%, #111827 100%)',
        }}
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                <h2 className="text-[0.9375rem] font-semibold text-white tracking-tight leading-tight">
                  Operator Copilot Intelligence Console
                </h2>
              </div>
              <p className="text-[10px] text-blue-300/70 mt-1 tracking-wide font-medium">
                AI-Augmented · Deterministically Governed · Advisory Only
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-[9px] font-medium tracking-wide px-2 py-0.5 rounded bg-blue-900/50 text-blue-300/80 border border-blue-700/30 whitespace-nowrap">
                Phase 1 Scope Active
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close console"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-blue-500/30 via-slate-600/20 to-transparent" />
        </div>

        {/* Quick Prompts */}
        <div className="shrink-0 px-5 pb-3">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
            Executive Queries
          </p>
          <div className="grid grid-cols-1 gap-1">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => askQuestion(q)}
                disabled={loading}
                className={cn(
                  'flex items-center gap-2 text-left px-3 py-2 rounded text-[11px] leading-snug transition-all',
                  'text-slate-300 hover:text-white hover:bg-white/5',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  activeQuestion === q && 'bg-blue-900/30 text-blue-200'
                )}
              >
                <ChevronRight className="w-3 h-3 shrink-0 text-slate-500" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mx-5 h-px bg-slate-700/30" />

        {/* Content Area */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-4">
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing intelligence query...</span>
              </div>
            )}

            {error && (
              <div className="text-red-400/80 text-xs bg-red-900/10 border border-red-800/20 rounded px-3 py-2">
                {error}
              </div>
            )}

            {answer && !loading && (
              <div className="space-y-4 animate-fade-in">
                {/* CONTEXT */}
                <section>
                  <h4 className="text-[10px] uppercase tracking-widest text-blue-400/80 font-bold mb-1.5">
                    Context
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    {answer.context}
                  </p>
                </section>

                {/* TECHNICAL MECHANISM */}
                {answer.technical_mechanism.length > 0 && (
                  <section>
                    <h4 className="text-[10px] uppercase tracking-widest text-blue-400/80 font-bold mb-1.5">
                      Technical Mechanism
                    </h4>
                    <ul className="space-y-1">
                      {answer.technical_mechanism.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-300">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400/50 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* GOVERNANCE CONTROLS */}
                <section>
                  <h4 className="text-[10px] uppercase tracking-widest text-blue-400/80 font-bold mb-1.5">
                    Governance Controls
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    {answer.governance_controls}
                  </p>
                </section>

                {/* STRATEGIC VALUE */}
                {answer.strategic_value && (
                  <section>
                    <h4 className="text-[10px] uppercase tracking-widest text-blue-400/80 font-bold mb-1.5">
                      Strategic Value
                    </h4>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {answer.strategic_value}
                    </p>
                  </section>
                )}

                {/* Decision Trace */}
                {answer && !loading && (
                  <DecisionTrace
                    modelUsed="NVIDIA Nemotron (NIM)"
                    className="mt-2"
                  />
                )}
              </div>
            )}

            {!loading && !answer && !error && (
              <div className="text-center py-8">
                <Shield className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[260px] mx-auto">
                  Select an executive query above to receive structured intelligence within Phase 1 scope boundaries.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-slate-700/30">
          <p className="text-[9px] text-slate-500/70 text-center tracking-wide font-medium">
            AI-Augmented. Deterministically Governed. Operator-Controlled.
          </p>
        </div>
      </div>
    </>
  );
}
