import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveSelector } from '@/lib/tour-engine';

interface TourSpotlightProps {
  selector: string | null;
  caption: string | null;
  visible: boolean;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 10;
const RADIUS = 12;
const CAPTION_MAX_W = 340;
const CAPTION_GAP = 14;

function computeCaption(rect: DOMRect) {
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  // prefer below
  let anchor: 'bottom' | 'top' = 'bottom';
  let top = rect.bottom + CAPTION_GAP;
  if (top + 64 > vpH) {
    anchor = 'top';
    top = rect.top - CAPTION_GAP - 64;
  }

  let left = rect.left + rect.width / 2 - CAPTION_MAX_W / 2;
  if (left < 12) left = 12;
  if (left + CAPTION_MAX_W > vpW - 12) left = vpW - 12 - CAPTION_MAX_W;

  return { top, left, anchor };
}

/**
 * Full-viewport spotlight overlay with SVG mask cutout.
 * Dims everything except the target element and renders a
 * pulsing glow ring + floating caption.
 */
export function TourSpotlight({ selector, caption, visible }: TourSpotlightProps) {
  const [spot, setSpot] = useState<SpotlightRect | null>(null);
  const [capStyle, setCapStyle] = useState<{ top: number; left: number; anchor: string } | null>(null);
  const rafRef = useRef(0);
  const [vpSize, setVpSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Track viewport resizes
  useEffect(() => {
    const onResize = () => setVpSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Track element position via rAF
  useEffect(() => {
    if (!visible || !selector) {
      setSpot(null);
      setCapStyle(null);
      return;
    }

    const update = () => {
      const el = resolveSelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setSpot({
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
        });
        if (caption) setCapStyle(computeCaption(rect));
      } else {
        setSpot(null);
        setCapStyle(null);
      }
      rafRef.current = requestAnimationFrame(update);
    };

    const timer = setTimeout(update, 180);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [selector, caption, visible]);

  // SVG mask path: full viewport rect with a rounded-rect cutout
  const maskPath = useMemo(() => {
    if (!spot) return '';
    const { w, h } = vpSize;
    const { top: y, left: x, width: sw, height: sh } = spot;
    const r = RADIUS;
    // Outer rect (full viewport) clockwise
    const outer = `M0,0 H${w} V${h} H0 Z`;
    // Inner rounded rect (cutout) counter-clockwise
    const inner = `M${x + r},${y}
      H${x + sw - r}
      Q${x + sw},${y} ${x + sw},${y + r}
      V${y + sh - r}
      Q${x + sw},${y + sh} ${x + sw - r},${y + sh}
      H${x + r}
      Q${x},${y + sh} ${x},${y + sh - r}
      V${y + r}
      Q${x},${y} ${x + r},${y} Z`;
    return `${outer} ${inner}`;
  }, [spot, vpSize]);

  if (!visible) return null;

  return (
    <>
      {/* ── SVG Mask Overlay ── */}
      <AnimatePresence>
        {spot && maskPath && (
          <motion.div
            key="mask-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-0 z-[9990] pointer-events-none"
          >
            <svg
              width={vpSize.w}
              height={vpSize.h}
              className="absolute inset-0"
              style={{ display: 'block' }}
            >
              <defs>
                {/* Feathered edge via blur filter */}
                <filter id="tour-spotlight-blur">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                </filter>
              </defs>
              <path
                d={maskPath}
                fillRule="evenodd"
                fill="rgba(0,0,0,0.55)"
                filter="url(#tour-spotlight-blur)"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Glow Ring ── */}
      <AnimatePresence>
        {spot && (
          <motion.div
            key="glow-ring"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed z-[9991] pointer-events-none"
            style={{
              top: spot.top,
              left: spot.left,
              width: spot.width,
              height: spot.height,
              borderRadius: RADIUS,
            }}
          >
            {/* Static border */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                border: '2px solid hsl(217 91% 60% / 0.5)',
                boxShadow: [
                  '0 0 0 1px hsl(217 91% 60% / 0.15)',
                  '0 0 24px 4px hsl(217 91% 60% / 0.2)',
                  '0 0 48px 8px hsl(217 91% 60% / 0.08)',
                ].join(', '),
              }}
            />
            {/* Pulsing outer glow */}
            <motion.div
              className="absolute -inset-1 rounded-xl"
              animate={{
                boxShadow: [
                  '0 0 16px 2px hsl(217 91% 60% / 0.25)',
                  '0 0 28px 6px hsl(217 91% 60% / 0.4)',
                  '0 0 16px 2px hsl(217 91% 60% / 0.25)',
                ],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Caption ── */}
      <AnimatePresence>
        {capStyle && caption && (
          <motion.div
            key="caption"
            initial={{ opacity: 0, y: capStyle.anchor === 'bottom' ? -8 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: capStyle.anchor === 'bottom' ? -8 : 8 }}
            transition={{ duration: 0.3, delay: 0.12, ease: 'easeOut' }}
            className="fixed z-[9992] pointer-events-none"
            style={{
              top: capStyle.top,
              left: capStyle.left,
              maxWidth: CAPTION_MAX_W,
            }}
          >
            <div className="relative rounded-lg border border-primary/25 bg-card/95 backdrop-blur-xl shadow-xl px-4 py-3 overflow-hidden">
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />
              <p className="relative text-[11px] text-foreground/90 leading-relaxed font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2 align-middle animate-pulse" />
                {caption}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
