import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Block, Transaction, BlockchainState } from '../blockchain/types';
import { createGenesisBlock } from '../blockchain/logic';

interface AppState extends BlockchainState {
  mempool: Transaction[];
  difficulty: number;
  selectedTipId: string | null;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  clearMempool: () => void;
  addBlock: (block: Omit<Block, 'id'> & { id?: string }) => void;
  tamperBlock: (id: string, tamperedTransactions: Transaction[]) => Promise<void>;
  setDifficulty: (difficulty: number) => void;
  setSelectedTipId: (id: string | null) => void;
  resetChain: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      blocks: {},
      tips: [],
      genesisId: '',
      mempool: [],
      difficulty: 2,
      selectedTipId: null,

      initialize: async () => {
        const { genesisId } = get();
        if (genesisId) return;
        const genesis = await createGenesisBlock();
        set({
          blocks: { [genesis.id]: genesis },
          tips: [genesis.id],
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
        set((state) => ({ mempool: [...state.mempool, newTx] }));
      },

      clearMempool: () => set({ mempool: [] }),

      addBlock: (blockData) => {
        const id = blockData.id || Math.random().toString(36).substring(2, 9);
        const newBlock: Block = { ...blockData, id } as Block;

        set((state) => {
          const newBlocks = { ...state.blocks, [newBlock.id]: newBlock };
          // A block is a tip if it has no children.
          // When we add a block, its parent might no longer be a tip.
          // However, in a branching structure, a parent could have multiple children.
          // For simplicity, we just keep track of all leaf nodes.
          const newTips = state.tips.filter((t) => t !== newBlock.parentId);
          if (!newTips.includes(newBlock.id)) {
            newTips.push(newBlock.id);
          }

          return {
            blocks: newBlocks,
            tips: newTips,
            mempool: [],
            selectedTipId: newBlock.id, // Auto-select the newly mined block
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
          }
        }));
      },

      setDifficulty: (difficulty) => set({ difficulty }),

      setSelectedTipId: (id) => set({ selectedTipId: id }),

      resetChain: async () => {
        const genesis = await createGenesisBlock();
        set({
          blocks: { [genesis.id]: genesis },
          tips: [genesis.id],
          genesisId: genesis.id,
          mempool: [],
          selectedTipId: genesis.id,
        });
      },
    }),
    {
      name: 'blocksim-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
