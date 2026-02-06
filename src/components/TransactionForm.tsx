import React, { useState } from 'react';
import { useStore } from '../context/useStore';
import { Plus, Send } from 'lucide-react';

export const TransactionForm: React.FC = () => {
  const addTransaction = useStore((state) => state.addTransaction);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!from || !to || !amount) return;

    const result = await addTransaction({
      from,
      to,
      amount: parseFloat(amount),
    });

    if (!result.success) {
      setError(result.error || 'Failed to add transaction');
      console.error('Add transaction failed:', result.error);
      return;
    }

    setFrom('');
    setTo('');
    setAmount('');
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Send className="h-5 w-5 text-brand-secondary" />
        <h2 className="text-lg font-semibold text-white">Create Transaction</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-400">Sender</label>
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="e.g. Alice"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-brand-secondary/50"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-400">Recipient</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g. Bob"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-brand-secondary/50"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-400">Amount</label>
          <input
            type="number"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-brand-secondary/50"
            required
          />
        </div>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-secondary px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add to Mempool
        </button>
      </form>
    </div>
  );
};
