import type { Block, BlockId, BlockMap, BlockchainState } from './types';
import { calculateBlockHash } from './crypto';
import { isGenesisBlock, validateGenesisBlock, createGenesisBlock as createGenesis } from './genesis';

export async function createGenesisBlock(): Promise<Block> {
  return createGenesis();
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
  // Check hash integrity (applies to ALL blocks, including genesis)
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

  // Genesis block specific rules
  if (isGenesisBlock(block)) {
    if (validateGenesisBlock(block)) {
      return { isValid: true };
    } else {
      return {
        isValid: false,
        error: {
          educational: "The Genesis block has been tampered with. It must have index 0 and no parent.",
          technical: "Invalid genesis structure."
        }
      };
    }
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
  tipId: BlockId,
  difficulty: number
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

    const validation = await validateBlock(block, previousBlock, difficulty);
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
