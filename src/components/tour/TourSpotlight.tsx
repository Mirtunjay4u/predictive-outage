import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveSelector } from '@/lib/tour-engine';

interface TourSpotlightProps {
  selector: string | null;
  caption: string | null;
  visible: boolean;
}

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CaptionPosition {
  top: number;
  left: number;
  maxWidth: number;
  anchor: 'bottom' | 'top';
}

function computeCaptionPos(rect: DOMRect): CaptionPosition {
  const pad = 12;
  const maxW = 320;
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  // Prefer below the element
  let anchor: 'bottom' | 'top' = 'bottom';
  let top = rect.bottom + pad;
  if (top + 60 > vpH) {
    anchor = 'top';
    top = rect.top - pad - 60;
  }

  let left = rect.left + rect.width / 2 - maxW / 2;
  if (left < pad) left = pad;
  if (left + maxW > vpW - pad) left = vpW - pad - maxW;

  return { top, left, maxWidth: maxW, anchor };
}

export function TourSpotlight({ selector, caption, visible }: TourSpotlightProps) {
  const [spotPos, setSpotPos] = useState<SpotlightPosition | null>(null);
  const [capPos, setCapPos] = useState<CaptionPosition | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!visible || !selector) {
      setSpotPos(null);
      setCapPos(null);
      return;
    }

    const update = () => {
      const el = resolveSelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const pad = 8;
        setSpotPos({
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        });
        if (caption) setCapPos(computeCaptionPos(rect));
      } else {
        setSpotPos(null);
        setCapPos(null);
      }
      rafRef.current = requestAnimationFrame(update);
    };

    // Initial delay for DOM to settle after scroll
    const timer = setTimeout(() => {
      update();
    }, 200);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [selector, caption, visible]);

  if (!visible) return null;

  return (
    <>
      {/* Dim overlay */}
      <AnimatePresence>
        {spotPos && (
          <motion.div
            key="dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9990] pointer-events-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
          />
        )}
      </AnimatePresence>

      {/* Glow ring around target */}
      <AnimatePresence>
        {spotPos && (
          <motion.div
            key="glow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed z-[9991] pointer-events-none rounded-xl"
            style={{
              top: spotPos.top,
              left: spotPos.left,
              width: spotPos.width,
              height: spotPos.height,
              boxShadow: '0 0 0 2px hsl(217 91% 60% / 0.6), 0 0 20px 4px hsl(217 91% 60% / 0.25), 0 0 40px 8px hsl(217 91% 60% / 0.1)',
              border: '2px solid hsl(217 91% 60% / 0.4)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating caption */}
      <AnimatePresence>
        {capPos && caption && (
          <motion.div
            key="caption"
            initial={{ opacity: 0, y: capPos.anchor === 'bottom' ? -6 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: capPos.anchor === 'bottom' ? -6 : 6 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="fixed z-[9992] pointer-events-none"
            style={{
              top: capPos.top,
              left: capPos.left,
              maxWidth: capPos.maxWidth,
            }}
          >
            <div className="rounded-lg border border-primary/30 bg-card/95 dark:bg-card/98 backdrop-blur-xl shadow-lg px-3.5 py-2.5">
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-lg bg-gradient-to-r from-primary via-accent to-primary" />
              <p className="text-[11px] text-foreground/90 leading-relaxed font-medium">
                <span className="text-primary font-semibold text-[10px] uppercase tracking-wider mr-1.5">▸</span>
                {caption}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
