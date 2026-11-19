import { CategoryIcon } from "@/components/category-icon";
import type { Verification } from "@/generated/prisma/enums";
import type { CharacterSummary } from "@/features/graph/repository";
import type { LocationSummary } from "@/features/locations/repository";

const verification: Record<Verification, { label: string; text: string; border: string }> = {
  official: { label: "Officially confirmed", text: "text-accent", border: "border-accent/50" },
  community: { label: "Community — unverified", text: "text-highlight", border: "border-highlight/50" },
  sample: { label: "Sample data — fictional", text: "text-muted", border: "border-border" },
};

type DetailPanelProps = {
  location: LocationSummary | null;
  character?: CharacterSummary | null;
  placeName?: (slug: string) => string;
  children?: React.ReactNode; // the Ask AI panel, rendered above the details in the same column
};

export function DetailPanel({ location, character = null, placeName = (slug) => slug, children }: DetailPanelProps) {
  return (
    <aside
      aria-label="Ask AI and location details"
      className="flex flex-col gap-5 border-t border-border bg-surface/60 p-5 backdrop-blur-md lg:overflow-y-auto lg:border-t-0 lg:border-l"
    >
      {children}
      <div aria-live="polite">
        {character ? (
          <article className="rounded-2xl border border-border bg-gradient-to-b from-highlight/10 to-transparent p-4">
            <p className="text-xs uppercase tracking-widest text-highlight">Character</p>
            <h2 className="mt-2 text-2xl font-semibold">{character.name}</h2>
            <p className="mt-3 text-sm leading-relaxed">{character.summary}</p>
            <StatusAndSource verification={character.verification} sourceUrl={character.sourceUrl} />
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted">Connected places</h3>
            <ul className="mt-2 space-y-2">
              {character.connections.map((link) => (
                <li key={link.location.slug} className="rounded-lg border border-border p-2.5 text-xs">
                  <p className="font-medium text-foreground">{placeName(link.location.slug)}</p>
                  <p className="mt-0.5 text-muted">{link.note}</p>
                  <p className={`mt-1 ${verification[link.verification].text}`}>
                    {verification[link.verification].label}
                    {link.sourceUrl && (
                      <>
                        {" · "}
                        <a href={link.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                          {hostname(link.sourceUrl)}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ) : location ? (
          <article className="rounded-2xl border border-border bg-gradient-to-b from-violet/10 to-transparent p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent">
              <CategoryIcon category={location.category} />
              {location.category}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{location.name}</h2>
            <p className="mt-1 text-sm text-muted">{location.region ? `${location.region}, Leonida` : "Leonida"}</p>
            <p className="mt-3 text-sm leading-relaxed">{location.summary}</p>

            <StatusAndSource verification={location.verification} sourceUrl={location.sourceUrl} />
          </article>
        ) : (
          <p className="text-sm text-muted">Select a place, region or character to see its details.</p>
        )}
      </div>
    </aside>
  );
}

const hostname = (url: string) => new URL(url).hostname.replace(/^www\./, "");

function StatusAndSource({ verification: status, sourceUrl }: { verification: Verification; sourceUrl: string | null }) {
  return (
    <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs">
      <dt className="text-muted">Status</dt>
      <dd>
        <span className={`inline-block rounded-full border px-2.5 py-0.5 ${verification[status].text} ${verification[status].border}`}>
          {verification[status].label}
        </span>
      </dd>
      {sourceUrl && (
        <>
          <dt className="text-muted">Source</dt>
          <dd>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
              {hostname(sourceUrl)}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </dd>
        </>
      )}
    </dl>
  );
}
