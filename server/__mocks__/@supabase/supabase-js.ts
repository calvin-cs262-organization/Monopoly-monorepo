'use strict';

const mockFrom = jest.fn();

// Builds a chainable Supabase query mock.
// Every method returns `chain` so any length of chaining works.
// `chain` is also thenable, so `await chain` (at any point) resolves to `result`.
const mockChain = (result: unknown) => {
  const chain: Record<string, any> = {};
  ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single'].forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return chain;
};

const createClient = jest.fn(() => ({ from: mockFrom }));

export { createClient, mockFrom, mockChain };
