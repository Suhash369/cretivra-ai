'use client';

import React, { useState } from 'react';
import { ExternalLink, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import type { AsuraImageItem } from '../../types';
import { getImageProxyUrl } from '../../services/api';

interface ImageCardProps {
  image: AsuraImageItem;
  onOpenModal: (img: AsuraImageItem) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onOpenModal }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;

  const displaySrc = image.thumbnail || image.url;
  const safeSrc = getImageProxyUrl(displaySrc) || displaySrc;
  const domain = image.source_domain || (image.source_url ? (() => {
    try {
      return new URL(image.source_url).hostname.replace(/^www\./, '');
    } catch {
      return 'web';
    }
  })() : 'web');

  return (
    <div className="group relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-slate-900/40 backdrop-blur-xs flex flex-col transition-all duration-200 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/20">
      <div
        className="relative aspect-4/3 w-full overflow-hidden bg-slate-950 cursor-pointer"
        onClick={() => onOpenModal(image)}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 animate-pulse text-slate-500">
            <ImageIcon className="w-5 h-5 text-slate-600 animate-pulse" />
          </div>
        )}
        <img
          src={safeSrc}
          alt={image.title || 'Image from Asura web search'}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
          <button
            type="button"
            className="ml-auto p-1.5 rounded-lg bg-black/60 text-white hover:bg-cyan-500 hover:text-black transition-colors"
            title="View Full Size"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(image);
            }}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-2.5 flex flex-col gap-1 bg-slate-900/80 border-t border-slate-800/60">
        <p className="text-[11px] font-medium text-slate-200 line-clamp-1 group-hover:text-cyan-400 transition-colors">
          {image.title || 'Web Image'}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate max-w-[120px] font-mono text-slate-400">{domain}</span>
          {image.source_url && (
            <a
              href={image.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 transition-colors"
              title="Visit source page"
            >
              <span>Source</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export const ImageGallery: React.FC<{ images?: AsuraImageItem[] }> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<AsuraImageItem | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const validImages = images.filter((img) => img && (img.url || img.thumbnail));
  if (validImages.length === 0) return null;

  return (
    <div className="my-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-cyan-500/10 dark:bg-cyan-400/15 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
          <ImageIcon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Asura Web Images
        </span>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-100/90 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300/60 dark:border-cyan-700/60">
          {validImages.length} {validImages.length === 1 ? 'image' : 'images'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {validImages.map((img, idx) => (
          <ImageCard
            key={`${img.url}-${idx}`}
            image={img}
            onOpenModal={(selected) => setSelectedImage(selected)}
          />
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-3 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-2">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                  {selectedImage.title || 'Image Preview'}
                </span>
                {selectedImage.attribution && (
                  <span className="text-[10px] text-slate-400">{selectedImage.attribution}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedImage.source_url && (
                  <a
                    href={selectedImage.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-400 flex items-center gap-1.5"
                  >
                    <span>View Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close image modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-xl bg-black">
              <img
                src={getImageProxyUrl(selectedImage.url) || selectedImage.url}
                alt={selectedImage.title || 'Asura Preview'}
                className="max-h-[75vh] w-auto max-w-full object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
