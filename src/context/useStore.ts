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
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => Promise<{ success: boolean; error?: string }>;
  clearMempool: () => void;
  addBlock: (blockData: Omit<Block, 'id'> & { id?: string }) => Promise<{ success: boolean; error?: string }>;
  tamperBlock: (id: string, tamperedTransactions: Transaction[]) => Promise<{ success: boolean; error?: string }>;
  setDifficulty: (difficulty: number) => Promise<{ success: boolean; error?: string }>;
  setSelectedTipId: (id: string | null) => void;
  resetChain: () => Promise<void>;
  initialize: () => Promise<void>;
  setLearningLevel: (level: LearningLevel) => void;
  recordHashChange: (newHash: string) => void;
  resetLearningProgress: () => void;
  updateChainValidity: () => Promise<void>;

  isValid: boolean;
  firstInvalidBlockId: string | null;
  validationErrors: Record<string, import('../blockchain/logic').BlockValidationError>;
}

/**
 * Logic-only selectors for progression and permissions
 */
export const isActionAllowed = (action: 'addTransaction' | 'addBlock' | 'tamperBlock' | 'setDifficulty', state: AppState): boolean => {
  const { currentLevel } = state.progress;
  if (currentLevel === 'completed') return true;

  switch (action) {
    case 'addTransaction':
      return currentLevel !== 'hash';
    case 'addBlock':
      return ['mining', 'chain'].includes(currentLevel);
    case 'tamperBlock':
      return currentLevel === 'chain';
    case 'setDifficulty':
      return false;
    default:
      return false;
  }
};

export const isStepCompleted = (level: LearningLevel, state: AppState): boolean => {
  const { progress } = state;
  switch (level) {
    case 'hash':
      return progress.hashChanges >= 2;
    case 'transactions':
      return progress.hasAddedTransaction;
    case 'mining':
      return progress.hasMinedFirstBlock;
    case 'chain':
      return progress.hasTamperedBlock;
    case 'completed':
      return false;
    default:
      return false;
  }
};

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
      isValid: true,
      firstInvalidBlockId: null,
      validationErrors: {},

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
        if (genesisId) {
          await get().updateChainValidity();
          return;
        }
        const genesis = await createGenesisBlock();
        set({
          blocks: { [genesis.id]: genesis },
          tips: [genesis.id],
          lastBlockId: genesis.id,
          genesisId: genesis.id,
          selectedTipId: genesis.id,
          isValid: true,
          firstInvalidBlockId: null,
          validationErrors: {},
        });
      },

      updateChainValidity: async () => {
        const { blocks, tips, difficulty, selectedTipId } = get();
        if (Object.keys(blocks).length === 0) return;

        const { validatePath, getLongestChainTip } = await import('../blockchain/logic');
        const tipId = selectedTipId || getLongestChainTip({ blocks, tips });
        const validation = await validatePath(blocks, tipId, difficulty);

        set({
          isValid: validation.isValid,
          firstInvalidBlockId: validation.firstInvalidBlockId,
          validationErrors: validation.errors
        });
      },

      addTransaction: async (tx) => {
        if (!isActionAllowed('addTransaction', get())) {
          return { success: false, error: "STAGES_LOCKED" };
        }

        const newTx: Transaction = {
          ...tx,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
        };
        set((state) => ({
          mempool: [...state.mempool, newTx],
          progress: { ...state.progress, hasAddedTransaction: true }
        }));
        await get().updateChainValidity();
        return { success: true };
      },

      clearMempool: () => set({ mempool: [] }),

      addBlock: async (blockData) => {
        const state = get();
        const { progress, isValid } = state;

        if (!isActionAllowed('addBlock', state)) {
          return { success: false, error: "MINING_LOCKED" };
        }

        // Block mining if chain is broken, UNLESS we are in the mining learning step
        if (!isValid && progress.currentLevel !== 'mining') {
          return { success: false, error: "CHAIN_BROKEN" };
        }

        // In learning stages, we can only mine on the latest tip
        if (progress.currentLevel !== 'completed' && blockData.parentId !== get().lastBlockId) {
            return { success: false, error: "MUST_MINE_ON_TIP" };
        }

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

        await get().updateChainValidity();
        return { success: true };
      },

      tamperBlock: async (id, tamperedTransactions) => {
        const state = get();
        const { blocks, genesisId } = state;

        if (id === genesisId) {
          return { success: false, error: "GENESIS_UNTOUCHABLE" };
        }

        if (!isActionAllowed('tamperBlock', state)) {
            return { success: false, error: "TAMPERING_LOCKED" };
        }

        const block = blocks[id];
        if (!block) return { success: false, error: "BLOCK_NOT_FOUND" };

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
          progress: {
            ...state.progress,
            hasTamperedBlock: true
          }
        }));

        await get().updateChainValidity();
        return { success: true };
      },

      setDifficulty: async (difficulty) => {
        if (!isActionAllowed('setDifficulty', get())) {
          return { success: false, error: "DIFFICULTY_LOCKED" };
        }
        set({ difficulty });
        await get().updateChainValidity();
        return { success: true };
      },

      setSelectedTipId: (id) => set({ selectedTipId: id }),

      resetChain: async () => {
        const { progress } = get();
        const genesis = await createGenesisBlock();

        set({
          blocks: { [genesis.id]: genesis },
          tips: [genesis.id],
          lastBlockId: genesis.id,
          genesisId: genesis.id,
          mempool: [],
          selectedTipId: genesis.id,
          isValid: true,
          firstInvalidBlockId: null,
          validationErrors: {},
          // Reset learning state unless in completed mode
          progress: progress.currentLevel === 'completed' ? progress : {
            currentLevel: 'hash',
            hashChanges: 0,
            lastCalculatedHash: '',
            hasAddedTransaction: false,
            hasMinedFirstBlock: false,
          }
        });
      },

      setLearningLevel: (level) => set((state) => {
        // Finite State Machine: Only allow forward progression
        const levels: LearningLevel[] = ['hash', 'transactions', 'mining', 'chain', 'completed'];
        const currentIndex = levels.indexOf(state.progress.currentLevel);
        const targetIndex = levels.indexOf(level);

        // Can only progress to the next level
        if (targetIndex !== currentIndex + 1) return state;

        if (isStepCompleted(state.progress.currentLevel, state)) {
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
          isValid: true,
          firstInvalidBlockId: null,
          validationErrors: {},
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
