import React, { useState } from 'react';
import { X, Gamepad2, Sparkles, ArrowRight, Play, Trophy, Rocket, Shield } from 'lucide-react';

interface GameCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateWithAgent: (prompt: string) => void;
}

const GAME_GENRES = [
  {
    id: 'space-shooter',
    name: '2D Retro Space Shooter',
    icon: Rocket,
    difficulty: 'Action Arcade',
    description: 'Player starship with keyboard/arrow controls, continuous laser firing, asteroid waves, and scoring.',
    controls: 'Arrow keys / WASD to fly, Spacebar to shoot',
  },
  {
    id: 'snake',
    name: 'Neon Cyber Snake',
    icon: Trophy,
    difficulty: 'Classic Casual',
    description: 'Smooth grid-based snake with glowing neon tail, food power-ups, speed increases, and high score saver.',
    controls: 'Arrow keys or Swipe to change direction',
  },
  {
    id: 'brick-breaker',
    name: 'Arcade Brick Breaker',
    icon: Shield,
    difficulty: 'Physics Puzzle',
    description: 'Moving paddle, bouncing physics ball, multi-hit colored bricks, and collectible power-up drops.',
    controls: 'Mouse movement or A/D keys to steer paddle',
  },
  {
    id: 'flappy',
    name: 'Flappy Bird Adventure',
    icon: Play,
    difficulty: 'Precision Arcade',
    description: 'Physics gravity jumping, randomized pipe gap obstacles, coin pickups, and instant restart.',
    controls: 'Spacebar or Click/Tap to flap wings',
  },
];

export function GameCreatorModal({ isOpen, onClose, onGenerateWithAgent }: GameCreatorModalProps) {
  const [selectedGenre, setSelectedGenre] = useState('space-shooter');
  const [gameTitle, setGameTitle] = useState('');
  const [customMechanic, setCustomMechanic] = useState('');
  const [includeSoundEffects, setIncludeSoundEffects] = useState(true);
  const [includeHighScore, setIncludeHighScore] = useState(true);

  if (!isOpen) return null;

  const handleLaunch = () => {
    const genre = GAME_GENRES.find((g) => g.id === selectedGenre) || GAME_GENRES[0];
    const title = gameTitle.trim() || genre.name;
    const mechanics = customMechanic.trim() ? `Custom mechanics: ${customMechanic.trim()}.` : '';

    const prompt = `Build a complete, fully playable HTML5 Canvas web game titled "${title}".
Genre & Core Style: ${genre.name} (${genre.difficulty})
Gameplay Description: ${genre.description}
Controls: ${genre.controls}
${mechanics}
Technical Requirements:
- Single self-contained HTML file containing HTML5 <canvas>, modern CSS styling, and clean JavaScript game loop.
- Smooth 60 FPS requestAnimationFrame animation loop.
- Start Screen, live HUD (Score, Lives/Health), and Game Over restart screen.
- ${includeSoundEffects ? 'Synthesized web audio sound effects using the Web Audio API (AudioContext) for jumps/shoots/hits/game over without external audio files' : 'Visual feedback for actions'}
- ${includeHighScore ? 'Persistent High Score tracking stored in localStorage' : 'Active session score'}
- Polished visual particle effects (e.g. starfield, explosion particles, glow effects).
Provide the complete executable code ready to copy and play immediately in any browser.`;

    onGenerateWithAgent(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-gray-900 dark:text-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Gamepad2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold">Create Playable Games</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Generate 2D browser games with physics &amp; Web Audio</p>
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
              Custom Game Title (Optional)
            </label>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="e.g., AstroVoid 2099, Neon Serpent, Gravity Rush"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Genre Selection */}
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Select Game Genre
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GAME_GENRES.map((genre) => {
                const Icon = genre.icon;
                const isSelected = selectedGenre === genre.id;
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                        <Icon size={14} className={isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'} />
                        <span>{genre.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 font-medium">
                        {genre.difficulty}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {genre.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Mechanic */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Extra Rules or Boss Battles (Optional)
            </label>
            <textarea
              rows={2}
              value={customMechanic}
              onChange={(e) => setCustomMechanic(e.target.value)}
              placeholder="e.g., Add a giant alien mother ship boss every 500 points with multiple laser attacks"
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIncludeSoundEffects(!includeSoundEffects)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                includeSoundEffects
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                  : 'border-gray-200 dark:border-gray-800 text-gray-500'
              }`}
            >
              ✓ Web Audio Sound Effects
            </button>
            <button
              type="button"
              onClick={() => setIncludeHighScore(!includeHighScore)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                includeHighScore
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-300'
                  : 'border-gray-200 dark:border-gray-800 text-gray-500'
              }`}
            >
              ✓ Persistent High Score
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
            <span>Generate Playable Game</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
