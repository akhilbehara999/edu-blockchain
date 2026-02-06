import React, { useState } from 'react';
import type { Block, Transaction } from '../blockchain/types';
import type { BlockValidationError } from '../blockchain/logic';
import { useStore } from '../context/useStore';
import { format } from 'date-fns';
import { Edit2, Check, X, ChevronDown, ChevronUp, GitBranch, Info, Terminal, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface BlockCardProps {
  block: Block;
  isValid: boolean;
  error?: BlockValidationError;
  isGenesis?: boolean;
}

export const BlockCard: React.FC<BlockCardProps> = ({ block, isValid, error, isGenesis }) => {
  const { tamperBlock, progress } = useStore();
  const { currentLevel } = progress;
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTechnical, setShowTechnical] = useState(currentLevel === 'completed');
  const [tamperedTxs, setTamperedTxs] = useState<Transaction[]>(block.transactions);
  const [isShaking, setIsShaking] = useState(false);

  const handleTamper = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    await tamperBlock(block.id, tamperedTxs);
    setIsEditing(false);
  };

  const updateTx = (index: number, field: keyof Transaction, value: string | number) => {
    const newTxs = [...tamperedTxs];
    newTxs[index] = { ...newTxs[index], [field]: value };
    setTamperedTxs(newTxs);
  };

  return (
    <motion.div
      animate={isShaking ? {
        x: [0, -10, 10, -10, 10, 0],
        boxShadow: ["0 0 0 rgba(239, 68, 68, 0)", "0 0 40px rgba(239, 68, 68, 0.5)", "0 0 0 rgba(239, 68, 68, 0)"]
      } : {}}
      transition={{ duration: 0.5 }}
      onClick={() => !isGenesis && setIsExpanded(!isExpanded)}
      className={clsx(
      "group relative flex flex-col rounded-2xl border transition-all duration-300",
      !isGenesis && "cursor-pointer",
      isGenesis
        ? "border-neutral-800 bg-neutral-900/20 grayscale"
        : isValid
          ? "border-neutral-800 bg-neutral-900/40"
          : "border-orange-500/50 bg-orange-950/10"
    )}>
      {/* Block Header (Always Visible) */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black",
            isGenesis ? "bg-neutral-900 text-neutral-600" : isValid ? "bg-neutral-800 text-neutral-400" : "bg-orange-500 text-white"
          )}>
            {isGenesis ? <Lock className="h-4 w-4" /> : block.index}
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {isGenesis ? 'Genesis Block' : `Block #${block.index}`}
              {!isGenesis && !isValid && <span className="text-[10px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Broken</span>}
              {!isGenesis && isValid && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Valid</span>}
            </h3>
            <div className="flex items-center gap-3 mt-0.5">
               <div className="flex items-center gap-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Hash:</span>
                  <span className="text-[10px] font-mono text-neutral-400">{block.hash.substring(0, 6)}...</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {!isGenesis && (isExpanded ? <ChevronUp className="h-5 w-5 text-neutral-600" /> : <ChevronDown className="h-5 w-5 text-neutral-600" />)}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-800/50"
          >
            <div className="p-4 space-y-4 bg-black/20" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 block font-bold">Full Hash</span>
                    <div className="font-mono text-[10px] break-all text-neutral-300 bg-black/40 rounded p-2">
                      {block.hash}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 block font-bold">Timestamp</span>
                    <div className="text-[10px] text-neutral-300 bg-black/40 rounded p-2">
                      {format(block.timestamp, 'MMM d, HH:mm:ss')}
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 block font-bold">Nonce</span>
                  <span className="text-sm font-mono text-white">{block.nonce}</span>
                </div>
                {!isGenesis && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(!isEditing);
                    }}
                    className={clsx(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      isEditing ? "bg-amber-500 text-white" : "bg-neutral-800 text-neutral-500 hover:text-white"
                    )}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
                {currentLevel === 'completed' && (
                  <div className="ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        useStore.getState().setSelectedTipId(block.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 text-[10px] font-bold uppercase tracking-tighter text-neutral-300 hover:text-brand-secondary transition-colors"
                    >
                      <GitBranch className="h-3 w-3" /> Mine from here
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                 <span className="text-[10px] uppercase tracking-wider text-neutral-500 block font-bold">Transactions ({block.transactions.length})</span>

                 {isEditing ? (
                  <div className="space-y-3 rounded-xl bg-amber-500/5 p-3 border border-amber-500/20">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Tampering Mode</p>
                    {tamperedTxs.map((tx, idx) => (
                      <div key={tx.id} className="space-y-2 border-b border-neutral-800 pb-2 last:border-0">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                            value={tx.from}
                            onChange={(e) => updateTx(idx, 'from', e.target.value)}
                          />
                          <input
                            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                            value={tx.to}
                            onChange={(e) => updateTx(idx, 'to', e.target.value)}
                          />
                        </div>
                        <input
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                          value={tx.amount}
                          onChange={(e) => updateTx(idx, 'amount', parseFloat(e.target.value))}
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        onClick={handleTamper}
                        className="flex-1 flex items-center justify-center gap-1 rounded bg-amber-500 py-1.5 text-xs font-bold text-white"
                      >
                        <Check className="h-3 w-3" /> Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setTamperedTxs(block.transactions);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded bg-neutral-800 py-1.5 text-xs font-bold text-neutral-400"
                      >
                        <X className="h-3 w-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {block.transactions.length === 0 ? (
                      <p className="text-xs text-neutral-600 text-center py-2 italic">Empty block</p>
                    ) : (
                      block.transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between rounded-lg bg-black/20 p-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-300">{tx.from}</span>
                            <span className="text-neutral-600">→</span>
                            <span className="font-medium text-neutral-300">{tx.to}</span>
                          </div>
                          <span className="font-mono font-bold text-brand-secondary">{tx.amount}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {!isValid && error && (
                <div className={clsx(
                  "rounded-xl bg-red-500/10 border border-red-500/20 overflow-hidden",
                  "animate-in fade-in slide-in-from-top-2 duration-300"
                )}>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-red-500/10">
                    <div className="flex items-center gap-2">
                      {showTechnical ? <Terminal className="h-3 w-3 text-red-500" /> : <Info className="h-3 w-3 text-red-500" />}
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                        {showTechnical ? 'Technical Error' : 'What happened?'}
                      </span>
                    </div>
                    {(currentLevel === 'chain' || currentLevel === 'completed') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTechnical(!showTechnical);
                        }}
                        className="text-[9px] font-bold text-neutral-500 uppercase hover:text-white transition-colors"
                      >
                        {showTechnical ? 'Show Simple' : 'Show Details'}
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-neutral-200 leading-relaxed">
                      {(showTechnical && (currentLevel === 'chain' || currentLevel === 'completed')) ? error.technical : error.educational}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
