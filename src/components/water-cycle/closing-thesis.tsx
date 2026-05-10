/**
 * closing-thesis.tsx — Final thesis statement
 *
 * Per spec §2 (locked thesis):
 *   "The glacier was your reservoir. We are draining it."
 * Past tense. Universal. Appears after the last chapter section.
 *
 * Color grammar (§7): ice = #7DD3FC for "reservoir", loss = #F87171 for "draining"
 */
export function ClosingThesis() {
  return (
    <section
      className="relative min-h-[40vh] bg-slate-950 flex items-center justify-center px-8 py-20"
      aria-label="Closing thesis"
    >
      <div className="max-w-2xl text-center">
        <blockquote className="text-white text-3xl md:text-5xl font-serif font-bold leading-tight">
          <span style={{ color: "#7DD3FC" }}>The glacier was your reservoir.</span>
          <br />
          <span style={{ color: "#F87171" }}>We are draining it.</span>
        </blockquote>
        <p className="mt-6 text-white/40 text-sm">
          Hindu Kush Himalaya · 9% of all ice lost · 516 km³ · 1990–2020
        </p>
      </div>
    </section>
  );
}
