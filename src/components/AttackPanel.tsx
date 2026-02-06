import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/useStore';
import { useMining } from '../hooks/useMining';
import type { Block } from '../blockchain/types';
import { Swords, Skull, ShieldCheck } from 'lucide-react';
import { getLongestChainTip } from '../blockchain/logic';
import { clsx } from 'clsx';

export const AttackPanel: React.FC = () => {
  const { blocks, tips, difficulty, addBlock, genesisId } = useStore();
  const { startMining, stopMining, isMining } = useMining();

  const [isAttackEnabled, setIsAttackEnabled] = useState(false);
  const [attackerPower, setAttackerPower] = useState(60); // 60% power by default
  const [attackerTipId, setAttackerTipId] = useState<string | null>(null);

  const attackLoopRef = useRef<boolean>(false);

  const startAttack = () => {
    setIsAttackEnabled(true);
    attackLoopRef.current = true;

    const currentLongest = getLongestChainTip({ blocks, tips } as any);
    const path = [];
    let curr: Block | null | undefined = blocks[currentLongest];
    while (curr) {
      path.unshift(curr);
      curr = curr.parentId ? blocks[curr.parentId] : null;
    }

    const forkBase = path.length > 2 ? path[path.length - 2] : blocks[genesisId];
    setAttackerTipId(forkBase.id);
  };

  const stopAttack = () => {
    setIsAttackEnabled(false);
    attackLoopRef.current = false;
    stopMining();
  };

  useEffect(() => {
    if (!isAttackEnabled || isMining) return;

    const runAttack = async () => {
      if (!attackLoopRef.current || !attackerTipId) return;

      const parentBlock = blocks[attackerTipId];
      if (!parentBlock) return;

      const delay = Math.max(1000, (100 - attackerPower) * 50);
      await new Promise(resolve => setTimeout(resolve, delay));

      if (!attackLoopRef.current) return;

      const index = parentBlock.index + 1;
      const timestamp = Date.now();
      const previousHash = parentBlock.hash;
      const attackerTransactions = [{
        id: `atk-${Date.now()}`,
        from: 'Attacker',
        to: 'Void',
        amount: 666,
        timestamp: Date.now()
      }];

      try {
        const result = await startMining(
          index,
          timestamp,
          attackerTransactions,
          previousHash,
          Math.max(1, difficulty - 1)
        );

        if (!attackLoopRef.current) return;

        const newId = 'atk-' + Math.random().toString(36).substring(2, 9);
        addBlock({
          id: newId,
          index,
          timestamp,
          transactions: attackerTransactions,
          previousHash,
          nonce: result.nonce,
          hash: result.hash,
          difficulty: Math.max(1, difficulty - 1),
          parentId: attackerTipId,
          isAttacker: true,
        });

        setAttackerTipId(newId);
      } catch (err) {
        console.error('Attacker failed', err);
      }
    };

    runAttack();
  }, [isAttackEnabled, isMining, attackerTipId]);

  // Update attackerTipId when blocks change (to follow its own branch)
  useEffect(() => {
    if (isAttackEnabled && attackerTipId) {
      // Find a child of the current attacker tip that is also an attacker block
      const child = Object.values(blocks).find(b => b.parentId === attackerTipId && b.isAttacker);
      if (child) {
        setAttackerTipId(child.id);
      }
    }
  }, [blocks, isAttackEnabled, attackerTipId]);

  return (
    <div className="rounded-2xl border border-red-900/30 bg-red-950/5 p-6 backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold text-white">51% Attack Simulation</h2>
        </div>
        <button
          onClick={isAttackEnabled ? stopAttack : startAttack}
          className={clsx(
            "rounded-full px-4 py-1.5 text-xs font-bold transition-all",
            isAttackEnabled
              ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
          )}
        >
          {isAttackEnabled ? 'Stop Attack' : 'Start Attack'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-400">Attacker Hash Power</span>
            <span className={clsx("font-bold", attackerPower > 50 ? "text-red-500" : "text-neutral-500")}>
              {attackerPower}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="99"
            value={attackerPower}
            onChange={(e) => setAttackerPower(Number(e.target.value))}
            className="h-1.5 w-full accent-red-500 outline-none"
          />
        </div>

        {isAttackEnabled ? (
          <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 animate-pulse">
            <div className="flex items-start gap-3">
              <Skull className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-500">Attack in Progress</p>
                <p className="text-xs text-red-400/80 mt-1 leading-relaxed">
                  The attacker is mining on a secret branch. If this branch becomes longer than the honest chain, the network will accept it as the truth.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-neutral-900/50 p-4 border border-neutral-800">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-neutral-300">Network Secure</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Start an attack to see how majority hash power can rewrite history.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
