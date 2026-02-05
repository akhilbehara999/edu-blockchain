import React from 'react';
import { useStore } from '../context/useStore';
import { Shield, ShieldAlert, RefreshCw, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface HeaderProps {
  isValid: boolean;
  isMining: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isValid, isMining }) => {
  const { difficulty, setDifficulty, resetChain } = useStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Block<span className="text-brand-primary">Sim</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className={clsx(
            "hidden items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium sm:flex",
            isValid ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {isValid ? (
              <>
                <Shield className="h-4 w-4" />
                <span>Chain Valid</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                <span>Chain Invalid</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <span className="px-2 text-xs font-medium text-neutral-400">Diff</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              disabled={isMining}
              className="bg-transparent text-sm font-bold text-white outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d} className="bg-neutral-900">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset the entire blockchain?')) {
                resetChain();
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            title="Reset Chain"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
