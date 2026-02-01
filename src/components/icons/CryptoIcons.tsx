/**
 * Crypto network icons as SVG components
 */

import { cn } from "@/lib/utils";

interface CryptoIconProps {
  className?: string;
  size?: number;
}

// Tron (TRC20)
export const TronIcon = ({ className, size = 20 }: CryptoIconProps) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
    <circle cx="16" cy="16" r="16" fill="#FF0013" />
    <path
      fill="#fff"
      d="M21.932 9.913L7.5 7.257l7.595 19.112 10.583-12.894-3.746-3.562zm-.232 1.17l2.208 2.099-6.038 1.093 3.83-3.192zm-5.142 2.973l-6.863-4.986 10.457 1.911-3.594 3.075zm-.453.96l-.453 8.832-5.592-14.06 6.045 5.228zm.96.067l6.083-1.101-7.636 9.307.051-.103 1.502-8.103z"
    />
  </svg>
);

// Ethereum (ERC20)
export const EthereumIcon = ({ className, size = 20 }: CryptoIconProps) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
    <circle cx="16" cy="16" r="16" fill="#627EEA" />
    <g fill="#fff">
      <path fillOpacity=".6" d="M16.498 4v8.87l7.497 3.35z" />
      <path d="M16.498 4L9 16.22l7.498-3.35z" />
      <path fillOpacity=".6" d="M16.498 21.968v6.027L24 17.616z" />
      <path d="M16.498 27.995v-6.028L9 17.616z" />
      <path fillOpacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.348z" />
      <path fillOpacity=".6" d="M9 16.22l7.498 4.353v-7.701z" />
    </g>
  </svg>
);

// Binance Smart Chain (BEP20)
export const BscIcon = ({ className, size = 20 }: CryptoIconProps) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
    <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
    <path
      fill="#fff"
      d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.259L16 26l-6.144-6.144-.003-.003 2.263-2.257zM21.48 16l2.26-2.26L26 16l-2.26 2.26L21.48 16zm-3.188-.002h.002V16L16 18.294l-2.291-2.29-.004-.004.004-.003.401-.402.195-.195L16 13.706l2.293 2.293z"
    />
  </svg>
);

// Polygon
export const PolygonIcon = ({ className, size = 20 }: CryptoIconProps) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
    <circle cx="16" cy="16" r="16" fill="#8247E5" />
    <path
      fill="#fff"
      d="M21.092 13.057c-.389-.226-.87-.226-1.295 0l-3.016 1.774-2.044 1.162-3.016 1.774c-.389.226-.87.226-1.296 0l-2.37-1.388a1.297 1.297 0 01-.648-1.099v-2.712c0-.45.259-.87.648-1.098l2.37-1.324c.389-.227.869-.227 1.295 0l2.37 1.324c.39.227.649.648.649 1.098v1.774l2.044-1.194v-1.806a1.297 1.297 0 00-.648-1.098l-4.382-2.55a1.341 1.341 0 00-1.296 0l-4.447 2.582a1.297 1.297 0 00-.648 1.098v5.132c0 .45.26.87.648 1.098l4.414 2.55c.389.227.87.227 1.296 0l3.016-1.742 2.044-1.194 3.016-1.742c.389-.226.87-.226 1.295 0l2.37 1.324c.39.227.649.648.649 1.098v2.713c0 .45-.26.87-.649 1.098l-2.37 1.356c-.388.227-.869.227-1.295 0l-2.37-1.324a1.297 1.297 0 01-.648-1.098v-1.742l-2.044 1.194v1.774c0 .45.26.87.648 1.098l4.414 2.55c.389.226.87.226 1.296 0l4.414-2.55a1.297 1.297 0 00.648-1.098v-5.164c0-.45-.26-.87-.648-1.098l-4.447-2.518z"
    />
  </svg>
);

// Solana
export const SolanaIcon = ({ className, size = 20 }: CryptoIconProps) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
    <defs>
      <linearGradient id="solana-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00FFA3" />
        <stop offset="100%" stopColor="#DC1FFF" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill="url(#solana-grad)" />
    <path
      fill="#fff"
      d="M9.925 19.687a.61.61 0 01.432-.179h12.915a.305.305 0 01.216.521l-2.594 2.594a.61.61 0 01-.432.179H7.547a.305.305 0 01-.216-.521l2.594-2.594zm0-10.51a.628.628 0 01.432-.179h12.915a.305.305 0 01.216.521l-2.594 2.594a.61.61 0 01-.432.179H7.547a.305.305 0 01-.216-.521l2.594-2.594zm13.347 5.146a.61.61 0 00-.432-.179H9.925a.305.305 0 00-.216.521l2.594 2.594a.61.61 0 00.432.179h12.915a.305.305 0 00.216-.521l-2.594-2.594z"
    />
  </svg>
);

