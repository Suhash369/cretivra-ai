import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, RotateCcw, Check, PenTool } from 'lucide-react';

interface SketchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachSketch: (file: File) => void;
}

const COLORS = [
  '#ffffff', // White
  '#38bdf8', // Sky / Cyan
  '#a855f7', // Purple
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#000000', // Black
];

export const SketchModal: React.FC<SketchModalProps> = ({ isOpen, onClose, onAttachSketch }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize with dark slate background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? '#0f172a' : color;
    ctx.lineWidth = isEraser ? 24 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `sketch_${Date.now()}.png`, { type: 'image/png' });
        onAttachSketch(file);
        onClose();
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-gray-900/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
              <PenTool size={16} />
            </div>
            <h3 className="text-sm font-bold text-white">Sketch & Draw</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-800 bg-gray-900/40">
          <div className="flex items-center gap-2">
            {/* Pen vs Eraser */}
            <button
              type="button"
              onClick={() => setIsEraser(false)}
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                !isEraser
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300 shadow-sm'
                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <PenTool size={13} />
              <span>Pen</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEraser(true)}
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isEraser
                  ? 'bg-rose-950/60 border-rose-600 text-rose-300 shadow-sm'
                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Eraser size={13} />
              <span>Eraser</span>
            </button>

            {/* Colors */}
            {!isEraser && (
              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-800">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      color === c ? 'scale-125 border-white ring-2 ring-emerald-500/50' : 'border-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700/60 text-xs flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex justify-center p-4 bg-slate-950/60">
          <canvas
            ref={canvasRef}
            width={600}
            height={380}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="rounded-2xl border border-gray-800 shadow-inner cursor-crosshair touch-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800 bg-gray-900/60">
          <p className="text-xs text-gray-400">Sketch anything and attach it to your message</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white shadow-lg hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Attach Sketch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
