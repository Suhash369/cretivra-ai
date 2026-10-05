import React, { useState } from 'react';
import { Maximize2, ImageOff, RefreshCw } from 'lucide-react';
import { VisualSource } from './VisualSource';
import { VisualReason } from './VisualReason';
import type { VisualImage } from '../../types';

interface ImageCardProps {
  image: VisualImage;
  onExpand?: (image: VisualImage) => void;
  onChangeImage?: () => void;
  hasAlternative?: boolean;
  priority?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onExpand,
  onChangeImage,
  hasAlternative = false,
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Use proxied or direct URL
  const displayUrl = image.thumbnail_url || image.image_url;

  return (
    <div className="group relative flex flex-col rounded-2xl bg-gray-900/60 border border-gray-800/80 hover:border-cyan-500/40 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-cyan-950/20 backdrop-blur-sm">
      {/* Image Container */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-gray-950/80 overflow-hidden flex items-center justify-center">
        {/* Loading skeleton */}
        {!isLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800/60 to-gray-900 animate-pulse" />
        )}

        {/* Fallback if remote image 404s */}
        {imageError ? (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-gray-500">
            <ImageOff className="w-8 h-8 text-gray-600" />
            <p className="text-xs">Visual preview unavailable</p>
            {image.source_url && (
              <a
                href={image.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 hover:underline"
              >
                View on original site
              </a>
            )}
          </div>
        ) : (
          <img
            src={displayUrl}
            alt={image.title || 'Visual documentation'}
            loading={priority ? 'eager' : 'lazy'}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              // If thumbnail failed, attempt fallback to full image_url once
              if (displayUrl !== image.image_url) {
                // switch to full url
                setImageError(true);
              } else {
                setImageError(true);
              }
            }}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02] ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Floating action overlay buttons */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {hasAlternative && onChangeImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChangeImage();
              }}
              className="p-1.5 rounded-lg bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/50 shadow-md backdrop-blur-md transition-colors"
              title="Change to alternative image"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {onExpand && !imageError && (
            <button
              onClick={() => onExpand(image)}
              className="p-1.5 rounded-lg bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/50 shadow-md backdrop-blur-md transition-colors"
              title="Open full resolution view"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Caption & Metadata Section */}
      <div className="p-3 sm:p-3.5 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-xs sm:text-[13px] text-gray-100 truncate" title={image.title}>
              {image.title}
            </h4>
            {image.caption && image.caption !== image.title && (
              <p className="text-[11.5px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                {image.caption}
              </p>
            )}
          </div>
          {image.reason && (
            <div className="shrink-0 pt-0.5">
              <VisualReason reason={image.reason} entity={image.entity} />
            </div>
          )}
        </div>

        {/* Source Attribution */}
        <div className="pt-2 border-t border-gray-800/80">
          <VisualSource
            sourceName={image.source_name}
            sourceUrl={image.source_url}
            license={image.license}
            artist={image.artist}
          />
        </div>
      </div>
    </div>
  );
};
