import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { CarouselBanner } from '../types';

interface BannerCarouselProps {
  banners: CarouselBanner[];
  onCtaClick?: (link: string) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, onCtaClick }) => {
  const activeBanners = banners.filter((b) => b.isActive).sort((a, b) => a.order - b.order);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
      <div className="relative overflow-hidden rounded-xl sm:rounded-3xl shadow-xl shadow-indigo-900/10 border border-slate-200/80 dark:border-slate-800 bg-slate-900 text-white">
        
        {/* Banner Image Container with responsive ratio */}
        <div className="relative w-full h-[220px] sm:h-[320px] md:h-[380px] lg:h-[440px]">
          
          {/* Mobile Image (Visible < sm) */}
          <img
            src={currentBanner.imageUrlMobile || currentBanner.imageUrlDesktop}
            alt={currentBanner.title}
            className="block sm:hidden w-full h-full object-cover opacity-60 transition-all duration-500"
          />

          {/* Tablet Image (Visible sm to lg) */}
          <img
            src={currentBanner.imageUrlTablet || currentBanner.imageUrlDesktop}
            alt={currentBanner.title}
            className="hidden sm:block lg:hidden w-full h-full object-cover opacity-60 transition-all duration-500"
          />

          {/* Desktop Image (Visible >= lg) */}
          <img
            src={currentBanner.imageUrlDesktop}
            alt={currentBanner.title}
            className="hidden lg:block w-full h-full object-cover opacity-60 transition-all duration-500"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent flex flex-col justify-end p-4 sm:p-10 lg:p-12">
            
            {currentBanner.badge && (
              <span className="inline-block self-start px-2.5 py-0.5 text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest bg-indigo-500 text-white rounded-full mb-1.5 shadow-sm">
                {currentBanner.badge}
              </span>
            )}

            <h2 className="text-lg sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1 sm:mb-2 max-w-2xl leading-snug line-clamp-1 sm:line-clamp-2">
              {currentBanner.title}
            </h2>

            <p className="text-[11px] sm:text-base text-slate-200 mb-3 sm:mb-5 max-w-xl line-clamp-1 sm:line-clamp-2">
              {currentBanner.subtitle}
            </p>

            <div>
              <button
                onClick={() => onCtaClick && onCtaClick(currentBanner.ctaLink)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-6 sm:py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95"
              >
                <span>{currentBanner.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Carousel Controls */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/50 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/50 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-3 right-6 flex items-center gap-1.5 z-10">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-6 bg-indigo-500' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
};
