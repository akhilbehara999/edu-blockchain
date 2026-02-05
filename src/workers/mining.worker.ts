// Mining worker for Proof of Work
import type { Transaction } from '../blockchain/types';

// We can't import the calculateHash from crypto.ts because it might have dependencies that don't work in worker or cause issues with Vite's worker loading if not careful.
// Actually, it should be fine, but I'll define a simple version here or ensure the other one is clean.

async function calculateHash(
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

self.onmessage = async (e: MessageEvent) => {
  const { index, timestamp, transactions, previousHash, difficulty } = e.data;
  const target = '0'.repeat(difficulty);
  let nonce = 0;
  let hash = '';

  const startTime = Date.now();

  while (true) {
    hash = await calculateHash(index, timestamp, transactions, nonce, previousHash);

    if (hash.startsWith(target)) {
      self.postMessage({ type: 'SUCCESS', nonce, hash });
      break;
    }

    if (nonce % 100 === 0) {
      self.postMessage({ type: 'PROGRESS', nonce, hash });
    }

    nonce++;

    // Optional: check for cancellation
    // self.onmessage could handle a 'STOP' message if we use a different event handling pattern,
    // but simple workers are usually terminated from the outside.
  }
};
