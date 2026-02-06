import React from 'react';
import { useStore, isStepCompleted } from '../context/useStore';
import { ExplainThis } from './ExplainThis';
import { LevelWizard } from './LevelWizard';
import { MiningPanel } from './MiningPanel';

export const Level3Mining: React.FC = () => {
  const store = useStore();
  const { setLearningLevel, progress } = store;
  const { hasMinedFirstBlock, currentLevel } = progress;
  const isCompleted = currentLevel === 'completed';
  const canProgress = isStepCompleted('mining', store);

  return (
    <LevelWizard
      level="mining"
      title="3. The Mining Race"
      canProgress={canProgress}
      onNext={() => setLearningLevel('chain')}
    >
      <ExplainThis
        bullets={[
          "Mining is the process of finding a hash that starts with specific number of zeros.",
          "The Nonce is a random number you change to get a completely different hash.",
          "Difficulty controls how many zeros are required (more zeros = harder)."
        ]}
      />

      <div className="space-y-6">
        <MiningPanel />

        {!isCompleted && !hasMinedFirstBlock && (
          <p className="text-center text-sm text-neutral-500 italic">
            Find a valid hash to mine your first block
          </p>
        )}
      </div>
    </LevelWizard>
  );
};
