import React from 'react';

interface ConcertArtFallbackProps {
  category: string;
  title: string;
  artist: string;
  accentColor?: string;
  className?: string;
  aspectRatio?: '4:3' | '16:9' | 'banner';
}

export const ConcertArtFallback: React.FC<ConcertArtFallbackProps> = ({
  category,
  title,
  artist,
  accentColor = '#10b981',
  className = '',
  aspectRatio = '4:3',
}) => {
  const aspectClass =
    aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === 'banner' ? 'h-56 sm:h-72 w-full' : 'aspect-[4/3]';

  return (
    <div
      className={`relative overflow-hidden bg-neutral-900 flex flex-col justify-between p-6 select-none ${aspectClass} ${className}`}
    >
      {/* Background architectural light rays and abstract wave lines */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
          <defs>
            <radialGradient id={`glow-${title}`} cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`grad-beam-${title}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Ambient center spotlight */}
          <rect width="400" height="300" fill={`url(#glow-${title})`} />

          {/* Stage beam geometries */}
          <polygon points="200,0 70,300 330,300" fill={`url(#grad-beam-${title})`} />
          <polygon points="120,0 20,300 220,300" fill={accentColor} opacity="0.08" />
          <polygon points="280,0 180,300 380,300" fill={accentColor} opacity="0.08" />

          {/* Sound waves curves */}
          <path
            d="M 0,220 Q 100,160 200,220 T 400,220"
            fill="none"
            stroke={accentColor}
            strokeWidth="1.2"
            opacity="0.35"
          />
          <path
            d="M 0,240 Q 100,190 200,240 T 400,240"
            fill="none"
            stroke="white"
            strokeWidth="0.8"
            opacity="0.2"
          />
          <circle cx="200" cy="90" r="42" fill="none" stroke={accentColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        </svg>
      </div>

      {/* Atmospheric dark gradient scrim to guarantee text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

      {/* Top Tagline */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-neutral-400 font-mono">
          2026 TOUR LIVE
        </span>
        <span
          className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium tracking-wide border border-neutral-700/60 bg-neutral-900/80"
          style={{ color: accentColor }}
        >
          {category}
        </span>
      </div>

      {/* Center/Bottom Title & Artist typography */}
      <div className="relative z-10 mt-auto">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white line-clamp-2 font-display">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-neutral-300 mt-1 line-clamp-1 font-medium">
          {artist}
        </p>
      </div>
    </div>
  );
};
