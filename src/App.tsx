import { useEffect, useState } from 'react';
import { useStore } from './context/useStore';
import { Header } from './components/Header';
import { TransactionForm } from './components/TransactionForm';
import { Mempool } from './components/Mempool';
import { MiningPanel } from './components/MiningPanel';
import { BlockchainViewer } from './components/BlockchainViewer';
import { AttackPanel } from './components/AttackPanel';
import { WelcomeGuide } from './components/WelcomeGuide';
import { useMining } from './hooks/useMining';
import { validatePath, getLongestChainTip } from './blockchain/logic';

function App() {
  const { blocks, tips, initialize } = useStore();
  const { isMining } = useMining();
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const checkValidity = async () => {
      const tipId = getLongestChainTip({ blocks, tips } as any);
      const validation = await validatePath(blocks, tipId);
      setIsValid(validation.isValid);
    };
    checkValidity();
  }, [blocks, tips]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-brand-primary/30 selection:text-brand-primary">
      <WelcomeGuide />
      <Header isValid={isValid} isMining={isMining} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Sidebar - Controls */}
          <div className="space-y-6 lg:col-span-4 xl:col-span-3">
            <TransactionForm />
            <MiningPanel />
            <AttackPanel />
            <div className="hidden lg:block h-[400px]">
              <Mempool />
            </div>
          </div>

          {/* Main Content - Explorer */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="lg:hidden mb-8 h-[300px]">
              <Mempool />
            </div>
            <BlockchainViewer />
          </div>
        </div>
      </main>

      {/* Footer / Mobile Sticky Info could go here */}
    </div>
  );
}

export default App;
