import Link from "next/link";

const navItems = [
  { label: "Explore", href: "/", available: true },
  { label: "Locations", href: "/locations", available: false },
  { label: "Discoveries", href: "/discoveries", available: false },
  { label: "AI Lab", href: "/ai-lab", available: false },
] as const;

// Server component: the page tells us which item is active, so no client JS is shipped.
// Switch to usePathname() + "use client" once the sidebar moves into a shared layout.
export function Sidebar({ activeHref }: { activeHref: string }) {
  return (
    <nav aria-label="Primary" className="border-b border-border p-2 lg:border-r lg:border-b-0 lg:py-4">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {navItems.map((item) => {
          const isActive = item.href === activeHref;

          return (
            <li key={item.href} className="shrink-0">
              {item.available ? (
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-10 items-center rounded-md px-3 text-sm transition-colors ${
                    isActive
                      ? "bg-accent/10 font-medium text-accent"
                      : "text-foreground hover:bg-surface"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="flex min-h-10 items-center gap-2 px-3 text-sm text-muted">
                  {item.label}
                  <span className="rounded border border-border px-1.5 text-[10px] uppercase tracking-wider">
                    Soon
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
