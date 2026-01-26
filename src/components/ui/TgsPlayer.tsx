import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import pako from 'pako';

interface TgsPlayerProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

const TgsPlayer = ({ src, className = '', loop = true, autoplay = true }: TgsPlayerProps) => {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTgs = async () => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        
        // TGS files are gzipped Lottie JSON
        const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
        const json = JSON.parse(decompressed);
        
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
};

export default TgsPlayer;
