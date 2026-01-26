import { useEffect, useState, memo } from 'react';
import Lottie from 'lottie-react';
import pako from 'pako';

// Cache for loaded animations
const animationCache = new Map<string, object>();

// Preload function to load animation in background
export const preloadTgs = async (src: string): Promise<void> => {
  if (animationCache.has(src)) return;
  
  try {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
    const json = JSON.parse(decompressed);
    animationCache.set(src, json);
  } catch (err) {
    console.error('Failed to preload TGS:', err);
  }
};

interface TgsPlayerProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

const TgsPlayer = memo(({ src, className = '', loop = true, autoplay = true }: TgsPlayerProps) => {
  const [animationData, setAnimationData] = useState<object | null>(() => {
    // Check cache first for instant load
    return animationCache.get(src) || null;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already cached, no need to fetch
    if (animationCache.has(src)) {
      setAnimationData(animationCache.get(src)!);
      return;
    }

    const loadTgs = async () => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        
        // TGS files are gzipped Lottie JSON
        const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
        const json = JSON.parse(decompressed);
        
        // Cache for future use
        animationCache.set(src, json);
        setAnimationData(json);
      } catch (err) {
        console.error('Failed to load TGS:', err);
        setError('Failed to load animation');
      }
    };

    loadTgs();
  }, [src]);

  if (error) {
    return <div className={className}>💰</div>;
  }

  if (!animationData) {
    return <div className={className} />;
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
    />
  );
});

TgsPlayer.displayName = 'TgsPlayer';

export default TgsPlayer;
