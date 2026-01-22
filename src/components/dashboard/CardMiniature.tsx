interface CardMiniatureProps {
  type: "virtual" | "metal";
  className?: string;
}

export const CardMiniature = ({ type, className = "" }: CardMiniatureProps) => {
  if (type === "virtual") {
    return (
      <div 
        className={`relative w-full aspect-[1.7/1] rounded-2xl overflow-hidden ${className}`}
        style={{
          background: 'linear-gradient(135deg, #d4f94e 0%, #a8e030 50%, #8bc926 100%)',
          boxShadow: '0 8px 32px -8px rgba(168, 224, 48, 0.5), 0 4px 16px -4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Subtle mesh gradient overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)',
          }}
        />
        
        {/* Card content */}
        <div className="relative h-full p-4 flex flex-col justify-between">
          {/* Top row - Card name */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-black/70 tracking-wide">VIRTUAL</span>
          </div>
          
          {/* Center logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
              <svg width="16" height="12" viewBox="0 0 60 40" fill="none">
                <path d="M30 5L45 20L30 35L15 20L30 5Z" fill="rgba(0,0,0,0.3)" />
                <path d="M30 12L38 20L30 28L22 20L30 12Z" fill="rgba(200,245,66,0.8)" />
              </svg>
            </div>
          </div>
          
          {/* Bottom row - Visa branding */}
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-4 rounded bg-black/10" />
              <div className="w-4 h-4 rounded-full bg-black/10" />
            </div>
            <span className="text-base font-bold text-[#1a1f71] italic tracking-tight">VISA</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full aspect-[1.7/1] rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(145deg, #3a3a3a 0%, #1f1f1f 50%, #0a0a0a 100%)',
        boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.6), 0 4px 16px -4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Metal shine overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.08) 45%, transparent 60%)',
        }}
      />
      
      {/* Subtle texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />
      
      {/* Card content */}
      <div className="relative h-full p-4 flex flex-col justify-between">
        {/* Top row - Card name */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 tracking-wide">METAL</span>
        </div>
        
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <svg width="16" height="12" viewBox="0 0 60 40" fill="none">
              <path d="M30 5L45 20L30 35L15 20L30 5Z" fill="rgba(255,255,255,0.2)" />
              <path d="M30 12L38 20L30 28L22 20L30 12Z" fill="rgba(255,255,255,0.1)" />
            </svg>
          </div>
        </div>
        
        {/* Bottom row - Visa branding */}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-4 rounded bg-white/10" />
            <div className="w-4 h-4 rounded-full bg-white/10" />
          </div>
          <span className="text-base font-bold text-white/70 italic tracking-tight">VISA</span>
        </div>
      </div>
    </div>
  );
};