// Bitcoin
export const BitcoinIcon = ({ className, size = 20 }: CryptoIconProps) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <path
      fill="#fff"
      d="M22.156 14.244c.307-2.05-1.256-3.152-3.392-3.888l.693-2.78-1.693-.422-.675 2.706c-.445-.111-.902-.216-1.356-.32l.68-2.724-1.692-.422-.694 2.779a95.663 95.663 0 01-1.08-.255l.002-.009-2.334-.583-.45 1.808s1.256.288 1.23.306c.686.171.81.624.79 .984l-.791 3.174c.047.012.108.029.175.056l-.178-.044-1.11 4.45c-.084.208-.297.52-.777.402.017.024-1.23-.307-1.23-.307l-.84 1.94 2.202.548c.41.103.811.21 1.207.311l-.7 2.813 1.69.422.694-2.783c.462.125.91.241 1.348.35l-.691 2.768 1.693.422.7-2.807c2.885.546 5.054.326 5.966-2.284.735-2.102-.037-3.314-1.555-4.105 1.106-.256 1.938-.984 2.161-2.488zm-3.869 5.427c-.522 2.1-4.056.965-5.202.68l.928-3.723c1.147.286 4.818.853 4.274 3.043zm.523-5.456c-.477 1.91-3.417.939-4.372.701l.842-3.377c.955.238 4.024.683 3.53 2.676z"
    />
  </svg>
);

// Litecoin
export const LitecoinIcon = ({ className, size = 20 }: CryptoIconProps) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
    <circle cx="16" cy="16" r="16" fill="#345D9D" />
    <path
      fill="#fff"
      d="M10.428 19.036l1.004-3.942-1.78.645.372-1.46 1.78-.644 1.968-7.726h4.848l-1.476 5.795 1.744-.632-.372 1.46-1.744.632-.612 2.405 1.744-.632-.372 1.46-1.744.632-.996 3.908h8.592l-.532 2.099H9.448l1.08-4.24 1.744-.632.372-1.46-2.216.332z"
    />
  </svg>
);

// TON
export const TonIcon = ({ className, size = 20 }: CryptoIconProps) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
    <circle cx="16" cy="16" r="16" fill="#0098EA" />
    <path
      fill="#fff"
      d="M16 6.5L7.5 13.5L16 25.5L24.5 13.5L16 6.5ZM15.2 14.8L10.5 12.9L15.2 9.3V14.8ZM16.8 14.8V9.3L21.5 12.9L16.8 14.8ZM15.2 16.4V21.8L11.2 14.5L15.2 16.4ZM16.8 16.4L20.8 14.5L16.8 21.8V16.4Z"
    />
  </svg>
);

// USDT icon
export const UsdtIcon = ({ className, size = 20 }: CryptoIconProps) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className}>
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path
      fill="#fff"
      d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"
    />
  </svg>
);

// Generic crypto icon with network initial
export const GenericCryptoIcon = ({ 
  className, 
  size = 20, 
  label, 
  color 
}: CryptoIconProps & { label: string; color: string }) => (
  <div 
    className={cn("rounded-full flex items-center justify-center font-bold text-white", className)}
    style={{ 
      width: size, 
      height: size, 
      backgroundColor: color,
      fontSize: size * 0.4
    }}
  >
    {label.charAt(0).toUpperCase()}
  </div>
);

// Get icon component by network value
export const getCryptoIcon = (network: string, size = 20) => {
  switch (network.toLowerCase()) {
    case 'trc20':
      return <TronIcon size={size} />;
    case 'erc20':
      return <EthereumIcon size={size} />;
    case 'bep20':
      return <BscIcon size={size} />;
    case 'polygon':
      return <PolygonIcon size={size} />;
    case 'solana':
      return <SolanaIcon size={size} />;
    case 'btc':
    case 'bitcoin':
      return <BitcoinIcon size={size} />;
    case 'ltc':
    case 'litecoin':
      return <LitecoinIcon size={size} />;
    case 'ton':
      return <TonIcon size={size} />;
    case 'usdt':
      return <UsdtIcon size={size} />;
    default:
      return <BitcoinIcon size={size} />;
  }
};
