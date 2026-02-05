import React from 'react';
import { useStore } from '../context/useStore';
import { useMining } from '../hooks/useMining';
import { Pickaxe, Loader2, Play, Target } from 'lucide-react';

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

  const selectedBlock = selectedTipId ? blocks[selectedTipId] : null;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pickaxe className="h-5 w-5 text-brand-primary" />
          <h2 className="text-lg font-semibold text-white">Mining Control</h2>
        </div>
        {isMining && (
          <button
            onClick={stopMining}
            className="text-xs font-medium text-red-500 hover:text-red-400"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="space-y-4">
        {selectedBlock && (
          <div className="flex items-center gap-2 rounded-lg bg-neutral-950 p-2 border border-neutral-800">
            <Target className="h-3 w-3 text-brand-secondary" />
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Targeting:</span>
            <span className="text-[10px] text-white font-mono">Block #{selectedBlock.index} ({selectedBlock.hash.substring(0, 8)}...)</span>
          </div>
        )}

        {isMining ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Status</span>
              <span className="flex items-center gap-1 text-sm font-bold text-brand-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Mining...
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-500">
                <span>Current Nonce</span>
                <span>{progress?.nonce.toLocaleString() || 0}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full bg-brand-primary transition-all duration-300 ease-out"
                  style={{ width: `${(Math.min(100, (progress?.nonce || 0) / 1000) * 100) % 100}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg bg-neutral-950 p-3">
              <span className="block text-[10px] uppercase tracking-wider text-neutral-500">Current Hash Attempt</span>
              <span className="mt-1 block break-all font-mono text-[10px] text-neutral-400">
                {progress?.hash || 'Initializing...'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800">
                <Play className="h-5 w-5 text-neutral-500" />
              </div>
              <p className="text-sm text-neutral-400">
                {mempool.length === 0
                  ? 'Add transactions to the mempool to begin mining'
                  : `Ready to mine ${mempool.length} transactions`}
              </p>
            </div>
            <button
              onClick={handleMine}
              disabled={mempool.length === 0 || !selectedTipId}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-20"
            >
              <Pickaxe className="h-4 w-4" />
              Mine Next Block
            </button>
            {difficulty > 4 && (
              <div className="rounded-lg bg-amber-500/10 p-2 text-[10px] text-amber-500 text-center">
                Warning: High difficulty may take several minutes and high CPU.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
