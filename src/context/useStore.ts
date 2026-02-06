import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Block, Transaction, BlockchainState } from '../blockchain/types';
import { createGenesisBlock } from '../blockchain/logic';

export type LearningLevel = 'hash' | 'transactions' | 'mining' | 'chain' | 'completed';

export interface LearningProgress {
  currentLevel: LearningLevel;
  hashChanges: number;
  lastCalculatedHash: string;
  hasAddedTransaction: boolean;
  hasMinedFirstBlock: boolean;
  hasTamperedBlock: boolean;
}

interface AppState extends BlockchainState {
  mempool: Transaction[];
  difficulty: number;
  selectedTipId: string | null;

  // Learning Progress
  progress: LearningProgress;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  clearMempool: () => void;
  addBlock: (blockData: Omit<Block, 'id'> & { id?: string }) => void;
  tamperBlock: (id: string, tamperedTransactions: Transaction[]) => Promise<void>;
  setDifficulty: (difficulty: number) => void;
  setSelectedTipId: (id: string | null) => void;
  resetChain: () => Promise<void>;
  initialize: () => Promise<void>;
  setLearningLevel: (level: LearningLevel) => void;
  recordHashChange: (newHash: string) => void;
  resetLearningProgress: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      blocks: {},
      tips: [],
      lastBlockId: '',
      genesisId: '',
      mempool: [],
      difficulty: 2,
      selectedTipId: null,

      // Learning Progress Defaults
      progress: {
        currentLevel: 'hash',
        hashChanges: 0,
        lastCalculatedHash: '',
        hasAddedTransaction: false,
        hasMinedFirstBlock: false,
        hasTamperedBlock: false,
      },

      initialize: async () => {
        const { genesisId } = get();
        // If genesis exists, we might still be in a learning level or completed
        if (genesisId) return;
        const genesis = await createGenesisBlock();
        set({
          blocks: { [genesis.id]: genesis },
          tips: [genesis.id],
          lastBlockId: genesis.id,
          genesisId: genesis.id,
          selectedTipId: genesis.id,
        });
      },

      addTransaction: (tx) => {
        const newTx: Transaction = {
          ...tx,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
        };
        set((state) => ({
          mempool: [...state.mempool, newTx],
          progress: { ...state.progress, hasAddedTransaction: true }
        }));
      },

      clearMempool: () => set({ mempool: [] }),

      addBlock: (blockData) => {
        const id = blockData.id || Math.random().toString(36).substring(2, 9);
        const newBlock: Block = { ...blockData, id } as Block;

        set((state) => {
          const newBlocks = { ...state.blocks, [newBlock.id]: newBlock };

          // Single chain logic for learning stages, forks for COMPLETED
          let newTips = [...state.tips];
          if (state.progress.currentLevel === 'completed') {
            newTips = state.tips.filter((t) => t !== newBlock.parentId);
            if (!newTips.includes(newBlock.id)) {
              newTips.push(newBlock.id);
            }
          } else {
            newTips = [newBlock.id];
          }

          return {
            blocks: newBlocks,
            tips: newTips,
            lastBlockId: newBlock.id,
            mempool: [],
            selectedTipId: newBlock.id, // Auto-select the newly mined block
            progress: { ...state.progress, hasMinedFirstBlock: true }
          };
        });
      },

      tamperBlock: async (id, tamperedTransactions) => {
        const { blocks } = get();
        const block = blocks[id];
        if (!block) return;

        const { calculateBlockHash } = await import('../blockchain/crypto');

        const tamperedBlock: Block = {
          ...block,
          transactions: tamperedTransactions,
        };
        tamperedBlock.hash = await calculateBlockHash(tamperedBlock);

        set((state) => ({
          blocks: {
            ...state.blocks,
            [id]: tamperedBlock
          },
          progress: { ...state.progress, hasTamperedBlock: true }
        }));
      },

      setDifficulty: (difficulty) => set({ difficulty }),

      setSelectedTipId: (id) => set({ selectedTipId: id }),

      resetChain: async () => {
        const genesis = await createGenesisBlock();
        set({
          blocks: { [genesis.id]: genesis },
          tips: [genesis.id],
          lastBlockId: genesis.id,
          genesisId: genesis.id,
          mempool: [],
          selectedTipId: genesis.id,
        });
      },

      setLearningLevel: (level) => set((state) => {
        // Finite State Machine: Only allow forward progression
        const levels: LearningLevel[] = ['hash', 'transactions', 'mining', 'chain', 'completed'];
        const currentIndex = levels.indexOf(state.progress.currentLevel);
        const nextIndex = levels.indexOf(level);

        if (nextIndex > currentIndex) {
          return {
            progress: { ...state.progress, currentLevel: level }
          };
        }
        return state;
      }),
      recordHashChange: (newHash: string) => set((state) => {
        if (newHash !== state.progress.lastCalculatedHash) {
          return {
            progress: {
              ...state.progress,
              hashChanges: state.progress.hashChanges + 1,
              lastCalculatedHash: newHash
            }
          };
        }
        return state;
      }),
      resetLearningProgress: () => {
        set({
          progress: {
            currentLevel: 'hash',
            hashChanges: 0,
            lastCalculatedHash: '',
            hasAddedTransaction: false,
            hasMinedFirstBlock: false,
            hasTamperedBlock: false,
          },
          blocks: {},
          tips: [],
          lastBlockId: '',
          genesisId: '',
          mempool: [],
          selectedTipId: null,
          difficulty: 2,
        });
        // We don't call initialize() here because it's async and we want to keep actions synchronous.
        // App.tsx has an effect that calls initialize() when genesisId is missing.
      },
    }),
    {
      name: 'blocksim-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
