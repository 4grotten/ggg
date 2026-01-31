import virtualCardImage from "@/assets/virtual-card.png";

interface CardMiniatureProps {
  type: "virtual" | "metal";
  className?: string;
}

export const CardMiniature = ({ type, className = "" }: CardMiniatureProps) => {
  if (type === "virtual") {
    return (
      <div 
        className={`relative w-full aspect-[1.586/1] ${className}`}
      >
        <img 
          src={virtualCardImage} 
          alt="Virtual Card"
          className="absolute inset-0 w-full h-full object-fill rounded-2xl"
        />
      </div>
    );
  }

  return (
    <div 
        className={`relative w-full aspect-[1.7/1] rounded-2xl overflow-hidden ${className}`}
        style={{
          background: 'linear-gradient(145deg, #3a3a3a 0%, #1f1f1f 50%, #0a0a0a 100%)',
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
