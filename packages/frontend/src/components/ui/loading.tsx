'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-[1.5px]',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-2',
  };

  return (
    <div
      className={`
        ${sizeStyles[size]}
        rounded-full
        border-zinc-700
        border-t-accent-400
        animate-spin
        ${className}
      `}
    />
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className = '' }: LoadingDotsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function LoadingSkeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
}: LoadingSkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        ${variantStyles[variant]}
        bg-zinc-800/50
        animate-pulse
        ${className}
      `}
      style={style}
    />
  );
}

interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-10 h-10 rounded-full border-2 border-zinc-800" />
        {/* Spinning accent */}
        <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-accent-400 animate-spin" />
        {/* Inner glow */}
        <div className="absolute inset-2 w-6 h-6 rounded-full bg-accent-400/5" />
      </div>
      {text && (
        <p className="text-[13px] text-zinc-500 animate-pulse">{text}</p>
      )}
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-white/[0.04] bg-zinc-900/30 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/50" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-zinc-800/50" />
              <div className="h-3 w-1/4 rounded bg-zinc-800/30" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface KanbanSkeletonProps {
  columns?: number;
  cardsPerColumn?: number;
}

export function KanbanSkeleton({ columns = 4, cardsPerColumn = 3 }: KanbanSkeletonProps) {
  return (
    <div className="flex gap-3">
      {Array.from({ length: columns }).map((_, colIndex) => (
        <div
          key={colIndex}
          className="flex flex-col flex-shrink-0 w-72 rounded-xl bg-zinc-900/30"
          style={{ animationDelay: `${colIndex * 50}ms` }}
        >
          {/* Column header skeleton */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.04]">
            <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse" />
            <div className="h-4 w-20 rounded bg-zinc-800/50 animate-pulse" />
            <div className="ml-auto h-4 w-6 rounded bg-zinc-800/30 animate-pulse" />
          </div>
          
          {/* Cards skeleton */}
          <div className="p-2 space-y-1.5">
            {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.04] animate-pulse"
                style={{ animationDelay: `${(colIndex * cardsPerColumn + cardIndex) * 30}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-3 w-8 rounded bg-zinc-800/50" />
                  <div className="h-4 w-12 rounded bg-zinc-800/30" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-4 w-full rounded bg-zinc-800/50" />
                  <div className="h-4 w-2/3 rounded bg-zinc-800/40" />
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.03]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-800/50" />
                    <div className="h-3 w-16 rounded bg-zinc-800/30" />
                  </div>
                  <div className="h-3 w-10 rounded bg-zinc-800/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

