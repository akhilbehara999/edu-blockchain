import { useEffect, useState, useRef } from 'react';
import { useStore } from './context/useStore';
import { Header } from './components/Header';
import { useMining } from './hooks/useMining';
import confetti from 'canvas-confetti';
import { Level1Hash } from './components/Level1Hash';
import { Level2Transactions } from './components/Level2Transactions';
import { Level3Mining } from './components/Level3Mining';
import { Level4Chain } from './components/Level4Chain';
import { VerticalTimeline } from './components/VerticalTimeline';
import { Home, PlusSquare, Pickaxe, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const {
    initialize,
    progress,
    resetLearningProgress,
    genesisId,
    isValid,
    blocks,
    difficulty,
    selectedTipId,
    updateChainValidity
  } = useStore();
  const { currentLevel } = progress;
  const { isMining } = useMining();
  const prevLevelRef = useRef(currentLevel);

  useEffect(() => {
    initialize();
  }, [initialize, genesisId]);

  // Centralized Validation Watcher
  useEffect(() => {
    updateChainValidity();
  }, [blocks, difficulty, selectedTipId, updateChainValidity]);

  useEffect(() => {
    if (prevLevelRef.current !== currentLevel) {
      // Trigger confetti on level up
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });
      prevLevelRef.current = currentLevel;
    }
  }, [currentLevel]);

  const [activeTab, setActiveTab] = useState<'home' | 'tx' | 'mine'>('home');

  const renderContent = () => {
    switch (currentLevel) {
      case 'hash':
        return <Level1Hash />;
      case 'transactions':
        return <Level2Transactions />;
      case 'mining':
        return <Level3Mining />;
      case 'chain':
        return <Level4Chain />;
      case 'completed':
        switch (activeTab) {
          case 'home':
            return <VerticalTimeline />;
          case 'tx':
            return (
              <div className="p-4 flex flex-col h-full">
                <Level2Transactions />
              </div>
            );
          case 'mine':
            return (
              <div className="p-4 flex flex-col h-full">
                <Level3Mining />
              </div>
            );
          default:
            return <VerticalTimeline />;
        }
      default:
        return <Level1Hash />;
    }
  };

  const handleReset = () => {
    if (confirm('Start your learning journey from the beginning? This will wipe all blocks.')) {
      resetLearningProgress();
      setActiveTab('home');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-brand-primary/30 selection:text-brand-primary flex flex-col">
      <Header isValid={isValid} isMining={isMining} />

      <main className="flex-1 flex flex-col">
        {renderContent()}
      </main>

      {currentLevel === 'completed' && (
        <nav className="border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-lg px-6 py-3 pb-8">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('home')}
              className={clsx("flex flex-col items-center gap-1", activeTab === 'home' ? "text-brand-primary" : "text-neutral-500")}
            >
              <Home className="h-6 w-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Chain</span>
            </button>
            <button
              onClick={() => setActiveTab('tx')}
              className={clsx("flex flex-col items-center gap-1", activeTab === 'tx' ? "text-brand-primary" : "text-neutral-500")}
            >
              <PlusSquare className="h-6 w-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Transact</span>
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={clsx("flex flex-col items-center gap-1", activeTab === 'mine' ? "text-brand-primary" : "text-neutral-500")}
            >
              <Pickaxe className="h-6 w-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Mine</span>
            </button>
            <button
              onClick={handleReset}
              className="flex flex-col items-center gap-1 text-neutral-500"
            >
              <RotateCcw className="h-6 w-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Reset</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;
