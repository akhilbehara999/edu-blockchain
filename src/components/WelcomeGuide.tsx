import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Zap, Pickaxe, ShieldCheck } from 'lucide-react';

export const WelcomeGuide: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('blocksim-guide-seen');
    if (!hasSeenGuide) {
      setIsVisible(true);
    }
  }, []);

  const closeGuide = () => {
    setIsVisible(false);
    localStorage.setItem('blocksim-guide-seen', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[100] w-full max-w-sm rounded-2xl border border-brand-primary/30 bg-neutral-900 p-6 shadow-2xl shadow-brand-primary/10"
        >
          <button
            onClick={closeGuide}
            className="absolute top-4 right-4 text-neutral-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 text-brand-primary mb-4">
            <Zap className="h-5 w-5" />
            <h3 className="font-bold text-lg">Welcome to BlockSim</h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-neutral-400 leading-relaxed">
              BlockSim is an interactive blockchain simulator. Follow these steps to learn:
            </p>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white">1</div>
                <div>
                  <p className="text-xs font-bold text-white">Create Transactions</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Add some data to the mempool using the form on the left.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white">2</div>
                <div>
                  <p className="text-xs font-bold text-white">Mine a Block</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Use the Mining Panel to solve the PoW puzzle and add your block.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white">3</div>
                <div>
                  <p className="text-xs font-bold text-white">Tamper & Learn</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Edit a block to see the ripple effect and how validation fails.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white">4</div>
                <div>
                  <p className="text-xs font-bold text-white">Simulate Forks & Attacks</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Fork from any block or use the 51% Attack panel to see consensus in action.</p>
                </div>
              </div>
            </div>

            <button
              onClick={closeGuide}
              className="w-full mt-2 rounded-lg bg-brand-primary py-2 text-sm font-bold text-white hover:bg-brand-primary/90 transition-colors"
            >
              Got it, let's go!
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
