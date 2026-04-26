import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable image carousel for listing cards + the detail modal.
 *
 * variant="card"  — compact: small chevrons appear on hover, dots overlay at bottom
 * variant="hero"  — large: prominent chevrons, image counter, optional thumbnails
 *
 * Supports keyboard arrows (when variant="hero" and active) and swipe on touch.
 */
export default function ImageCarousel({
  images = [],
  alt = '',
  variant = 'card',
  className = '',
  showThumbnails = false,
  enableKeyboard = false,
  fallbackUrl = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  onIndexChange,
}) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const safeImages = images && images.length > 0 ? images : [fallbackUrl];
  const total = safeImages.length;

  // Reset idx if images change (e.g. listing changes in modal)
  useEffect(() => {
    setIdx(0);
  }, [images]);

  useEffect(() => {
    onIndexChange?.(idx);
  }, [idx, onIndexChange]);

  // Keyboard navigation (hero only)
  useEffect(() => {
    if (!enableKeyboard) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft') {
        e.stopPropagation();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.stopPropagation();
        next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableKeyboard, total]);

  const prev = (e) => {
    e?.stopPropagation();
    setIdx((i) => (i - 1 + total) % total);
  };
  const next = (e) => {
    e?.stopPropagation();
    setIdx((i) => (i + 1) % total);
  };

  // Touch / swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  const onTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    if (touchStartX.current == null || touchEndX.current == null) return;
    const diff = touchStartX.current - touchEndX.current;
    const SWIPE_THRESHOLD = 40;
    if (diff > SWIPE_THRESHOLD) next();
    else if (diff < -SWIPE_THRESHOLD) prev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const isHero = variant === 'hero';
  const hasMultiple = total > 1;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className} ${isHero ? '' : 'group/carousel'}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <img
        src={safeImages[idx]}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-200"
        draggable={false}
      />

      {hasMultiple && (
        <>
          {/* Left arrow */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous photo"
            className={
              isHero
                ? 'absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all z-10'
                : 'absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#1A2F3A] flex items-center justify-center shadow-md opacity-0 group-hover/carousel:opacity-100 transition-all z-10'
            }
          >
            <ChevronLeft size={isHero ? 22 : 14} />
          </button>

          {/* Right arrow */}
          <button
            type="button"
            onClick={next}
            aria-label="Next photo"
            className={
              isHero
                ? 'absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all z-10'
                : 'absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#1A2F3A] flex items-center justify-center shadow-md opacity-0 group-hover/carousel:opacity-100 transition-all z-10'
            }
          >
            <ChevronRight size={isHero ? 22 : 14} />
          </button>

          {/* Counter (hero) or dots (card) */}
          {isHero ? (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
              {idx + 1} / {total}
            </div>
          ) : (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {safeImages.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Optional thumbnail strip — hero only */}
      {isHero && showThumbnails && hasMultiple && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm max-w-[90%] overflow-x-auto">
          {safeImages.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIdx(i);
              }}
              className={`flex-shrink-0 w-12 h-9 rounded overflow-hidden border-2 transition-all ${
                i === idx ? 'border-[#C4A962]' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
