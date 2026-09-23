import React from 'react';

interface AppTransitionProps {
  stage: 'transitioning' | 'ready';
  children: React.ReactNode;
}

export const AppTransition: React.FC<AppTransitionProps> = ({ stage, children }) => {
  const isTransitioning = stage === 'transitioning';
  const isReady = stage === 'ready';

  return (
    <div
      className={`relative w-full h-full flex flex-col transition-all duration-500 ease-out ${
        isReady || isTransitioning
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-[0.99] pointer-events-none'
      }`}
    >
      {children}
    </div>
  );
};
