import type { Verification } from "@/generated/prisma/enums";
import type { LocationSummary } from "@/features/locations/repository";

const verificationLabel: Record<Verification, string> = {
  official: "Officially confirmed",
  community: "Community — unverified",
  sample: "Sample data — fictional",
};

// `children` (the Ask AI panel) render above the details, in the same column.
export function DetailPanel({ location, children }: { location: LocationSummary | null; children?: React.ReactNode }) {
  return (
    <aside
      aria-label="Ask AI and location details"
      className="flex flex-col gap-5 border-t border-border bg-surface/60 p-5 lg:overflow-y-auto lg:border-t-0 lg:border-l"
    >
      {children}
      <div aria-live="polite">
        {location ? (
          <>
            <p className="text-xs uppercase tracking-widest text-muted">{location.category}</p>
            <h2 className="mt-1 text-2xl font-semibold">{location.name}</h2>
            <p className="mt-3 inline-block rounded-full border border-highlight/50 px-2.5 py-0.5 text-xs text-highlight">
              {verificationLabel[location.verification]}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{location.summary}</p>
            {location.sourceUrl && (
              <a
                href={location.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-xs text-accent underline underline-offset-2"
              >
                Source<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Select a location on the map to see its details.</p>
        )}
      </div>
    </aside>
  );
}
