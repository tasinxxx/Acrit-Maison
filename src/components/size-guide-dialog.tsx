"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RING_SIZE_CHART, BRACELET_SIZE_GUIDE, NECKLACE_LENGTH_GUIDE } from "@/lib/jewelry";

type Guide = "ring" | "bracelet" | "necklace";

const TITLES: Record<Guide, string> = {
  ring: "Ring size guide",
  bracelet: "Bracelet size guide",
  necklace: "Necklace length guide",
};

export function SizeGuideDialog({ kind }: { kind: Guide }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="relative inline-flex items-center text-sm text-accent-deep underline underline-offset-4 hover:text-ink transition-colors after:absolute after:-inset-x-2 after:-inset-y-2.5 after:content-['']"
        onClick={() => setOpen(true)}
      >
        Size guide
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-ink/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
              <motion.div
                className="pointer-events-auto bg-bg w-full sm:max-w-lg max-h-[85vh] flex flex-col border border-line"
                role="dialog"
                aria-modal="true"
                aria-label={TITLES[kind]}
                initial={reduce ? { opacity: 0 } : { y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { y: 60, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center justify-between px-6 h-14 border-b border-line shrink-0">
                  <h2 className="font-display text-xl">{TITLES[kind]}</h2>
                  <button type="button" className="p-2 -mr-2" aria-label="Close size guide" onClick={() => setOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-y-auto slim-scroll px-6 py-5 text-sm">
                  {kind === "ring" && (
                    <>
                      <p className="text-muted leading-relaxed">
                        Measure the inner diameter of a ring that fits well, in millimetres, and match it below.
                        Between sizes? We recommend sizing up.
                      </p>
                      <table className="w-full mt-4 border border-line text-sm">
                        <thead>
                          <tr className="bg-bg-deep text-left">
                            <th className="px-3 py-2 font-medium">Size</th>
                            <th className="px-3 py-2 font-medium">Diameter (mm)</th>
                            <th className="px-3 py-2 font-medium">Circumference (mm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {RING_SIZE_CHART.map((row) => (
                            <tr key={row.size} className="border-t border-line">
                              <td className="px-3 py-1.5">{row.size}</td>
                              <td className="px-3 py-1.5">{row.diameterMm}</td>
                              <td className="px-3 py-1.5">{row.circumferenceMm}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                  {kind === "bracelet" && (
                    <>
                      <p className="text-muted leading-relaxed">
                        Wrap a soft tape measure snugly around your wrist. Match your wrist measurement to the
                        bangle size below — bangles must pass over the hand, so when between sizes, size up.
                      </p>
                      <table className="w-full mt-4 border border-line text-sm">
                        <thead>
                          <tr className="bg-bg-deep text-left">
                            <th className="px-3 py-2 font-medium">Bangle size</th>
                            <th className="px-3 py-2 font-medium">Wrist (cm)</th>
                            <th className="px-3 py-2 font-medium">Fit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {BRACELET_SIZE_GUIDE.map((row) => (
                            <tr key={row.size} className="border-t border-line">
                              <td className="px-3 py-1.5">{row.size}</td>
                              <td className="px-3 py-1.5">{row.wristCm}</td>
                              <td className="px-3 py-1.5">{row.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                  {kind === "necklace" && (
                    <ul className="mt-2 space-y-3">
                      {NECKLACE_LENGTH_GUIDE.map((row) => (
                        <li key={row.length} className="flex gap-4 border-b border-line pb-3">
                          <span className="font-medium w-20 shrink-0">{row.length}</span>
                          <span className="text-muted">{row.note}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-muted mt-5">
                    Still unsure? Message us on WhatsApp — we will help you choose the right size.
                  </p>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
