import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useStore } from '../context/useStore';
import { getChainPath, getLongestChainTip, validatePath, type BlockValidationError } from '../blockchain/logic';
import { BlockCard } from './BlockCard';
import { AlertTriangle, ArrowDown, Link2Off } from 'lucide-react';
import { ExplainThis } from './ExplainThis';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface VerticalTimelineProps {
  hideExplanations?: boolean;
}

export const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ hideExplanations = false }) => {
  const { blocks, tips, selectedTipId, difficulty, validationErrors, firstInvalidBlockId: firstInvalidId } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const chainPath = useMemo(() => {
    const tipId = selectedTipId || getLongestChainTip({ blocks, tips });
    return getChainPath(blocks, tipId);
  }, [blocks, tips, selectedTipId]);

  useEffect(() => {
    // Auto-scroll to the first invalid block
    if (firstInvalidId && blockRefs.current[firstInvalidId]) {
      blockRefs.current[firstInvalidId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [firstInvalidId]);

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
                  className="w-full h-[calc(100dvh-3.5rem)] flex items-center justify-center p-4 snap-start relative"
                >
                  <motion.div
                    animate={isFirstInvalid ? {
                      x: [0, -10, 10, -10, 10, 0],
                      backgroundColor: ["rgba(0,0,0,0)", "rgba(239, 68, 68, 0.1)", "rgba(0,0,0,0)"]
                    } : {}}
                    transition={{ duration: 0.5, repeat: isFirstInvalid ? Infinity : 0, repeatDelay: 2 }}
                    className="w-full max-w-md"
                  >
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
                  </motion.div>
                </div>

                {index < chainPath.length - 1 && (
                  <div className="relative flex flex-col items-center w-full">
                    {isInvalid && !prevIsInvalid ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-32 w-full flex flex-col items-center justify-center gap-2"
                      >
                        <div className="h-full w-0.5 bg-gradient-to-b from-neutral-800 to-red-500" />
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-red-500/20 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                            <Link2Off className="h-4 w-4 text-red-500 animate-pulse" />
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Chain Broken</span>
                          </div>
                          <p className="text-[9px] text-red-500 font-bold uppercase tracking-tighter text-center max-w-[200px]">
                            {validationErrors[block.id]?.educational.split('.')[0]}.
                          </p>
                        </div>
                        <div className="h-full w-0.5 bg-gradient-to-b from-red-500 to-red-900" />
                      </motion.div>
                    ) : (
                      <div className={clsx(
                        "h-16 w-0.5 flex-shrink-0 transition-colors duration-500",
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
