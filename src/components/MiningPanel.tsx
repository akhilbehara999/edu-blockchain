import React from 'react';
import { useStore } from '../context/useStore';
import { useMining } from '../hooks/useMining';
import { Pickaxe, Database } from 'lucide-react';
import { clsx } from 'clsx';

export const MiningPanel: React.FC = () => {
  const { mempool, blocks, selectedTipId, difficulty, addBlock } = useStore();
  const { startMining, stopMining, isMining, progress } = useMining();

  const handleMine = async () => {
    if (mempool.length === 0 || !selectedTipId) return;

    const lastBlock = blocks[selectedTipId];
    if (!lastBlock) return;

    const index = lastBlock.index + 1;
    const timestamp = Date.now();
    const previousHash = lastBlock.hash;

    try {
      const result = await startMining(
        index,
        timestamp,
        mempool,
        previousHash,
        difficulty
      );

      addBlock({
        index,
        timestamp,
        transactions: mempool,
        previousHash,
        nonce: result.nonce,
        hash: result.hash,
        difficulty,
        parentId: selectedTipId,
      });
    } catch (err) {
      console.error('Mining failed', err);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pickaxe className="h-5 w-5 text-brand-primary" />
          <h2 className="text-lg font-semibold text-white">Mining</h2>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                "h-2 w-2 rounded-full",
                i < difficulty ? "bg-brand-primary" : "bg-neutral-800"
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {isMining ? (
          <div className="space-y-6">
            <div className="text-center">
              <span className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Current Nonce</span>
              <span className="text-4xl font-black text-white tabular-nums">
                {progress?.nonce.toLocaleString() || 0}
              </span>
            </div>

            <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800">
              <span className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Live Hash</span>
              <span className="block break-all font-mono text-xs text-brand-primary leading-relaxed">
                {progress?.hash || 'Initializing...'}
              </span>
            </div>

            <button
              onClick={stopMining}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/20"
            >
              Cancel Mining
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8 text-center bg-neutral-950 rounded-xl border border-dashed border-neutral-800">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900">
                <Database className="h-6 w-6 text-neutral-600" />
              </div>
              <p className="text-sm text-neutral-400 px-4">
                {mempool.length === 0
                  ? 'The mempool is empty. Add transactions first.'
                  : `${mempool.length} transactions waiting to be mined.`}
              </p>
            </div>

            <button
              onClick={handleMine}
              disabled={mempool.length === 0 || !selectedTipId}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-brand-primary py-4 text-lg font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-20 active:scale-[0.98]"
            >
              <Pickaxe className="h-5 w-5" />
              Mine Block
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
