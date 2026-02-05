import type { Transaction, Block } from './types';

export async function calculateHash(
  index: number,
  timestamp: number,
  transactions: Transaction[],
  nonce: number,
  previousHash: string
): Promise<string> {
  const data = `${index}${timestamp}${JSON.stringify(transactions)}${nonce}${previousHash}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function calculateBlockHash(block: Omit<Block, 'hash'>): Promise<string> {
  return calculateHash(
    block.index,
    block.timestamp,
    block.transactions,
    block.nonce,
    block.previousHash
  );
}
