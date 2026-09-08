"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type Image = { id: string; url: string; alt: string };

export function ProductGallery({ images, name }: { images: Image[]; name: string }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const list = images.length > 0 ? images : [{ id: "none", url: "", alt: name }];

  const openLightbox = useCallback(() => setLightbox(true), []);
  const closeLightbox = useCallback(() => setLightbox(false), []);

  const next = useCallback(() => setActive((a) => (a + 1) % list.length), [list.length]);
  const prev = useCallback(() => setActive((a) => (a - 1 + list.length) % list.length), [list.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, closeLightbox, next, prev]);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  const activeImage = list[Math.min(active, list.length - 1)];

  return (
    <div>
      {/* Main frame */}
      <div
        ref={frameRef}
        className="relative aspect-[4/5] bg-bg-deep overflow-hidden cursor-zoom-in"
        onClick={openLightbox}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setZoom(null)}
        role="button"
        tabIndex={0}
        aria-label="Open image viewer"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openLightbox();
          }
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImage.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {activeImage.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeImage.url}
                alt={activeImage.alt || name}
                className="w-full h-full object-cover transition-transform duration-200"
                style={
                  zoom
                    ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                    : undefined
                }
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-muted text-sm">No image</span>
            )}
          </motion.div>
        </AnimatePresence>
        <span className="absolute bottom-3 right-3 badge badge-neutral pointer-events-none">
          Click to expand
        </span>
      </div>

      {/* Thumbnails */}
      {list.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto slim-scroll pb-1" role="tablist" aria-label="Product images">
          {list.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`View image ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden transition-opacity ${
                i === active ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
            >
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="block w-full h-full bg-bg-deep" />
              )}
              {i === active && (
                <motion.span layoutId="thumb-underline" className="absolute inset-0 border border-accent" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[60] bg-ink/95 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={`${name} image viewer`}
          >
            <button
              type="button"
              className="absolute top-4 right-4 p-3 text-bg/80 hover:text-bg"
              aria-label="Close viewer"
              onClick={closeLightbox}
            >
              <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            {list.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-3 sm:left-6 p-3 text-bg/80 hover:text-bg"
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 4l-8 8 8 8" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="absolute right-3 sm:right-6 p-3 text-bg/80 hover:text-bg"
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 4l8 8-8 8" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </>
            )}
            <motion.div
              key={activeImage.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[90vw] max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {activeImage.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeImage.url}
                  alt={activeImage.alt || name}
                  className="max-w-[90vw] max-h-[85vh] object-contain"
                />
              )}
              <p className="text-center text-bg/60 text-xs mt-3 tracking-wide">
                {active + 1} / {list.length} — {name}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
