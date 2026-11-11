import type { Location, Verification } from "@/features/locations/sample-data";

const verificationLabel: Record<Verification, string> = {
  official: "Officially confirmed",
  community: "Community — unverified",
  sample: "Sample data — fictional",
};

export function DetailPanel({ location }: { location: Location }) {
  return (
    <aside
      aria-label="Location details"
      className="border-t border-border bg-surface/60 p-5 lg:overflow-y-auto lg:border-t-0 lg:border-l"
    >
      <p className="text-xs uppercase tracking-widest text-muted">{location.category}</p>
      <h2 className="mt-1 text-2xl font-semibold">{location.name}</h2>
      <p className="mt-3 inline-block rounded-full border border-highlight/50 px-2.5 py-0.5 text-xs text-highlight">
        {verificationLabel[location.verification]}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">{location.summary}</p>
    </aside>
  );
}
