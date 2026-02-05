export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
}

export interface Block {
  id: string; // Internal ID for simulator tracking and rendering
  parentId: string | null; // ID of the parent block in the tree
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  nonce: number;
  hash: string;
  difficulty: number;
  isAttacker?: boolean;
}

export interface BlockchainState {
  blocks: Record<string, Block>; // Map internal ID to block
  tips: string[]; // IDs of blocks that are at the end of a branch
  genesisId: string;
}

export const VERSION = '1.0.0';
