import React from 'react';
import { useStore } from '../context/useStore';
import { Database, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export const Mempool: React.FC = () => {
  const { mempool, clearMempool } = useStore();

  return (
    <div className="flex flex-col h-full rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-white">Mempool</h2>
          <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-500">
            {mempool.length}
          </span>
        </div>
        {mempool.length > 0 && (
          <button
            onClick={clearMempool}
            className="text-neutral-500 hover:text-red-500 transition-colors"
            title="Clear Mempool"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {mempool.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-2 h-8 w-8 text-neutral-700" />
            <p className="text-sm text-neutral-500">No pending transactions</p>
            <p className="mt-1 text-xs text-neutral-600">Create one to start mining</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...mempool].reverse().map((tx) => (
              <div
                key={tx.id}
                className="group relative rounded-xl border border-neutral-800 bg-neutral-950 p-3 transition-colors hover:border-neutral-700"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-neutral-500">ID: {tx.id}</span>
                  <span className="text-neutral-600">
                    {format(tx.timestamp, 'HH:mm:ss')}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">From</span>
                    <span className="text-sm font-medium text-white">{tx.from}</span>
                  </div>
                  <div className="h-px w-8 bg-neutral-800" />
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">To</span>
                    <span className="text-sm font-medium text-white">{tx.to}</span>
                  </div>
                </div>
                <div className="mt-2 text-center font-mono text-sm font-bold text-amber-500">
                  {tx.amount} BTC
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
