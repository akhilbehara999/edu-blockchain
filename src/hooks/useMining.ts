import { useState, useCallback, useRef } from 'react';
import type { Transaction, Block } from '../blockchain/types';

interface MiningProgress {
  nonce: number;
  hash: string;
}

export function useMining() {
  const [isMining, setIsMining] = useState(false);
  const [progress, setProgress] = useState<MiningProgress | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const stopMining = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsMining(false);
    setProgress(null);
  }, []);

  const startMining = useCallback(
    (
      index: number,
      timestamp: number,
      transactions: Transaction[],
      previousHash: string,
      difficulty: number
    ): Promise<{ nonce: number; hash: string }> => {
      return new Promise((resolve, reject) => {
        stopMining();

        // Create a new worker
        // In Vite, we use new Worker(new URL('./path/to/worker.ts', import.meta.url))
        const worker = new Worker(
          new URL('../workers/mining.worker.ts', import.meta.url),
          { type: 'module' }
        );
        workerRef.current = worker;

        setIsMining(true);

        worker.onmessage = (e) => {
          const { type, nonce, hash } = e.data;
          if (type === 'PROGRESS') {
            setProgress({ nonce, hash });
          } else if (type === 'SUCCESS') {
            setIsMining(false);
            setProgress({ nonce, hash });
            worker.terminate();
            workerRef.current = null;
            resolve({ nonce, hash });
          }
        };

        worker.onerror = (err) => {
          setIsMining(false);
          worker.terminate();
          workerRef.current = null;
          reject(err);
        };

        worker.postMessage({
          index,
          timestamp,
          transactions,
          previousHash,
          difficulty,
        });
      });
    },
    [stopMining]
  );

  return {
    startMining,
    stopMining,
    isMining,
    progress,
  };
}
