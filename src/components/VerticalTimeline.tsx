import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useStore } from '../context/useStore';
import { getChainPath, getLongestChainTip, validatePath, type BlockValidationError } from '../blockchain/logic';
import { BlockCard } from './BlockCard';
import { AlertTriangle, ArrowDown, Link2Off } from 'lucide-react';
import { ExplainThis } from './ExplainThis';

interface VerticalTimelineProps {
  hideExplanations?: boolean;
}

export const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ hideExplanations = false }) => {
  const { blocks, tips, selectedTipId } = useStore();
  const [validationErrors, setValidationErrors] = useState<Record<string, BlockValidationError>>({});
  const [firstInvalidId, setFirstInvalidId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const chainPath = useMemo(() => {
    const tipId = selectedTipId || getLongestChainTip({ blocks, tips });
    return getChainPath(blocks, tipId);
  }, [blocks, tips, selectedTipId]);

  useEffect(() => {
    const validateAll = async () => {
      if (chainPath.length === 0) return;
      const lastBlockId = chainPath[chainPath.length - 1].id;
      const validation = await validatePath(blocks, lastBlockId);
      setValidationErrors(validation.errors);
      setFirstInvalidId(validation.firstInvalidBlockId);

      // Auto-scroll to the first invalid block
      if (validation.firstInvalidBlockId && blockRefs.current[validation.firstInvalidBlockId]) {
        setTimeout(() => {
          blockRefs.current[validation.firstInvalidBlockId!]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
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
    <div className="flex-1 flex flex-col min-h-0">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory pb-64"
      >
        {!hideExplanations && (
          <div className="px-4 pt-4">
            <ExplainThis
              bullets={[
                "Blocks are linked together: each block contains the hash of the previous one.",
                "If you change a block, its hash changes, breaking the link to the next block.",
                "This makes the blockchain immutable—you cannot change the past without breaking the present."
              ]}
            />
          </div>
        )}
        <div className="flex flex-col items-center gap-0">
          {chainPath.map((block, index) => {
            const isInvalid = !!validationErrors[block.id];
            const isFirstInvalid = block.id === firstInvalidId;
            const prevIsInvalid = index > 0 && !!validationErrors[chainPath[index-1].id];

            return (
              <React.Fragment key={block.id}>
                <div
                  ref={el => blockRefs.current[block.id] = el}
                  className="w-full h-[100dvh] flex items-center justify-center p-4 snap-start relative"
                >
                  <div className="w-full max-w-md">
                    <BlockCard
                      block={block}
                      isValid={!isInvalid}
                      error={validationErrors[block.id]}
                      isGenesis={block.index === 0}
                    />

                    {!isInvalid && index < chainPath.length - 1 && (
                      <div className="mt-12 flex flex-col items-center animate-bounce">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-2">Next Block</span>
                        <ArrowDown className="h-5 w-5 text-neutral-700" />
                      </div>
                    )}
                  </div>
                </div>

                {index < chainPath.length - 1 && (
                  <div className="relative flex flex-col items-center w-full">
                    {isInvalid && !prevIsInvalid ? (
                      <div className="h-32 w-full flex flex-col items-center justify-center gap-2">
                        <div className="h-full w-0.5 bg-gradient-to-b from-neutral-800 to-red-500/50" />
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
                            <Link2Off className="h-4 w-4 text-red-500" />
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Chain Broken</span>
                          </div>
                          <p className="text-[9px] text-red-500/60 font-medium uppercase tracking-tighter">
                            {validationErrors[block.id]?.educational.split('.')[0]}.
                          </p>
                        </div>
                        <div className="h-full w-0.5 bg-gradient-to-b from-red-500/50 to-red-900/50" />
                      </div>
                    ) : (
                      <div className={clsx(
                        "h-16 w-0.5 flex-shrink-0",
                        isInvalid ? "bg-red-900/50" : "bg-neutral-800"
                      )} />
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
