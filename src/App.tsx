import { useEffect, useState } from 'react';
import { useStore } from './context/useStore';
import { Header } from './components/Header';
import { useMining } from './hooks/useMining';
import { validatePath, getLongestChainTip } from './blockchain/logic';
import { Level1Hash } from './components/Level1Hash';
import { Level2Transactions } from './components/Level2Transactions';
import { Level3Mining } from './components/Level3Mining';
import { VerticalTimeline } from './components/VerticalTimeline';
import { Home, PlusSquare, Pickaxe, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const { blocks, tips, initialize, currentLevel, resetLearningProgress, genesisId } = useStore();
  const { isMining } = useMining();
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize, genesisId]);

  useEffect(() => {
    const checkValidity = async () => {
      if (Object.keys(blocks).length === 0) return;
      const tipId = getLongestChainTip({ blocks, tips } as any);
      const validation = await validatePath(blocks, tipId);
      setIsValid(validation.isValid);
    };
    checkValidity();
  }, [blocks, tips]);

  const [activeTab, setActiveTab] = useState<'home' | 'tx' | 'mine'>('home');

  const renderContent = () => {
    if (currentLevel === 'hash') return <Level1Hash />;
    if (currentLevel === 'transactions') return <Level2Transactions />;
    if (currentLevel === 'mining') return <Level3Mining />;

    // Level completed: show tabbed interface
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
