"use client"; // Error boundaries must be client components.

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Something went wrong loading this world.</h1>
      <p className="text-sm text-muted">If you are running locally, check the database is up: npm run db:up</p>
      <button
        type="button"
        onClick={retry}
        className="rounded-md border border-accent px-4 py-2 text-sm text-accent hover:bg-accent/10"
      >
        Try again
      </button>
    </main>
  );
}
