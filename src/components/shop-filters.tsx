"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export type FilterState = {
  category: string;
  collection: string;
  material: string;
  purity: string;
  min: string;
  max: string;
  availability: string;
  sort: string;
};

type Props = {
  basePath: string;
  current: FilterState;
  categories: { name: string; slug: string }[];
  collections: { name: string; slug: string }[];
  materials: string[];
  purities: string[];
};

// Filters navigate by pushing a new URL — shareable, no JS required to
// *read* filtered pages, and the drawer is pure presentation.
export function ShopFilters({ basePath, current, categories, collections, materials, purities }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  function navigate(next: Partial<FilterState>) {
    const merged = { ...current, ...next };
    const sp = new URLSearchParams();
    if (merged.category) sp.set("category", merged.category);
    if (merged.collection) sp.set("collection", merged.collection);
    if (merged.material) sp.set("material", merged.material);
    if (merged.purity) sp.set("purity", merged.purity);
    if (merged.min) sp.set("min", merged.min);
    if (merged.max) sp.set("max", merged.max);
    if (merged.availability === "in-stock") sp.set("availability", "in-stock");
    if (merged.sort && merged.sort !== "newest") sp.set("sort", merged.sort);
    const qs = sp.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    setOpen(false);
  }

  const hasFilters =
    current.category || current.collection || current.material || current.purity || current.min || current.max || current.availability === "in-stock";

  const body = (
    <div className="space-y-7">
      <FilterGroup title="Category">
        <div className="space-y-2">
          <FilterLink active={!current.category} onClick={() => navigate({ category: "" })} label="All jewelry" />
          {categories.map((c) => (
            <FilterLink
              key={c.slug}
              active={current.category === c.slug}
              onClick={() => navigate({ category: current.category === c.slug ? "" : c.slug })}
              label={c.name}
            />
          ))}
        </div>
      </FilterGroup>

      {collections.length > 0 && (
        <FilterGroup title="Collection">
          <div className="space-y-2">
            <FilterLink active={!current.collection} onClick={() => navigate({ collection: "" })} label="All collections" />
            {collections.map((c) => (
              <FilterLink
                key={c.slug}
                active={current.collection === c.slug}
                onClick={() => navigate({ collection: current.collection === c.slug ? "" : c.slug })}
                label={c.name}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Price (৳)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            navigate({ min: String(fd.get("min") ?? ""), max: String(fd.get("max") ?? "") });
          }}
        >
          <input
            name="min"
            type="number"
            min={0}
            placeholder="Min"
            defaultValue={current.min}
            className="input !py-2 !min-h-0 text-sm"
            aria-label="Minimum price in taka"
          />
          <span className="text-muted text-sm">–</span>
          <input
            name="max"
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={current.max}
            className="input !py-2 !min-h-0 text-sm"
            aria-label="Maximum price in taka"
          />
          <button type="submit" className="btn btn-quiet !py-2 !px-4 shrink-0">
            Go
          </button>
        </form>
      </FilterGroup>

      {purities.length > 0 && (
        <FilterGroup title="Purity">
          <div className="space-y-2">
            <FilterLink active={!current.purity} onClick={() => navigate({ purity: "" })} label="All purities" />
            {purities.map((p) => (
              <FilterLink
                key={p}
                active={current.purity === p}
                onClick={() => navigate({ purity: current.purity === p ? "" : p })}
                label={p}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      {materials.length > 0 && (
        <FilterGroup title="Material">
          <div className="space-y-2">
            <FilterLink active={!current.material} onClick={() => navigate({ material: "" })} label="All materials" />
            {materials.map((m) => (
              <FilterLink
                key={m}
                active={current.material === m}
                onClick={() => navigate({ material: current.material === m ? "" : m })}
                label={m}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Availability">
        <div className="space-y-2">
          <FilterLink active={current.availability !== "in-stock"} onClick={() => navigate({ availability: "all" })} label="All pieces" />
          <FilterLink
            active={current.availability === "in-stock"}
            onClick={() => navigate({ availability: current.availability === "in-stock" ? "all" : "in-stock" })}
            label="In stock now"
          />
        </div>
      </FilterGroup>

      {hasFilters && (
        <button type="button" className="btn btn-quiet w-full" onClick={() => router.push(basePath)}>
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: filter button + drawer */}
      <div className="lg:hidden">
        <button type="button" className="btn btn-quiet w-full" aria-expanded={open} onClick={() => setOpen(true)}>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mr-2">
            <path d="M3 6h14M6 10h8M8 14h4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Filters{hasFilters ? " · active" : ""}
        </button>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-ink/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />
              <motion.div
                className="fixed inset-y-0 left-0 z-50 w-[88%] max-w-sm bg-bg flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
                initial={reduce ? { opacity: 0 } : { x: "-100%" }}
                animate={reduce ? { opacity: 1 } : { x: 0 }}
                exit={reduce ? { opacity: 0 } : { x: "-100%" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center justify-between px-5 h-14 border-b border-line">
                  <span className="eyebrow">Filters</span>
                  <button type="button" className="p-2 -mr-2" aria-label="Close filters" onClick={() => setOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto slim-scroll px-5 py-6">{body}</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <p className="eyebrow mb-6">Refine</p>
        {body}
      </aside>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted mb-3">{title}</h3>
      {children}
    </section>
  );
}

function FilterLink({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`block w-full text-left text-sm py-1 transition-colors ${
        active ? "text-accent-deep font-medium" : "text-ink hover:text-accent-deep"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        <span className={`inline-block w-3 h-px ${active ? "bg-accent" : "bg-transparent"}`} aria-hidden="true" />
        {label}
      </span>
    </button>
  );
}
