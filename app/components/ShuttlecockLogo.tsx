// Shuttlecock icon — works at any size as an SVG
export function ShuttlecockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Feather fan — filled sector from the junction point */}
      <path
        d="M10 13 L2 3.5 Q10 -1.5 18 3.5 Z"
        fill="currentColor"
      />
      {/* Stem */}
      <rect x="9" y="12" width="2" height="6" rx="1" fill="currentColor" />
      {/* Cork */}
      <ellipse cx="10" cy="20.5" rx="3" ry="2" fill="currentColor" />
    </svg>
  );
}

// Full logo mark — icon + wordmark — used in Navbar and anywhere else needed
export default function ShuttleSpotLogo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Icon badge */}
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <ShuttlecockIcon className="h-[18px] w-[18px]" />
      </div>
      {/* Wordmark */}
      <span className="text-[15px] font-bold tracking-tight">
        Shuttle<span className="text-primary">Spot</span>
      </span>
    </div>
  );
}
