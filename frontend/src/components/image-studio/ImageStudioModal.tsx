import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Download,
  Maximize2,
  RefreshCw,
  Copy,
  Check,
  Wand2,
  Sliders,
  Image as ImageIcon,
  Layers,
  Ratio,
  Palette,
} from 'lucide-react';
import { generateImageApi, enhancePromptApi } from '../../services/api';
import type { AspectRatio } from '../../types';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (imageUrl: string, prompt: string) => void;
  initialPrompt?: string;
}

const ASPECT_RATIOS: Array<{ id: AspectRatio; label: string; iconRatio: string; desc: string }> = [
  { id: '1:1', label: '1:1 Square', iconRatio: 'w-4 h-4', desc: 'Instagram / Avatar (1024x1024)' },
  { id: '16:9', label: '16:9 Wide', iconRatio: 'w-5 h-3', desc: 'Desktop / YouTube (1280x720)' },
  { id: '9:16', label: '9:16 Story', iconRatio: 'w-3 h-5', desc: 'Reels / Mobile (720x1280)' },
  { id: '4:3', label: '4:3 Standard', iconRatio: 'w-4 h-3.5', desc: 'Classic Photo (1024x768)' },
  { id: '21:9', label: '21:9 Cinema', iconRatio: 'w-6 h-2.5', desc: 'Cinematic Ultrawide (1344x576)' },
];

