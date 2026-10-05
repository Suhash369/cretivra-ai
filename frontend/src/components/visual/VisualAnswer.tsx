import React, { useState } from 'react';
import { Sparkles, X, ExternalLink, Download } from 'lucide-react';
import { ImageCard } from './ImageCard';
import { ImageCarousel } from './ImageCarousel';
import { VisualEntity } from './VisualEntity';
import { VisualSection } from './VisualSection';
import { VisualLoading } from './VisualLoading';
import { VisualSearchButton } from './VisualSearchButton';
import type { VisualAnswerData, VisualImage } from '../../types';

interface VisualAnswerProps {
  visualData?: VisualAnswerData | null;
  isLoading?: boolean;
  query?: string;
  onRefreshVisuals?: (query: string) => Promise<void>;
}

export const VisualAnswer: React.FC<VisualAnswerProps> = ({
  visualData,
  isLoading = false,
  query = '',
  onRefreshVisuals,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [activeLightbox, setActiveLightbox] = useState<VisualImage | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // If loading and no visuals yet
  if (isLoading && (!visualData || !visualData.has_visuals)) {
    return <VisualLoading label="Finding relevant visuals..." />;
  }

  if (!visualData || !visualData.has_visuals) {
    return null;
  }

  const {
    intent,
    primary_image,
    sections,
    carousel,
    comparison,
  } = visualData;

  const handleRefresh = async () => {
    if (!onRefreshVisuals || !query || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshVisuals(query);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="my-3 flex flex-col gap-3">
      {/* Header bar: ASURA Visual Intelligence Badge & Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-[11px] font-semibold text-cyan-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Visual Intelligence</span>
          </div>

          {primary_image?.entity && (
            <VisualEntity
              entity={primary_image.entity}
              intent={intent}
              isComparison={Boolean(comparison)}
            />
          )}
        </div>

        <VisualSearchButton
          isVisible={isVisible}
          onToggleVisibility={setIsVisible}
          onRefreshVisuals={onRefreshVisuals ? handleRefresh : undefined}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Main Visual Content (Collapsible) */}
      {isVisible && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-200">
          {/* 1. Side-by-Side Product Comparison Layout */}
          {comparison && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-cyan-300 px-1">
                  {comparison.product_a.entity}
                </span>
                <ImageCard
                  image={comparison.product_a.image}
                  onExpand={setActiveLightbox}
                  priority
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-indigo-300 px-1">
                  {comparison.product_b.entity}
                </span>
                <ImageCard
                  image={comparison.product_b.image}
                  onExpand={setActiveLightbox}
                  priority
                />
              </div>
            </div>
          )}

          {/* 2. Primary Hero Image */}
          {!comparison && primary_image && (
            <div className="max-w-xl">
              <ImageCard
                image={primary_image}
                onExpand={setActiveLightbox}
                priority
              />
            </div>
          )}

          {/* 3. Contextual Section Images */}
          {sections && sections.length > 0 && (
            <div className="flex flex-col gap-3">
              {sections.map((sec, idx) => (
                <VisualSection
                  key={idx}
                  header={sec.header}
                  image={sec.image}
                  onExpand={setActiveLightbox}
                />
              ))}
            </div>
          )}

          {/* 4. Exploration Carousel */}
          {carousel && carousel.length > 0 && (
            <div className="max-w-xl">
              <ImageCarousel
                images={carousel}
                onExpand={setActiveLightbox}
                title="Related Visual Documentation"
              />
            </div>
          )}
        </div>
      )}

      {/* Lightbox High-Resolution Modal */}
      {activeLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950/80">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <span className="text-xs font-semibold text-white truncate">
                  {activeLightbox.title}
                </span>
                {activeLightbox.license && (
                  <span className="px-1.5 py-0.5 rounded bg-gray-800 text-[10px] text-gray-400 border border-gray-700">
                    {activeLightbox.license}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activeLightbox.image_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  title="Open original high-res image"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  onClick={() => setActiveLightbox(null)}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  title="Close visual modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image */}
            <div className="w-full flex-1 max-h-[70vh] flex items-center justify-center p-4 bg-black/40 overflow-hidden">
              <img
                src={activeLightbox.image_url}
                alt={activeLightbox.title}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Modal Footer / Source */}
            <div className="w-full px-4 py-3 bg-gray-950/90 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400">
              <p className="truncate max-w-md">{activeLightbox.caption || activeLightbox.title}</p>
              {activeLightbox.source_url && (
                <a
                  href={activeLightbox.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:underline shrink-0"
                >
                  <span>Source: {activeLightbox.source_name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
