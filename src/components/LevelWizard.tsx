import React from 'react';
import type { LearningLevel } from '../context/useStore';
import { ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelWizardProps {
  level: LearningLevel;
  title: string;
  canProgress: boolean;
  onNext: () => void;
  children: React.ReactNode;
}

export const LevelWizard: React.FC<LevelWizardProps> = ({
  title,
  canProgress,
  onNext,
  children,
}) => {
  const handleNext = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ff88', '#00ffee', '#ffffff']
    });
    onNext();
  };

  return (
    <div className="flex flex-col h-full px-4 py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>

      <div className="flex-1">
        {children}
      </div>

      {canProgress && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-4 text-lg font-bold text-white shadow-lg shadow-brand-primary/20 transition-transform active:scale-95"
          >
            <span>Next Step</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
