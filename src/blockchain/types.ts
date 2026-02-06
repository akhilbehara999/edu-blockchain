export type BlockId = string;
export type ParentId = BlockId | null;

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
}

export interface Block {
  id: BlockId; // Internal ID for simulator tracking and rendering
  parentId: ParentId; // ID of the parent block in the tree
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  nonce: number;
  hash: string;
}

export type BlockMap = Record<BlockId, Block>;

export interface BlockchainState {
  blocks: BlockMap; // Map internal ID to block
  tips: BlockId[]; // IDs of blocks that are at the end of a branch
  lastBlockId: BlockId; // The single active tip for learning stages
  genesisId: BlockId;
}

export const VERSION = '1.1.0';
