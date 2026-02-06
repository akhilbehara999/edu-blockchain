import React from 'react';
import { useStore } from '../context/useStore';
import { ExplainThis } from './ExplainThis';
import { LevelWizard } from './LevelWizard';
import { TransactionForm } from './TransactionForm';
import { Mempool } from './Mempool';

export const Level2Transactions: React.FC = () => {
  const { setLearningLevel, hasAddedTransaction } = useStore();

  return (
    <LevelWizard
      level="transactions"
      title="2. Transactions & Mempool"
      canProgress={hasAddedTransaction}
      onNext={() => setLearningLevel('mining')}
    >
      <ExplainThis
        bullets={[
          "Transactions are the basic unit of data in a blockchain.",
          "The Mempool (Memory Pool) is a 'waiting room' for transactions.",
          "Miners pick transactions from the mempool to include in a block."
        ]}
      />

      <div className="space-y-6 flex flex-col h-full">
        <TransactionForm />

        <div className="flex-1 min-h-[300px]">
          <Mempool />
        </div>

        {!hasAddedTransaction && (
          <p className="text-center text-sm text-neutral-500 italic">
            Add at least one transaction to continue
          </p>
        )}
      </div>
    </LevelWizard>
  );
};
