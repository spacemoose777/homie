interface HomieLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export default function HomieLogo({
  size = 48,
  showWordmark = true,
  className = "",
}: HomieLogoProps) {
  const iconSize = size;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* House icon with heart */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="homie-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#FFD93D" />
          </linearGradient>
        </defs>
        {/* House silhouette */}
        <path
          d="M24 6L6 20v22h12V30h12v12h12V20L24 6z"
          fill="url(#homie-grad)"
        />
        {/* Heart inside house */}
        <path
          d="M24 26.5c0 0-5-3.5-5-6a2.5 2.5 0 015 0 2.5 2.5 0 015 0c0 2.5-5 6-5 6z"
          fill="white"
          opacity="0.9"
        />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <svg
          height={Math.round(iconSize * 0.6)}
          viewBox="0 0 120 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="homie-text-grad" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="100%" stopColor="#FFD93D" />
            </linearGradient>
          </defs>
          <text
            x="0"
            y="22"
            fontFamily="Inter, system-ui, sans-serif"
            fontSize="24"
            fontWeight="700"
            letterSpacing="-0.5"
            fill="url(#homie-text-grad)"
          >
            homie
          </text>
        </svg>
      )}
    </div>
  );
}
