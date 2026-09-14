/**
 * What stands in while a page's data is read.
 *
 * Bars in the shape of the page that is coming — a heading, a rule, a few
 * lines — so the layout does not jump when the real thing arrives. No spinner
 * and no pulse on the whole screen: the account pages read from the database in
 * a single pass and are usually here before this is.
 *
 * The animation is a slow fade rather than the usual shimmer, and it is
 * disabled outright for anyone who has asked for less motion — the global rule
 * in globals.css takes care of that.
 */
export default function AccountLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Loading</span>

      <div className="pb-12">
        <div className="h-2 w-20 bg-charcoal/10" />
        <div className="mt-6 h-9 w-2/3 max-w-sm bg-charcoal/10" />
        <div className="mt-3 h-9 w-1/2 max-w-xs bg-charcoal/[0.07]" />
        <div className="mt-7 h-3 w-full max-w-md bg-charcoal/[0.06]" />
      </div>

      <div className="border-t border-charcoal/10 pt-8">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-center justify-between gap-8 border-b border-charcoal/[0.06] py-5">
            <div className="h-3 w-1/3 max-w-[14rem] bg-charcoal/[0.07]" />
            <div className="h-3 w-16 bg-charcoal/[0.05]" />
          </div>
        ))}
      </div>
    </div>
  );
}
