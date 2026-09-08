"use client";

// Auto-submitting sort dropdown (client-side so onChange can submit the
// surrounding GET form; degrades to a Sort button via <noscript>).
export function SortSelect({ value }: { value: string }) {
  return (
    <select
      id="sort"
      name="sort"
      defaultValue={value}
      className="input !py-2 !min-h-0 text-sm"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      aria-label="Sort pieces"
    >
      <option value="newest">Newest</option>
      <option value="price-asc">Price · low to high</option>
      <option value="price-desc">Price · high to low</option>
      <option value="name">Name · A–Z</option>
    </select>
  );
}
