import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Copy, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { TourMode } from '@/lib/tour-modes';
import { getNarrationForMode, getStepsForMode } from '@/lib/tour-modes';

interface TourTranscriptPanelProps {
  mode: TourMode;
  currentStep: number;
  isOpen: boolean;
  onClose: () => void;
}

export function TourTranscriptPanel({ mode, currentStep, isOpen, onClose }: TourTranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const scripts = getNarrationForMode(mode);
  const steps = getStepsForMode(mode);

  // Auto-scroll to active step
  useEffect(() => {
    if (autoScroll && activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, autoScroll]);

  const handleCopyAll = () => {
    const text = scripts.map((s, i) => `Step ${i + 1}: ${steps[i]?.title ?? ''}\n${s}`).join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Transcript copied to clipboard');
  };

  const filteredIndices = searchQuery.trim()
    ? scripts.reduce<number[]>((acc, s, i) => {
        if (s.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (steps[i]?.title ?? '').toLowerCase().includes(searchQuery.toLowerCase())) {
          acc.push(i);
        }
        return acc;
      }, [])
    : scripts.map((_, i) => i);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 340, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 bottom-0 z-[9997] w-[320px] border-l border-border/50 bg-card/98 backdrop-blur-xl shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                Transcript
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleCopyAll}
                title="Copy full transcript"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onClose}
                title="Close transcript"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <Input
                placeholder="Search transcript..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-[11px] bg-muted/30 border-border/30"
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] text-muted-foreground/60">
                {filteredIndices.length} of {scripts.length} steps
              </span>
              <button
                onClick={() => setAutoScroll(v => !v)}
                className={cn(
                  'text-[9px] font-medium px-1.5 py-0.5 rounded transition-colors',
                  autoScroll
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Auto-scroll {autoScroll ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Transcript body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {filteredIndices.map((idx) => {
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <div
                  key={idx}
                  ref={isActive ? activeRef : undefined}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 transition-all duration-200',
                    isActive
                      ? 'border-primary/40 bg-primary/5 shadow-sm'
                      : isPast
                      ? 'border-border/20 bg-muted/20 opacity-60'
                      : 'border-border/30 bg-card'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isActive && (
                      <ChevronRight className="h-3 w-3 text-primary animate-pulse" />
                    )}
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-[0.12em]',
                      isActive ? 'text-primary' : 'text-muted-foreground/70'
                    )}>
                      Step {idx + 1}
                    </span>
                    <span className={cn(
                      'text-[10px] font-semibold',
                      isActive ? 'text-foreground' : 'text-foreground/70'
                    )}>
                      {steps[idx]?.title}
                    </span>
                  </div>
                  <p className={cn(
                    'text-[11px] leading-relaxed',
                    isActive ? 'text-foreground/90' : 'text-muted-foreground'
                  )}>
                    {scripts[idx]}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border/30">
            <p className="text-[9px] text-muted-foreground/50 text-center">
              Advisory-Only · Governed Decision Intelligence
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
