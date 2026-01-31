import virtualCardImage from "@/assets/virtual-card.png";
import metalCardImage from "@/assets/metal-card.png";

interface CardMiniatureProps {
  type: "virtual" | "metal";
  className?: string;
  showGlow?: boolean;
}

export const CardMiniature = ({ type, className = "", showGlow = false }: CardMiniatureProps) => {
  const cardImage = type === "virtual" ? virtualCardImage : metalCardImage;
  const altText = type === "virtual" ? "Virtual Card" : "Metal Card";
  
  const glowColor = type === "virtual" 
    ? "from-blue-500/40 via-purple-500/40 to-cyan-500/40" 
    : "from-amber-500/40 via-orange-500/40 to-yellow-500/40";

  return (
    <div 
      className={`relative w-full aspect-[1.586/1] ${className}`}
    >
      {/* Animated glow effect */}
      {showGlow && (
        <div 
          className={`absolute -inset-2 bg-gradient-to-r ${glowColor} rounded-3xl blur-xl opacity-75 animate-pulse`}
          style={{
            animation: "glow-pulse 3s ease-in-out infinite"
          }}
        />
      )}
      <img 
        src={cardImage} 
        alt={altText}
        className="absolute inset-0 w-full h-full object-contain relative z-10"
      />
    </div>
  );
};