const STYLES = [
  { id: 'photorealistic', label: 'Photorealistic', icon: '📸', desc: '8K UHD realistic photography' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌆', desc: 'Futuristic neon & volumetric light' },
  { id: 'anime', label: 'Anime Studio', icon: '🌸', desc: 'Masterpiece Makoto Shinkai style' },
  { id: '3d', label: '3D Octane', icon: '🧊', desc: 'Unreal Engine 5 raytraced CGI' },
  { id: 'cinematic', label: 'Cinematic', icon: '🎬', desc: 'Dramatic lighting & film atmosphere' },
  { id: 'fantasy', label: 'High Fantasy', icon: '✨', desc: 'Ethereal magical digital painting' },
  { id: 'minimalist', label: 'Minimalist', icon: '📐', desc: 'Clean lines & modern composition' },
  { id: 'digital-art', label: 'Digital Art', icon: '🎨', desc: 'ArtStation trending concept art' },
];

const MODELS = [
  { id: 'cretivra-flux', label: 'Cretivra FLUX.1 Art', engine: 'flux', badge: 'FLUX.1 Pro' },
  { id: 'cretivra-diffusion', label: 'Cretivra SDXL Studio', engine: 'flux-realism', badge: 'SDXL Realism' },
  { id: 'cretivra-anime', label: 'Cretivra Anime Studio', engine: 'flux-anime', badge: 'Anime Studio' },
  { id: 'cretivra-3d', label: 'Cretivra 3D & CGI', engine: 'flux-3d', badge: '3D Octane' },
  { id: 'cretivra-turbo', label: 'Cretivra Turbo Visuals', engine: 'turbo', badge: 'Ultra Fast' },
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  initialPrompt = '',
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedModel, setSelectedModel] = useState('cretivra-flux');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>('photorealistic');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<Array<{ url: string; prompt: string; model: string; date: string }>>(() => {
    try {
      const saved = localStorage.getItem('cretivra_image_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    try {
      localStorage.setItem('cretivra_image_gallery', JSON.stringify(gallery.slice(0, 30)));
    } catch (e) {
      console.error('Failed to save image gallery to localStorage', e);
    }
  }, [gallery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenImage) {
          setFullscreenImage(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, isOpen, onClose]);

  if (!isOpen) return null;

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setErrorMessage(null);
    try {
      const data = await enhancePromptApi(prompt, selectedStyle, selectedModel);
      if (data?.enhanced_prompt) {
        setPrompt(data.enhanced_prompt);
      }
    } catch (err) {
      console.error('Enhance prompt failed:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const result = await generateImageApi({
        prompt: prompt.trim(),
        aspect_ratio: selectedRatio,
        model: selectedModel,
        style: selectedStyle,
        enhance: true,
        negative_prompt: negativePrompt.trim() || undefined,
      });

      if (result && result.image_url) {
        setCurrentImage(result.image_url);
        setGallery((prev) => [
          {
            url: result.image_url,
            prompt: result.prompt,
            model: result.model || selectedModel,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.filter((item) => item.url !== result.image_url),
        ]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Visual generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async (url: string, imgPrompt: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanName = (imgPrompt || 'cretivra-art').slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `${cleanName}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-[#0a0f1d] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-lg">
              <Palette size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Cretivra AI Image Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/60 font-mono">
                  100% Free • FLUX.1 & SDXL
                </span>
              </h2>
              <p className="text-xs text-gray-400">Generate high-definition visuals with professional styles and aspect ratios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Banner if any */}
        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 px-6 py-2.5 flex items-center justify-between text-xs text-rose-300">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Studio Body (Two-Column Layout) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* Controls Column (Left) */}
          <div className="lg:col-span-6 p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-gray-800/80">
            {/* Prompt Input Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-purple-400" /> Image Prompt
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || isEnhancing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700/50 text-purple-300 font-medium transition-all disabled:opacity-40 cursor-pointer"
                  title="Enrich prompt with high-detail aesthetic keywords"
                >
                  <Wand2 size={12} className={isEnhancing ? 'animate-spin' : ''} />
                  <span>{isEnhancing ? 'Enhancing...' : 'Magic Enhance'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A futuristic cyberpunk city with neon reflections, flying vehicles, highly detailed 8k..."
                className="w-full p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 focus:border-purple-500/50 text-gray-100 placeholder-gray-500 text-sm focus:outline-none resize-none transition-all shadow-inner leading-relaxed"
              />
            </div>

            {/* Model Engine Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Layers size={13} className="text-cyan-400" /> AI Generation Engine
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedModel === m.id
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-md'
                        : 'bg-gray-900/50 hover:bg-gray-850 border-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{m.label.replace('Cretivra ', '')}</div>
                    <span className="text-[10px] text-purple-400/90 font-mono">{m.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Ratio size={13} className="text-cyan-400" /> Aspect Ratio
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRatio(r.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      selectedRatio === r.id
                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md'
                        : 'bg-gray-900/50 hover:bg-gray-850 border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                    title={r.desc}
                  >
                    <div className={`border-2 rounded border-current ${r.iconRatio}`} />
                    <span className="text-[11px] font-semibold">{r.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Palette size={13} className="text-purple-400" /> Aesthetic Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStyle(s.id)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      selectedStyle === s.id
                        ? 'bg-purple-950/60 border-purple-500 text-white'
                        : 'bg-gray-900/50 hover:bg-gray-850 border-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="text-sm">{s.icon}</div>
                    <div className="text-xs font-semibold mt-0.5 truncate">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Sliders size={12} />
                <span>{showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings (Negative Prompt)'}</span>
              </button>
              {showAdvanced && (
                <div className="mt-2 p-3 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2">
                  <label className="text-xs text-gray-400">Negative Prompt (elements to avoid)</label>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="e.g. blurry, low quality, distorted hands, watermark"
                    className="w-full p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              )}
            </div>

            {/* Primary Generate Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Synthesizing Image with FLUX.1...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Visual</span>
                </>
              )}
            </button>
          </div>

          {/* Preview & Gallery Column (Right) */}
          <div className="lg:col-span-6 p-6 flex flex-col space-y-4 bg-gray-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Canvas & Preview</span>
              {currentImage && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/60 font-mono">
                  {selectedRatio} • {selectedModel.replace('cretivra-', '').toUpperCase()}
                </span>
              )}
            </div>

            {/* Main Active Canvas */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-900/80 border border-gray-800 flex items-center justify-center group shadow-2xl">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center animate-pulse">
                  <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-700/50 text-purple-400 animate-bounce">
                    <ImageIcon size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-purple-200">Synthesizing High-Res Visual...</p>
                    <p className="text-xs text-gray-400 font-mono">Applying {selectedStyle} aesthetics</p>
                  </div>
                </div>
              ) : currentImage ? (
                <>
                  <img
                    src={currentImage}
                    alt={prompt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02] cursor-pointer"
                    onClick={() => setFullscreenImage(currentImage)}
                  />
                  {/* Floating Action Bar */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-gray-700/80">
                    <button
                      onClick={() => setFullscreenImage(currentImage)}
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                      title="Fullscreen Zoom"
                    >
                      <Maximize2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDownloadImage(currentImage, prompt)}
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-cyan-400 transition-colors"
                      title="Download HD Image"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(currentImage);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                      title="Copy Image Link"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  {/* Bottom Insert to Chat Banner */}
                  {onInsertToChat && (
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between p-2.5 rounded-xl bg-black/75 backdrop-blur-md border border-purple-500/40">
                      <span className="text-xs text-purple-200 font-medium truncate max-w-[200px]">{prompt}</span>
                      <button
                        onClick={() => {
                          onInsertToChat(currentImage, prompt);
                          onClose();
                        }}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
                      >
                        Insert into Chat
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-gray-500">
                  <ImageIcon size={36} className="text-gray-600" />
                  <p className="text-xs font-medium">Enter a prompt and click Generate Visual</p>
                </div>
              )}
            </div>

            {/* Gallery of Recent Generations */}
            {gallery.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
                  <span>Recent Generations ({gallery.length})</span>
                  <button
                    onClick={() => setGallery([])}
                    className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors"
                  >
                    Clear History
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                  {gallery.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentImage(item.url);
                        setPrompt(item.prompt);
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer group transition-all ${
                        currentImage === item.url
                          ? 'border-purple-500 ring-2 ring-purple-500/30'
                          : 'border-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                        <span className="text-[9px] text-white line-clamp-2 text-center font-medium leading-tight">
                          {item.prompt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-5xl max-h-[92vh] rounded-2xl overflow-hidden border border-purple-500/40 bg-gray-950 p-2 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 mb-2">
              <span className="text-xs text-gray-200 truncate max-w-md font-medium">{prompt}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadImage(fullscreenImage, prompt)}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs text-gray-200 flex items-center gap-1.5"
                >
                  <Download size={14} className="text-cyan-400" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setFullscreenImage(null)}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            <img src={fullscreenImage} alt={prompt} className="max-h-[82vh] w-auto rounded-xl object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};
