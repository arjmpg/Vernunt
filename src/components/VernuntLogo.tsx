import React from 'react';
import vernuntLogoImg from '../assets/images/vernunt_logo_1786894730028.jpg';

interface VernuntLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  variant?: 'full' | 'icon' | 'badge';
  onClick?: () => void;
}

export default function VernuntLogo({
  className = '',
  size = 'md',
  showText = true,
  animated = true,
  variant = 'full',
  onClick
}: VernuntLogoProps) {
  // Dimensions for high-res logo representation
  const dimensions = {
    xs: { imgHeight: 'h-8 sm:h-9', imgWidth: 'w-auto max-w-[120px]', textClass: 'text-sm' },
    sm: { imgHeight: 'h-12 sm:h-14', imgWidth: 'w-auto max-w-[170px]', textClass: 'text-base font-black' },
    md: { imgHeight: 'h-20 sm:h-24', imgWidth: 'w-auto max-w-[240px]', textClass: 'text-xl font-black' },
    lg: { imgHeight: 'h-28 sm:h-36', imgWidth: 'w-auto max-w-[320px]', textClass: 'text-3xl font-black' },
    xl: { imgHeight: 'h-40 sm:h-52', imgWidth: 'w-auto max-w-[440px]', textClass: 'text-4xl md:text-5xl font-black' }
  };

  const { imgHeight, imgWidth } = dimensions[size] || dimensions.md;

  return (
    <div 
      className={`inline-flex flex-col items-center justify-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`} 
      id="vernunt-logo-block"
      onClick={onClick}
    >
      <div className="relative group">
        <img
          src={vernuntLogoImg}
          alt="Vernunt Logo"
          referrerPolicy="no-referrer"
          className={`object-contain transition-transform duration-300 ${imgHeight} ${imgWidth} ${
            animated ? 'hover:scale-105 active:scale-95' : ''
          }`}
          onError={(e) => {
            // Fallback to public folder path if bundled asset load hits an edge case
            const target = e.currentTarget;
            if (target.src !== '/vernunt-logo.png') {
              target.src = '/vernunt-logo.png';
            }
          }}
        />
      </div>
    </div>
  );
}
