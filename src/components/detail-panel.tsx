import { CategoryIcon } from "@/components/category-icon";
import type { Verification } from "@/generated/prisma/enums";
import type { LocationSummary } from "@/features/locations/repository";

const verification: Record<Verification, { label: string; className: string }> = {
  official: { label: "Officially confirmed", className: "border-accent/50 text-accent" },
  community: { label: "Community — unverified", className: "border-highlight/50 text-highlight" },
  sample: { label: "Sample data — fictional", className: "border-border text-muted" },
};

// `children` (the Ask AI panel) render above the details, in the same column.
export function DetailPanel({ location, children }: { location: LocationSummary | null; children?: React.ReactNode }) {
  return (
    <aside
      aria-label="Ask AI and location details"
      className="flex flex-col gap-5 border-t border-border bg-surface/60 p-5 backdrop-blur-md lg:overflow-y-auto lg:border-t-0 lg:border-l"
    >
      {children}
      <div aria-live="polite">
        {location ? (
          <article className="rounded-2xl border border-border bg-gradient-to-b from-violet/10 to-transparent p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent">
              <CategoryIcon category={location.category} />
              {location.category}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{location.name}</h2>
            <p className="mt-1 text-sm text-muted">{location.region ? `${location.region}, Leonida` : "Leonida"}</p>
            <p className="mt-3 text-sm leading-relaxed">{location.summary}</p>

            <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs">
              <dt className="text-muted">Status</dt>
              <dd>
                <span className={`inline-block rounded-full border px-2.5 py-0.5 ${verification[location.verification].className}`}>
                  {verification[location.verification].label}
                </span>
              </dd>
              {location.sourceUrl && (
                <>
                  <dt className="text-muted">Source</dt>
                  <dd>
                    <a
                      href={location.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline underline-offset-2"
                    >
                      {new URL(location.sourceUrl).hostname.replace(/^www\./, "")}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </article>
        ) : (
          <p className="text-sm text-muted">Select a place or region on the map to see its details.</p>
        )}
      </div>
    </aside>
  );
}
