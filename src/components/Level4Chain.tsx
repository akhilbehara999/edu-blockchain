import React from 'react';
import { useStore } from '../context/useStore';
import { ExplainThis } from './ExplainThis';
import { LevelWizard } from './LevelWizard';
import { VerticalTimeline } from './VerticalTimeline';

export const Level4Chain: React.FC = () => {
  const setLearningLevel = useStore(state => state.setLearningLevel);
  const isValid = useStore(state => state.isValid);

  return (
    <LevelWizard
      level="chain"
      title="4. The Immutable Chain"
      canProgress={!isValid}
      onNext={() => setLearningLevel('completed')}
    >
      <ExplainThis
        bullets={[
          "A Blockchain is a chain of blocks linked by their hashes.",
          "Try 'tampering' with a block by clicking the edit icon.",
          "Watch how the entire chain breaks when one block is changed!"
        ]}
      />

      <div className="flex-1 h-[60vh]">
        <VerticalTimeline hideExplanations={true} />
      </div>

      {isValid && (
        <p className="text-center text-sm text-neutral-500 italic mt-4">
          Tap the edit icon on a block to tamper with it
        </p>
      )}
    </LevelWizard>
  );
};
