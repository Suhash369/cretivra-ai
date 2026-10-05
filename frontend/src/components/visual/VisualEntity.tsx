import React from 'react';
import { User, MapPin, Cpu, Utensils, Landmark, Smartphone, Microscope, Image as ImageIcon } from 'lucide-react';

interface VisualEntityProps {
  entity: string;
  intent?: string;
  isComparison?: boolean;
}

export const VisualEntity: React.FC<VisualEntityProps> = ({ entity, intent, isComparison }) => {
  if (!entity) return null;

  const getIcon = () => {
    switch (intent) {
      case 'PHOTO':
        return <User className="w-3.5 h-3.5 text-indigo-400" />;
      case 'MAP':
      case 'LOCATION_IMAGE':
        return <MapPin className="w-3.5 h-3.5 text-emerald-400" />;
      case 'TECHNICAL_DIAGRAM':
      case 'DIAGRAM':
        return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
      case 'FOOD_IMAGE':
        return <Utensils className="w-3.5 h-3.5 text-amber-400" />;
      case 'ARCHITECTURE':
        return <Landmark className="w-3.5 h-3.5 text-purple-400" />;
      case 'PRODUCT_IMAGE':
        return <Smartphone className="w-3.5 h-3.5 text-rose-400" />;
      case 'MEDICAL_SCIENTIFIC_DIAGRAM':
        return <Microscope className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const formatIntentLabel = (rawIntent?: string) => {
    if (!rawIntent) return 'Visual Subject';
    return rawIntent.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900/80 border border-gray-800 text-[11px] text-gray-300 shadow-sm backdrop-blur-sm">
      {getIcon()}
      <span className="text-gray-400">{isComparison ? 'Comparison:' : formatIntentLabel(intent) + ':'}</span>
      <span className="font-semibold text-white truncate max-w-[200px]">{entity}</span>
    </div>
  );
};
