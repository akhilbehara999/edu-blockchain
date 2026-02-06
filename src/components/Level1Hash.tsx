import React, { useState, useEffect } from 'react';
import { useStore, isStepCompleted } from '../context/useStore';
import { calculateHash } from '../blockchain/crypto';
import { ExplainThis } from './ExplainThis';
import { LevelWizard } from './LevelWizard';
import { Fingerprint } from 'lucide-react';
import { clsx } from 'clsx';

export const Level1Hash: React.FC = () => {
  const store = useStore();
  const { setLearningLevel, recordHashChange, progress } = store;
  const { hashChanges } = progress;
  const [input, setInput] = useState('');
  const [hash, setHash] = useState('');

  useEffect(() => {
    const updateHash = async () => {
      const h = await calculateHash(0, 0, [], 0, input);
      setHash(h);
    };
    updateHash();
  }, [input]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (hash) {
      recordHashChange(hash);
    }
  }, [hash, recordHashChange]);

  const lastHash = progress.lastCalculatedHash;

  const canProgress = isStepCompleted('hash', store);

  return (
    <LevelWizard
      level="hash"
      title="1. The Digital Fingerprint"
      canProgress={canProgress}
      onNext={() => setLearningLevel('transactions')}
    >
      <ExplainThis
        bullets={[
          "A Hash is a unique digital fingerprint of any data.",
          "Changing even one letter creates a completely different hash.",
          "This is how blockchain ensures data hasn't been tampered with."
        ]}
      />

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            Try typing something below:
          </label>
          <textarea
            value={input}
            onChange={handleChange}
            placeholder="Type here..."
            className="w-full h-32 rounded-xl bg-neutral-900 border border-neutral-800 p-4 text-white focus:border-brand-primary focus:outline-none transition-colors resize-none"
          />
        </div>

        <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Fingerprint className="h-4 w-4 text-brand-secondary" />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Resulting Hash</span>
          </div>
          <div className="break-all font-mono text-sm leading-relaxed">
            {hash.split('').map((char, i) => (
              <span
                key={i}
                className={clsx(
                  "transition-colors duration-500",
                  lastHash && char !== lastHash[i]
                    ? "text-brand-secondary bg-brand-secondary/20 shadow-[0_0_8px_rgba(var(--brand-secondary-rgb),0.5)]"
                    : "text-brand-primary"
                )}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {hashChanges < 2 && (
          <p className="text-center text-sm text-neutral-500 italic">
            Modify the input at least twice ({hashChanges}/2) to unlock the next step
          </p>
        )}
      </div>
    </LevelWizard>
  );
};
