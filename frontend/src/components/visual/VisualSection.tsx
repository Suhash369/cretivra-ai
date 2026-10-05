import React from 'react';
import { ImageCard } from './ImageCard';
import type { VisualImage } from '../../types';

interface VisualSectionProps {
  header: string;
  image: VisualImage;
  onExpand?: (image: VisualImage) => void;
}

export const VisualSection: React.FC<VisualSectionProps> = ({
  header,
  image,
  onExpand,
}) => {
  return (
    <div className="my-4 pt-2">
      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-800/80">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <h3 className="text-xs font-semibold text-gray-200 tracking-wide">
          Visual: {header.replace(/^#{1,3}\s*/, '')}
        </h3>
      </div>
      <ImageCard image={image} onExpand={onExpand} />
    </div>
  );
};
