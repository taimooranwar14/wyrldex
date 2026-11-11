import { brand } from "@/lib/brand";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          {brand.experience}
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
          {brand.name}
        </h1>
        <p className="text-lg text-muted">{brand.tagline}</p>
      </main>
      <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        {brand.disclaimer}
      </footer>
    </div>
  );
}
