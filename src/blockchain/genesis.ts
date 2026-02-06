import type { Block } from './types';
import { calculateBlockHash } from './crypto';

export const GENESIS_ID = 'genesis-block';

export const GENESIS_BLOCK_DATA = {
  index: 0,
  timestamp: 1738771200000,
  transactions: [],
  nonce: 0,
  previousHash: '0',
  parentId: null,
};

export async function createGenesisBlock(): Promise<Block> {
  const hash = await calculateBlockHash(GENESIS_BLOCK_DATA as Block);
  return {
    ...GENESIS_BLOCK_DATA,
    id: GENESIS_ID,
    hash,
  } as Block;
}

export function isGenesisBlock(block: Block): boolean {
  return block.id === GENESIS_ID || block.index === 0;
}

export function validateGenesisBlock(block: Block): boolean {
  return (
    block.index === 0 &&
    block.parentId === null &&
    block.previousHash === '0'
  );
}
