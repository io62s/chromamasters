interface LogoProps {
  className?: string;
  size?: "sm" | "md";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const height = size === "sm" ? 20 : 28;
  // Aspect ratio: bars (28 wide) + gap (8) + text (~160) = ~196 wide for md
  // Scale proportionally for sm
  const scale = height / 28;
  const width = Math.round(196 * scale);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 196 28"
      className={className}
      aria-label="ChromaMasters"
      role="img"
    >
      {/* Color bars */}
      <rect x="0" y="2" width="5" height="24" rx="2.5" fill="#f43f5e" />
      <rect x="7" y="2" width="5" height="24" rx="2.5" fill="#f59e0b" />
      <rect x="14" y="2" width="5" height="24" rx="2.5" fill="#10b981" />
      <rect x="21" y="2" width="5" height="24" rx="2.5" fill="#3b82f6" />

      {/* Text */}
      <text
        x="34"
        y="21"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="700"
        fontSize="20"
        letterSpacing="-0.02em"
        fill="currentColor"
      >
        ChromaMasters
      </text>
    </svg>
  );
}