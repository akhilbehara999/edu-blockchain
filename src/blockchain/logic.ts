import type { Block, BlockId, BlockMap, BlockchainState } from './types';
import { calculateBlockHash } from './crypto';

export async function createGenesisBlock(): Promise<Block> {
  const genesisBlock: Omit<Block, 'hash' | 'id'> = {
    index: 0,
    timestamp: 1738771200000,
    transactions: [],
    nonce: 0,
    previousHash: '0',
    difficulty: 0,
    parentId: null,
  };

  const hash = await calculateBlockHash(genesisBlock as Block);
  return { ...genesisBlock, hash, id: 'genesis' } as Block;
}

export interface BlockValidationError {
  educational: string;
  technical: string;
}

export async function validateBlock(
  block: Block,
  previousBlock: Block | null,
  difficulty: number
): Promise<{ isValid: boolean; error?: BlockValidationError }> {
  // Check hash integrity
  const recalculatedHash = await calculateBlockHash(block);
  if (block.hash !== recalculatedHash) {
    return {
      isValid: false,
      error: {
        educational: "This block's data was changed, so its fingerprint (hash) no longer matches. In a real blockchain, this block would be rejected.",
        technical: `Hash mismatch: expected ${recalculatedHash.substring(0, 10)}..., but block has ${block.hash.substring(0, 10)}...`
      }
    };
  }

  // If genesis
  if (block.index === 0) {
    if (block.previousHash !== '0') {
      return {
        isValid: false,
        error: {
          educational: "The first block in the chain (Genesis) must have a previous hash of '0'.",
          technical: `Invalid genesis: previousHash is ${block.previousHash}`
        }
      };
    }
    return { isValid: true };
  }

  // Check index
  if (previousBlock && block.index !== previousBlock.index + 1) {
    return {
      isValid: false,
      error: {
        educational: "Blocks must follow a strict numerical order.",
        technical: `Invalid index: expected ${previousBlock.index + 1}, got ${block.index}`
      }
    };
  }

  // Check previous hash
  if (previousBlock && block.previousHash !== previousBlock.hash) {
    return {
      isValid: false,
      error: {
        educational: "The link to the previous block is broken. This block points to a hash that doesn't match the actual previous block.",
        technical: `Previous hash mismatch: block expects ${block.previousHash.substring(0, 10)}..., but previous block hash is ${previousBlock.hash.substring(0, 10)}...`
      }
    };
  }

  // Check difficulty
  const target = '0'.repeat(difficulty);
  if (!block.hash.startsWith(target)) {
    return {
      isValid: false,
      error: {
        educational: "This block hasn't been 'mined' correctly. Its hash doesn't meet the required difficulty (number of leading zeros).",
        technical: `Insufficient difficulty: hash must start with ${difficulty} zeros.`
      }
    };
  }

  return { isValid: true };
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<BlockId, BlockValidationError>;
  firstInvalidBlockId: BlockId | null;
}

export async function validatePath(
  blocks: BlockMap,
  tipId: BlockId
): Promise<ValidationResult> {
  const errors: Record<BlockId, BlockValidationError> = {};
  const path = getChainPath(blocks, tipId);
  let firstInvalidBlockId: BlockId | null = null;

  let pathIsValid = true;
  for (let i = 0; i < path.length; i++) {
    const block = path[i];
    const previousBlock = i === 0 ? null : path[i - 1];

    if (!pathIsValid) {
      errors[block.id] = {
        educational: "This block is broken because the block before it is invalid. Chains are only as strong as their weakest link.",
        technical: `Inherited invalidity from previous block.`
      };
      continue;
    }

    const validation = await validateBlock(block, previousBlock, block.difficulty);
    if (!validation.isValid && validation.error) {
      errors[block.id] = validation.error;
      pathIsValid = false;
      firstInvalidBlockId = block.id;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstInvalidBlockId,
  };
}

export function getLongestChainTip(state: Pick<BlockchainState, 'blocks' | 'tips'>): BlockId {
  let longestTip = '';
  let maxLength = -1;

  for (const tipId of state.tips) {
    const path = getChainPath(state.blocks, tipId);
    if (path.length > maxLength) {
      maxLength = path.length;
      longestTip = tipId;
    }
  }

  return longestTip;
}

export function getChainPath(blocks: BlockMap, tipId: BlockId): Block[] {
  const path: Block[] = [];
  let currentId: BlockId | null = tipId;

  while (currentId) {
    const block: Block = blocks[currentId];
    if (!block) break;
    path.unshift(block);
    currentId = block.parentId;
  }
  return path;
}

export function getBlocksByHeight(blocks: BlockMap): Block[][] {
  const heights: Record<number, Block[]> = {};
  let maxHeight = 0;

  Object.values(blocks).forEach(block => {
    if (!heights[block.index]) heights[block.index] = [];
    heights[block.index].push(block);
    if (block.index > maxHeight) maxHeight = block.index;
  });

  const result: Block[][] = [];
  for (let i = 0; i <= maxHeight; i++) {
    result.push(heights[i] || []);
  }
  return result;
}
