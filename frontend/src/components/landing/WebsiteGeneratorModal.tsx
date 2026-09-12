import React, { useState } from 'react';
import { X, Globe, Sparkles, ArrowRight, Code, Layout, Palette, Smartphone } from 'lucide-react';

interface WebsiteGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateWithAgent: (prompt: string) => void;
}

const PRESET_TEMPLATES = [
  {
    id: 'saas-landing',
    name: 'SaaS Startup Landing Page',
    icon: Layout,
    description: 'Hero with animated badge, feature grid with hover effects, pricing table, and testimonials.',
    recommendedTech: 'HTML5 + Tailwind CSS + Lucide Icons',
  },
  {
    id: 'portfolio',
    name: 'Developer / Designer Portfolio',
    icon: Palette,
    description: 'Clean minimalist dark mode showcase with project gallery, skills tags, and contact modal.',
    recommendedTech: 'HTML5 + CSS Glassmorphism + Responsive Grid',
  },
  {
    id: 'dashboard',
    name: 'AI Analytics & Data Dashboard',
    icon: Code,
    description: 'Sidebar navigation, KPI statistics cards, interactive chart placeholders, and table.',
    recommendedTech: 'HTML5 + Modern Flex/Grid Layout + Chart UI',
  },
  {
    id: 'ecommerce',
    name: 'Product Showcase & Storefront',
    icon: Smartphone,
    description: 'High-converting product landing with image carousel, variant selector, specs & checkout button.',
    recommendedTech: 'HTML5 + CSS Animations + Mobile-first UX',
  },
];

export function WebsiteGeneratorModal({ isOpen, onClose, onGenerateWithAgent }: WebsiteGeneratorModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('saas-landing');
  const [brandName, setBrandName] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [includeResponsive, setIncludeResponsive] = useState(true);
  const [includeDarkMode, setIncludeDarkMode] = useState(true);
  const [includeInteractiveJs, setIncludeInteractiveJs] = useState(true);

  if (!isOpen) return null;

  const handleLaunch = () => {
    const template = PRESET_TEMPLATES.find((t) => t.id === selectedTemplate) || PRESET_TEMPLATES[0];
    const brand = brandName.trim() || 'NextGen Tech';
    const specificInstructions = customGoal.trim() ? `Specific requirements: ${customGoal.trim()}.` : '';

    const prompt = `Build a complete, production-ready, beautiful single-page website for "${brand}".
Type: ${template.name}
Details: ${template.description}
${specificInstructions}
Features required:
- ${includeResponsive ? 'Fully responsive mobile-friendly layout (Tailwind CSS)' : 'Clean desktop layout'}
- ${includeDarkMode ? 'Sleek dark mode aesthetic with harmonious color accents' : 'Crisp light mode aesthetic'}
- ${includeInteractiveJs ? 'Interactive JavaScript micro-interactions, modal/drawer controls, and smooth scrolling' : 'Clean semantic structure'}
- Semantic HTML5 structure with modern typography (Inter/Outfit) and zero broken placeholders.
Provide complete, ready-to-run single-file HTML/CSS/JS code with inline styles and interactive script.`;

    onGenerateWithAgent(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-gray-900 dark:text-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold">Build Website with AI</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Generate full responsive websites, prototypes &amp; code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Brand / Project Name
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g., Nexus AI, Studio Drift, Lumina Coffee"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Template Selection */}
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Website Template Style
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-950 dark:text-blue-200'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={14} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
                      <span className="font-semibold text-xs truncate">{tmpl.name}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Details */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Specific Sections or Features (Optional)
            </label>
            <textarea
              rows={2}
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="e.g., Include an interactive ROI calculator, email signup modal, and FAQ accordion"
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Feature Toggles */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIncludeResponsive(!includeResponsive)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                includeResponsive
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-800 text-gray-500'
              }`}
            >
              ✓ Responsive Mobile
            </button>
            <button
              type="button"
              onClick={() => setIncludeDarkMode(!includeDarkMode)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                includeDarkMode
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-800 text-gray-500'
              }`}
            >
              ✓ Modern Dark Theme
            </button>
            <button
              type="button"
              onClick={() => setIncludeInteractiveJs(!includeInteractiveJs)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                includeInteractiveJs
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                  : 'border-gray-200 dark:border-gray-800 text-gray-500'
              }`}
            >
              ✓ Interactive JS Actions
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Generate Website Code</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
