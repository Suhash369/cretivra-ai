import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageCard } from './ImageCard';
import type { VisualImage } from '../../types';

interface ImageCarouselProps {
  images: VisualImage[];
  onExpand?: (image: VisualImage) => void;
  title?: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  onExpand,
  title = 'Visual Exploration',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const total = images.length;
  const currentImage = images[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex flex-col gap-2.5 my-3">
      {/* Header with Title and < 1 / 3 > Navigation */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-gray-300 tracking-wide">
          {title} ({total})
        </span>

        {total > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-mono">
              {currentIndex + 1} / {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700/50"
                title="Previous visual"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700/50"
                title="Next visual"
                aria-label="Next image"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Carousel Card */}
      <div className="relative">
        <ImageCard
          image={currentImage}
          onExpand={onExpand}
          priority
        />
      </div>

      {/* Dot Indicators */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === currentIndex
                  ? 'w-6 bg-cyan-400'
                  : 'w-1.5 bg-gray-700 hover:bg-gray-500'
              }`}
              aria-label={`Jump to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
