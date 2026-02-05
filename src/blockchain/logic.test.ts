import { describe, it, expect } from 'vitest';
import { createGenesisBlock, validateBlock, validatePath } from './logic';
import { calculateBlockHash } from './crypto';
import type { Block } from './types';

describe('Blockchain Logic', () => {
  it('should create a valid genesis block', async () => {
    const genesis = await createGenesisBlock();
    expect(genesis.index).toBe(0);
    expect(genesis.previousHash).toBe('0');

    const validation = await validateBlock(genesis, null, 0);
    expect(validation.isValid).toBe(true);
  });

  it('should invalidate a block with incorrect hash', async () => {
    const genesis = await createGenesisBlock();
    const tamperedBlock = {
      ...genesis,
      hash: 'wrong-hash'
    };
    const validation = await validateBlock(tamperedBlock, null, 0);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('Hash integrity check failed');
  });

  it('should validate a path of blocks', async () => {
    const genesis = await createGenesisBlock();

    const block1: Block = {
      id: 'block1',
      parentId: genesis.id,
      index: 1,
      timestamp: Date.now(),
      transactions: [{ id: '1', from: 'A', to: 'B', amount: 10, timestamp: Date.now() }],
      previousHash: genesis.hash,
      nonce: 123,
      difficulty: 0,
      hash: '',
    };
    block1.hash = await calculateBlockHash(block1);

    const blocks = {
      [genesis.id]: genesis,
      [block1.id]: block1,
    };

    const validation = await validatePath(blocks, block1.id);
    expect(validation.isValid).toBe(true);
  });

  it('should detect tampering and ripple effect', async () => {
    // Use difficulty 1 to ensure hash must start with '0'
    const genesis = await createGenesisBlock();

    const block1: Block = {
      id: 'block1',
      parentId: genesis.id,
      index: 1,
      timestamp: Date.now(),
      transactions: [{ id: '1', from: 'A', to: 'B', amount: 10, timestamp: Date.now() }],
      previousHash: genesis.hash,
      nonce: 0,
      difficulty: 1,
      hash: '',
    };
    // Find a nonce that satisfies difficulty 1
    while (!(await calculateBlockHash(block1)).startsWith('0')) {
      block1.nonce++;
    }
    block1.hash = await calculateBlockHash(block1);

    const block2: Block = {
      id: 'block2',
      parentId: block1.id,
      index: 2,
      timestamp: Date.now(),
      transactions: [],
      previousHash: block1.hash,
      nonce: 0,
      difficulty: 1,
      hash: '',
    };
    while (!(await calculateBlockHash(block2)).startsWith('0')) {
      block2.nonce++;
    }
    block2.hash = await calculateBlockHash(block2);

    const blocks = {
      [genesis.id]: genesis,
      [block1.id]: block1,
      [block2.id]: block2,
    };

    // Tamper block 1
    const tamperedBlock1 = { ...block1, transactions: [{ ...block1.transactions[0], amount: 999 }] };
    tamperedBlock1.hash = await calculateBlockHash(tamperedBlock1);
    console.log('Tampered Hash:', tamperedBlock1.hash);

    const tamperedBlocks = {
      ...blocks,
      [block1.id]: tamperedBlock1,
    };

    const validation = await validatePath(tamperedBlocks, block2.id);
    expect(validation.isValid).toBe(false);
    expect(validation.errors[block1.id]).toBeDefined(); // Tampered
    expect(validation.errors[block2.id]).toBe('Previous block in chain is invalid'); // Ripple effect
  });
});
