interface CretivraMarkProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function CretivraMark({ size = 28, className = '', animated = true }: CretivraMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={`${animated ? 'cv-logo-pulse' : ''} ${className}`}
    >
      <path
        d="M12 24c0-6.6 5.4-12 12-12s12 5.4 12 12-5.4 12-12 12-12-5.4-12-12z"
        stroke="url(#cv-grad)"
        strokeWidth="2.2"
        opacity="0.55"
      />
      <path
        d="M6 24c4-6 9-9 12-9s5 3 6 3 3-3 6-3 8 3 12 9c-4 6-9 9-12 9s-3-3-6-3-3 3-6 3-8-3-12-9z"
        stroke="url(#cv-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="24" r="2.4" fill="#06b6d4" className={animated ? "cv-node cv-node-1" : ""} />
      <circle cx="24" cy="24" r="2.4" fill="#8b5cf6" className={animated ? "cv-node cv-node-2" : ""} />
      <circle cx="36" cy="24" r="2.4" fill="#06b6d4" className={animated ? "cv-node cv-node-3" : ""} />
      <defs>
        <linearGradient id="cv-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export const CretivraLogo = CretivraMark;
