import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Info,
  Maximize2,
  X,
  Sparkles
} from 'lucide-react';
import { ImageCard } from './ImageCard';
import { VisualSection } from './VisualSection';
import { VisualLoading } from './VisualLoading';
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
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showWhyReason, setShowWhyReason] = useState(false);

  // Collect all verified images into a unified array
  const allImages: VisualImage[] = useMemo(() => {
    if (!visualData) return [];
    if (visualData.gallery && visualData.gallery.length > 0) {
      return visualData.gallery;
    }
    const list: VisualImage[] = [];
    if (visualData.primary_image) list.push(visualData.primary_image);
    if (visualData.carousel) list.push(...visualData.carousel);
    return list;
  }, [visualData]);

  const activeLightboxImage = lightboxIndex !== null && allImages[lightboxIndex]
    ? allImages[lightboxIndex]
    : null;

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    if (e.key === 'Escape') {
      setLightboxIndex(null);
    } else if (e.key === 'ArrowRight') {
      setLightboxIndex((prev) => (prev !== null ? (prev + 1) % allImages.length : null));
    } else if (e.key === 'ArrowLeft') {
      setLightboxIndex((prev) => (prev !== null ? (prev - 1 + allImages.length) % allImages.length : null));
    }
  }, [lightboxIndex, allImages.length]);

  useEffect(() => {
    if (lightboxIndex !== null) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxIndex, handleKeyDown]);

  // Loading skeleton montage
  if (isLoading && (!visualData || !visualData.has_visuals || allImages.length === 0)) {
    return <VisualLoading label="Finding verified visuals..." />;
  }

  if (!visualData || !visualData.has_visuals || allImages.length === 0) {
    return null;
  }

  const { comparison, sections, total_images } = visualData;
  const displayTotal = total_images || allImages.length;

  return (
    <div className="w-full my-3 flex flex-col gap-3 animate-in fade-in duration-300">
      {/* 1. Side-by-Side Product Comparison (e.g., iPhone 16 vs Galaxy S25) */}
      {comparison && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-cyan-300 px-1">
              {comparison.product_a.entity}
            </span>
            <ImageCard
              image={comparison.product_a.image}
              onExpand={() => {
                const idx = allImages.findIndex((img) => img.id === comparison.product_a.image.id);
                setLightboxIndex(idx >= 0 ? idx : 0);
              }}
              priority
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-indigo-300 px-1">
              {comparison.product_b.entity}
            </span>
            <ImageCard
              image={comparison.product_b.image}
              onExpand={() => {
                const idx = allImages.findIndex((img) => img.id === comparison.product_b.image.id);
                setLightboxIndex(idx >= 0 ? idx : 1);
              }}
              priority
            />
          </div>
        </div>
      )}

      {/* 2. Hero Visual Montage / Collage Grid */}
      {!comparison && allImages.length >= 3 && (
        <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-slate-700/60 dark:border-gray-800 shadow-xl bg-gray-950/80">
          <div className="grid grid-cols-12 gap-1.5 h-[280px] sm:h-[320px] md:h-[340px] p-1.5">
            {/* Left Primary Hero Card (~58% width, full height) */}
            <div
              className="col-span-7 h-full relative rounded-xl overflow-hidden cursor-pointer group bg-gray-900 border border-white/5"
              onClick={() => setLightboxIndex(0)}
            >
              <img
                src={allImages[0].image_url}
                alt={allImages[0].title}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                <span className="text-xs text-white font-medium truncate drop-shadow">
                  {allImages[0].title}
                </span>
                {allImages[0].source_name && (
                  <span className="text-[10px] text-gray-300 drop-shadow">
                    {allImages[0].source_name}
                  </span>
                )}
              </div>
              <button
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                title="Expand"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Side: 2 Vertically Stacked Cards (~42% width) */}
            <div className="col-span-5 h-full flex flex-col gap-1.5">
              {/* Top Right Card */}
              <div
                className="flex-1 relative rounded-xl overflow-hidden cursor-pointer group bg-gray-900 border border-white/5"
                onClick={() => setLightboxIndex(1)}
              >
                <img
                  src={allImages[1].image_url}
                  alt={allImages[1].title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
                  <span className="text-[11px] text-white font-medium truncate drop-shadow">
                    {allImages[1].title}
                  </span>
                </div>
                <button
                  className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  title="Expand"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>

              {/* Bottom Right Card with Photo Count Badge */}
              <div
                className="flex-1 relative rounded-xl overflow-hidden cursor-pointer group bg-gray-900 border border-white/5"
                onClick={() => setLightboxIndex(2)}
              >
                <img
                  src={allImages[2].image_url}
                  alt={allImages[2].title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
                  <span className="text-[11px] text-white font-medium truncate drop-shadow">
                    {allImages[2].title}
                  </span>
                </div>

                {/* Corner Count Badge (📷 4) */}
                <div
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg group-hover:bg-black/90 transition-colors"
                  title={`View all ${displayTotal} photos`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(0);
                  }}
                >
                  <Camera className="w-3.5 h-3.5 text-white/90" />
                  <span>{displayTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 2-Image Split Montage */}
      {!comparison && allImages.length === 2 && (
        <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-slate-700/60 dark:border-gray-800 shadow-xl bg-gray-950/80">
          <div className="grid grid-cols-2 gap-1.5 h-[240px] sm:h-[280px] p-1.5">
            {allImages.slice(0, 2).map((img, i) => (
              <div
                key={img.id || i}
                className="relative h-full rounded-xl overflow-hidden cursor-pointer group bg-gray-900 border border-white/5"
                onClick={() => setLightboxIndex(i)}
              >
                <img
                  src={img.image_url}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                  <span className="text-xs text-white font-medium truncate drop-shadow">
                    {img.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Single Image Hero Card */}
      {!comparison && allImages.length === 1 && (
        <div className="max-w-xl">
          <ImageCard
            image={allImages[0]}
            onExpand={() => setLightboxIndex(0)}
            priority
          />
        </div>
      )}

      {/* 5. Contextual Section Images if present */}
      {!comparison && sections && sections.length > 0 && (
        <div className="flex flex-col gap-3 mt-1 max-w-2xl">
          {sections.map((sec, idx) => (
            <VisualSection
              key={idx}
              header={sec.header}
              image={sec.image}
              onExpand={() => {
                const imgIdx = allImages.findIndex((img) => img.id === sec.image.id);
                setLightboxIndex(imgIdx >= 0 ? imgIdx : 0);
              }}
            />
          ))}
        </div>
      )}

      {/* Lightbox High-Resolution Gallery Modal */}
      {activeLightboxImage && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            setLightboxIndex(null);
            setShowWhyReason(false);
          }}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] w-full flex flex-col bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <span className="text-xs font-semibold text-white truncate max-w-[280px] sm:max-w-md">
                  {activeLightboxImage.title}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  ({lightboxIndex + 1}/{allImages.length})
                </span>
                {activeLightboxImage.license && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-gray-800 text-[10px] text-gray-400 border border-gray-700 truncate max-w-[150px]">
                    {activeLightboxImage.license}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {activeLightboxImage.reason && (
                  <button
                    onClick={() => setShowWhyReason(!showWhyReason)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                      showWhyReason
                        ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                    }`}
                    title="Why this image?"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[11px]">Why this image?</span>
                  </button>
                )}

                <a
                  href={activeLightboxImage.image_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700"
                  title="Open original high-res image"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => {
                    setLightboxIndex(null);
                    setShowWhyReason(false);
                  }}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Why This Image Explanation Card */}
            {showWhyReason && activeLightboxImage.reason && (
              <div className="px-4 py-2.5 bg-cyan-950/60 border-b border-cyan-500/30 flex items-start gap-2 text-xs text-cyan-200 animate-in slide-in-from-top-2 duration-150">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{activeLightboxImage.reason}</p>
              </div>
            )}

            {/* Modal Image Display with Carousel Navigation */}
            <div className="relative w-full flex-1 min-h-[300px] max-h-[68vh] flex items-center justify-center p-2 sm:p-4 bg-black/60 overflow-hidden">
              <img
                src={activeLightboxImage.image_url}
                alt={activeLightboxImage.title}
                className="max-w-full max-h-[62vh] object-contain rounded-lg shadow-2xl transition-all duration-200"
              />

              {/* Prev Button */}
              {allImages.length > 1 && (
                <button
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null ? (prev - 1 + allImages.length) % allImages.length : 0
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 transition-all shadow-lg"
                  title="Previous photo (Left arrow)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next Button */}
              {allImages.length > 1 && (
                <button
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null ? (prev + 1) % allImages.length : 0
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 transition-all shadow-lg"
                  title="Next photo (Right arrow)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Footer / Source Attribution */}
            <div className="w-full px-4 py-3 bg-gray-900/90 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400">
              <p className="truncate max-w-lg text-slate-300">
                {activeLightboxImage.caption || activeLightboxImage.title}
              </p>
              {activeLightboxImage.source_url && (
                <a
                  href={activeLightboxImage.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline shrink-0"
                >
                  <span>Verified Source: {activeLightboxImage.source_name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
