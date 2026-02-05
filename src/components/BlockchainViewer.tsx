import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../context/useStore';
import { getBlocksByHeight, validatePath, getLongestChainTip } from '../blockchain/logic';
import { BlockCard } from './BlockCard';
import { Layers, GitBranch, Info } from 'lucide-react';
import { clsx } from 'clsx';

export const BlockchainViewer: React.FC = () => {
  const { blocks, tips, genesisId, difficulty, selectedTipId, setSelectedTipId } = useStore();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const blocksByHeight = useMemo(() => getBlocksByHeight(blocks), [blocks]);
  const longestTipId = useMemo(() => getLongestChainTip({ blocks, tips } as any), [blocks, tips]);

  useEffect(() => {
    const validateAll = async () => {
      let allErrors: Record<string, string> = {};
      for (const tipId of tips) {
        const validation = await validatePath(blocks, tipId);
        allErrors = { ...allErrors, ...validation.errors };
      }
      setValidationErrors(allErrors);
    };
    validateAll();
  }, [blocks, tips, difficulty]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand-secondary" />
          <h2 className="text-lg font-semibold text-white">Blockchain Explorer</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
            <div className="h-2 w-2 rounded-full bg-brand-primary" />
            <span>Consensus</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>Attacker</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span>Tampered</span>
          </div>
          <div className="hidden sm:block text-xs text-neutral-500 ml-2">
            {Object.keys(blocks).length} Blocks | {tips.length} Branches
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-12 pb-20">
        {blocksByHeight.map((heightBlocks, height) => (
          <div key={height} className="relative">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Height {height}</span>
              <div className="h-px flex-1 bg-neutral-900" />
            </div>

            <div className="flex flex-wrap gap-6">
              {heightBlocks.map((block) => {
                const isSelected = selectedTipId === block.id;
                const isLongest = longestTipId === block.id;

                return (
                  <div
                    key={block.id}
                    className={clsx(
                      "relative w-full max-w-md cursor-pointer transition-transform active:scale-[0.99]",
                      isSelected && "ring-2 ring-brand-primary ring-offset-4 ring-offset-neutral-950 rounded-2xl"
                    )}
                    onClick={() => setSelectedTipId(block.id)}
                  >
                    {isLongest && (
                      <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 rounded-full bg-brand-primary px-2 py-0.5 text-[8px] font-bold uppercase text-white shadow-lg">
                        <GitBranch className="h-2 w-2" /> Consensus Tip
                      </div>
                    )}
                    {block.isAttacker && (
                      <div className="absolute -top-2 left-4 z-10 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-bold uppercase text-white shadow-lg">
                        Attacker Block
                      </div>
                    )}
                    <BlockCard
                      block={block}
                      isValid={!validationErrors[block.id]}
                      error={validationErrors[block.id]}
                      isGenesis={block.id === genesisId}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {tips.length > 1 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/90 px-4 py-2 shadow-2xl backdrop-blur-md">
            <Info className="h-4 w-4 text-brand-secondary" />
            <span className="text-xs font-medium text-neutral-300">
              Multiple branches detected. Select a block to mine on that branch.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
