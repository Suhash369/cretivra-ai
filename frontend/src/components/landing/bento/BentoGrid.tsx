import React, { useState, useRef } from 'react';
import { BentoCard, type BentoChip } from './BentoCard';
import { BuildIllustration } from './illustrations/BuildIllustration';
import { CreateIllustration } from './illustrations/CreateIllustration';
import { GameIllustration } from './illustrations/GameIllustration';
import { FileIllustration } from './illustrations/FileIllustration';

interface BentoGridProps {
  onSelectPrompt: (prompt: string) => void;
  onUploadFile: (file: File) => void;
  onOpenWebsite?: () => void;
  onOpenSlides?: () => void;
  onOpenGame?: () => void;
  onOpenImageStudio?: () => void;
  triggerComposerPulse?: () => void;
}

export function BentoGrid({
  onSelectPrompt,
  onUploadFile,
  onOpenWebsite,
  onOpenSlides,
  onOpenGame,
  onOpenImageStudio,
  triggerComposerPulse,
}: BentoGridProps) {
  const [isDraggingOverFile, setIsDraggingOverFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChipClick = (prompt: string, actionCallback?: () => void) => {
    onSelectPrompt(prompt);
    if (triggerComposerPulse) triggerComposerPulse();
    if (actionCallback) {
      setTimeout(() => actionCallback(), 100);
    }
  };

  // Card 1: Build Chips
  const buildChips: BentoChip[] = [
    {
      label: 'Website',
      onClick: () => handleChipClick('Build a modern responsive landing website with interactive hero and features.', onOpenWebsite),
    },
    {
      label: 'Web app',
      onClick: () => handleChipClick('Build a full-stack web application with responsive UI and mock state.', onOpenWebsite),
    },
    {
      label: 'Dashboard / CRM',
      onClick: () => handleChipClick('Build a comprehensive SaaS analytics and customer CRM dashboard with charts.', onOpenWebsite),
    },
    {
      label: 'E-commerce',
      onClick: () => handleChipClick('Build a modern e-commerce storefront with product grid and shopping cart.', onOpenWebsite),
    },
    {
      label: 'Portfolio',
      onClick: () => handleChipClick('Build a sleek personal developer & designer portfolio with case studies.', onOpenWebsite),
    },
  ];

  // Card 2: Create Chips
  const createChips: BentoChip[] = [
    {
      label: 'Slides (.pptx)',
      onClick: () => handleChipClick('Create a 10-slide executive pitch deck presentation with financial metrics.', onOpenSlides),
    },
    {
      label: 'PDF report',
      onClick: () => handleChipClick('Generate a comprehensive technical PDF audit report on autonomous AI architecture.'),
    },
    {
      label: 'Document',
      onClick: () => handleChipClick('Synthesize a detailed whitepaper document on AI workflows and security.'),
    },
    {
      label: 'Image',
      onClick: () => {
        if (onOpenImageStudio) onOpenImageStudio();
        else handleChipClick('Create a photorealistic visual concept with FLUX.1 Art');
      },
    },
  ];

  // Card 3: Game Chips
  const gameChips: BentoChip[] = [
    {
      label: 'Arcade',
      onClick: () => handleChipClick('Build a playable retro arcade space shooter game in HTML5 canvas with particle effects.', onOpenGame),
    },
    {
      label: 'Puzzle',
      onClick: () => handleChipClick('Build an interactive grid-based tile puzzle game with score progression in HTML5.', onOpenGame),
    },
    {
      label: 'Platformer',
      onClick: () => handleChipClick('Build a playable 2D platformer browser game with jumping physics and obstacles.', onOpenGame),
    },
    {
      label: 'Board game',
      onClick: () => handleChipClick('Build a playable turn-based board game with simple AI opponent logic in canvas.', onOpenGame),
    },
  ];

  // Drag and drop for local file card
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        onUploadFile(e.dataTransfer.files[i]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        onUploadFile(e.target.files[i]);
      }
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-[1100px] mb-6">
      {/* Hidden file input for Card 4 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.docx,.xlsx,.csv,.txt,.json,.py,.ts,.tsx,.html"
      />

      {/* 12-Column Responsive Bento Grid with strictly aligned heights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:[grid-template-rows:repeat(2,minmax(0,1fr))] lg:h-[clamp(340px,46vh,420px)]">
        {/* CARD 1: BUILD (Cols 1-5, Row 1 on desktop) */}
        <div className="sm:col-span-2 lg:col-span-5 lg:row-start-1 lg:row-end-2 h-full min-h-0 relative hover:z-[1]">
          <BentoCard
            title="Build"
            subtitle="Websites, apps, and dashboards"
            accentColor="#06b6d4"
            glowRgba="rgba(6, 182, 212, 0.22)"
            borderGlowRgba="rgba(6, 182, 212, 0.4)"
            breatheClass="bento-breathe-1"
            entranceClass="animate-bento-entrance-1"
            illustration={<BuildIllustration />}
            chips={buildChips}
            onClickCard={() => {
              if (onOpenWebsite) onOpenWebsite();
              else onSelectPrompt('Build a responsive web application with interactive UI and Stitch styling');
            }}
          />
        </div>

        {/* CARD 2: CREATE (Cols 1-5, Row 2 on desktop) */}
        <div className="sm:col-span-2 lg:col-span-5 lg:row-start-2 lg:row-end-3 h-full min-h-0 relative hover:z-[1]">
          <BentoCard
            title="Create"
            subtitle="Generate PPT, PDF, and documents"
            accentColor="#f59e0b"
            glowRgba="rgba(245, 158, 11, 0.22)"
            borderGlowRgba="rgba(245, 158, 11, 0.4)"
            breatheClass="bento-breathe-2"
            entranceClass="animate-bento-entrance-2"
            illustration={<CreateIllustration />}
            chips={createChips}
            onClickCard={() => {
              if (onOpenSlides) onOpenSlides();
              else onSelectPrompt('Create an executive pitch deck presentation with structured slides');
            }}
          />
        </div>

        {/* CARD 3: BUILD A GAME (Cols 6-9, Rows 1-2 on desktop, Col 1 on tablet) */}
        <div className="sm:col-span-1 lg:col-span-4 lg:row-start-1 lg:row-end-3 h-full min-h-0 relative hover:z-[1]">
          <BentoCard
            title="Build a game"
            subtitle="Browser games, arcade, puzzles"
            accentColor="#8b5cf6"
            glowRgba="rgba(139, 92, 246, 0.24)"
            borderGlowRgba="rgba(139, 92, 246, 0.45)"
            breatheClass="bento-breathe-3"
            entranceClass="animate-bento-entrance-3"
            illustration={<GameIllustration />}
            chips={gameChips}
            onClickCard={() => {
              if (onOpenGame) onOpenGame();
              else onSelectPrompt('Build a playable browser retro arcade shooter game in HTML5 canvas');
            }}
          />
        </div>

        {/* CARD 4: START FROM A LOCAL FILE (Cols 10-12, Rows 1-2 on desktop, Col 2 on tablet) */}
        <div className="sm:col-span-1 lg:col-span-3 lg:row-start-1 lg:row-end-3 h-full min-h-0 relative hover:z-[1]">
          <BentoCard
            title="Start from a local file"
            subtitle="Open files for analysis"
            accentColor="#10b981"
            glowRgba="rgba(16, 185, 129, 0.22)"
            borderGlowRgba="rgba(16, 185, 129, 0.4)"
            breatheClass="bento-breathe-4"
            entranceClass="animate-bento-entrance-4"
            illustration={<FileIllustration isDragging={isDraggingOverFile} />}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isDraggingOver={isDraggingOverFile}
            onClickCard={() => fileInputRef.current?.click()}
          />
        </div>
      </div>
    </div>
  );
}
