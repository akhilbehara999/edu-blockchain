import React from 'react';
import { useStore } from '../context/useStore';
import { Shield, ShieldAlert, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface HeaderProps {
  isValid: boolean;
  isMining: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isValid }) => {
  const { currentLevel } = useStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
            <Zap className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Block<span className="text-brand-primary">Sim</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className={clsx(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            isValid ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {isValid ? (
              <>
                <Shield className="h-3 w-3" />
                <span>Valid</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-3 w-3" />
                <span>Broken</span>
              </>
            )}
          </div>

          {currentLevel !== 'completed' && (
             <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-l border-neutral-800 pl-3">
               {currentLevel === 'hash' && 'Step 1/4'}
               {currentLevel === 'transactions' && 'Step 2/4'}
               {currentLevel === 'mining' && 'Step 3/4'}
               {currentLevel === 'chain' && 'Step 4/4'}
             </div>
          )}
        </div>
      </div>
    </header>
  );
};
