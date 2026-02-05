import type { Block } from './types';
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

  const hash = await calculateBlockHash(genesisBlock as any);
  return { ...genesisBlock, hash, id: 'genesis' } as Block;
}

export async function validateBlock(
  block: Block,
  previousBlock: Block | null,
  difficulty: number
): Promise<{ isValid: boolean; error?: string }> {
  // Check hash integrity
  const recalculatedHash = await calculateBlockHash(block);
  if (block.hash !== recalculatedHash) {
    return { isValid: false, error: 'Hash integrity check failed' };
  }

  // If genesis
  if (block.index === 0) {
    if (block.previousHash !== '0') return { isValid: false, error: 'Invalid genesis' };
    return { isValid: true };
  }

  // Check index
  if (previousBlock && block.index !== previousBlock.index + 1) {
    return { isValid: false, error: `Invalid index: expected ${previousBlock.index + 1}, got ${block.index}` };
  }

  // Check previous hash
  if (previousBlock && block.previousHash !== previousBlock.hash) {
    return { isValid: false, error: 'Previous hash mismatch' };
  }

  // Check difficulty
  const target = '0'.repeat(difficulty);
  if (!block.hash.startsWith(target)) {
    return { isValid: false, error: 'Insufficient difficulty' };
  }

  return { isValid: true };
}

export async function validatePath(
  blocks: Record<string, Block>,
  tipId: string
): Promise<{ isValid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const path = getChainPath(blocks, tipId);

  let pathIsValid = true;
  for (let i = 0; i < path.length; i++) {
    const block = path[i];
    const previousBlock = i === 0 ? null : path[i - 1];

    if (!pathIsValid) {
      errors[block.id] = 'Previous block in chain is invalid';
      continue;
    }

    const validation = await validateBlock(block, previousBlock, block.difficulty);
    if (!validation.isValid) {
      errors[block.id] = validation.error || 'Unknown error';
      pathIsValid = false;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getLongestChainTip(state: { blocks: Record<string, Block>; tips: string[] }): string {
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

export function getChainPath(blocks: Record<string, Block>, tipId: string): Block[] {
  const path: Block[] = [];
  let currentId: string | null = tipId;

  while (currentId) {
    const block: Block = blocks[currentId];
    if (!block) break;
    path.unshift(block);
    currentId = block.parentId;
  }
  return path;
}

/**
 * Returns all blocks organized by their index (height) in the chain.
 * Useful for rendering a tree-like structure.
 */
export function getBlocksByHeight(blocks: Record<string, Block>): Block[][] {
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
