import React from 'react';
import { useStore } from '../context/useStore';
import { useMining } from '../hooks/useMining';
import { Pickaxe, Database, AlertCircle, Settings2 } from 'lucide-react';
import { clsx } from 'clsx';

export const MiningPanel: React.FC = () => {
  const { mempool, blocks, selectedTipId, difficulty, addBlock, setDifficulty, progress, isValid: isChainValid } = useStore();
  const { startMining, stopMining, isMining, progress: miningProgress } = useMining();

  const handleMine = async () => {
    if (mempool.length === 0 || !selectedTipId || !isChainValid) return;

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

        {progress.currentLevel === 'completed' ? (
          <div className="flex items-center gap-3 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <Settings2 className="h-3 w-3 text-neutral-500" />
            <span className="text-[10px] font-bold text-neutral-500 uppercase">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              className="bg-transparent text-xs font-mono text-brand-primary focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map(d => (
                <option key={d} value={d} className="bg-neutral-900 text-white">
                  {d}
                </option>
              ))}
            </select>
          </div>
        ) : (
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
        )}
      </div>

      <div className="space-y-6">
        {isMining ? (
          <div className="space-y-6">
            <div className="text-center">
              <span className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Current Nonce</span>
              <span className="text-4xl font-black text-white tabular-nums">
                {miningProgress?.nonce.toLocaleString() || 0}
              </span>
            </div>

            <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800">
              <span className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Live Hash</span>
              <span className="block break-all font-mono text-xs text-brand-primary leading-relaxed">
                {miningProgress?.hash || 'Initializing...'}
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

            {!isChainValid && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Mining Disabled</p>
                  <p className="text-xs text-neutral-300 leading-relaxed font-bold">
                    The chain is broken at an earlier block. You must fix the chain or reset before you can mine new blocks.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleMine}
              disabled={mempool.length === 0 || !selectedTipId || !isChainValid}
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
