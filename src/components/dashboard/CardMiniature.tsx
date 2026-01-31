import virtualCardImage from "@/assets/virtual-card.png";
import metalCardImage from "@/assets/metal-card.png";

interface CardMiniatureProps {
  type: "virtual" | "metal";
  className?: string;
}

export const CardMiniature = ({ type, className = "" }: CardMiniatureProps) => {
  const cardImage = type === "virtual" ? virtualCardImage : metalCardImage;
  const altText = type === "virtual" ? "Virtual Card" : "Metal Card";

  return (
    <div 
      className={`relative w-full aspect-[1.586/1] ${className}`}
    >
      <img 
        src={cardImage} 
        alt={altText}
        className="absolute inset-0 w-full h-full object-fill rounded-2xl"
      />
    </div>
  );
};
