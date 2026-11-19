// Original line icons (24×24, stroked), one per location category.
const paths: Record<string, string> = {
  Region: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  District: "M3 21V10l6-3v14M9 21V4l8 3v14M17 21v-8l4 2v6M2 21h20",
  Beach: "M12 21v-9M12 12C11 8 7 7 4 8c3 0 6 1 8 4zm0 0c1-4 5-5 8-4-3 0-6 1-8 4zm0 0c0-4-2-7-5-8 2 2 4.5 4 5 8zM5 21h14",
  Hotel: "M3 19V6M3 15h18v4M21 15v-2a3 3 0 0 0-3-3h-7v5M7 12.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  Nightlife: "M5 4h14l-7 8zM12 12v8M8 20h8",
  Transport: "M12 8v13M8 11h8M5 15a7 7 0 0 0 14 0M12 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  Shop: "M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2",
  Landmark: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.3l-5.4 3.1 1.3-6L3.4 9.3l6-.7z",
};

export function CategoryIcon({ category, className = "size-4" }: { category: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[category] ?? paths.Landmark} />
    </svg>
  );
}
