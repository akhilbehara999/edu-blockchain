import React, { useMemo, useEffect, useState } from 'react';
import { useStore } from '../context/useStore';
import { getChainPath, getLongestChainTip, validatePath } from '../blockchain/logic';
import { BlockCard } from './BlockCard';
import { AlertTriangle, ArrowDown } from 'lucide-react';
import { ExplainThis } from './ExplainThis';

export const VerticalTimeline: React.FC = () => {
  const { blocks, tips, selectedTipId } = useStore();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const chainPath = useMemo(() => {
    const tipId = selectedTipId || getLongestChainTip({ blocks, tips } as any);
    return getChainPath(blocks, tipId);
  }, [blocks, tips, selectedTipId]);

  useEffect(() => {
    const validateAll = async () => {
      if (chainPath.length === 0) return;
      const lastBlockId = chainPath[chainPath.length - 1].id;
      const validation = await validatePath(blocks, lastBlockId);
      setValidationErrors(validation.errors);
    };
    validateAll();
  }, [blocks, chainPath]);

  if (chainPath.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-neutral-800 mb-4" />
        <p className="text-neutral-500">No blocks found in this chain.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto snap-y snap-mandatory pb-32">
      <div className="px-4 pt-4">
        <ExplainThis
          bullets={[
            "Blocks are linked together: each block contains the hash of the previous one.",
            "If you change a block, its hash changes, breaking the link to the next block.",
            "This makes the blockchain immutable—you cannot change the past without breaking the present."
          ]}
        />
      </div>
      <div className="flex flex-col items-center gap-0">
        {chainPath.map((block, index) => (
          <React.Fragment key={block.id}>
            <div className="w-full min-h-[80vh] flex items-center justify-center p-4 snap-start">
              <div className="w-full max-w-md">
                <BlockCard
                  block={block}
                  isValid={!validationErrors[block.id]}
                  error={validationErrors[block.id]}
                  isGenesis={block.index === 0}
                />

                {!validationErrors[block.id] && index < chainPath.length - 1 && (
                  <div className="mt-8 flex flex-col items-center animate-bounce">
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-2">Next Block</span>
                    <ArrowDown className="h-5 w-5 text-neutral-700" />
                  </div>
                )}

                {validationErrors[block.id] && (
                  <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 animate-in fade-in zoom-in duration-300">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Why is this broken?</p>
                    <p className="text-sm text-neutral-300">
                      {index > 0 && validationErrors[chainPath[index-1]?.id]
                        ? "The previous block is invalid, breaking the chain's integrity."
                        : validationErrors[block.id]}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {index < chainPath.length - 1 && (
              <div className="h-12 w-0.5 bg-neutral-800 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
