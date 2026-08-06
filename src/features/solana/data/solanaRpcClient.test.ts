import { base64 } from '@scure/base';

import { base58Encode, requireSolanaAddress, type SolanaAddress } from '../address';
import { requireSolanaTransactionSignature } from '../core/transaction/signature';
import { createSolanaRpcClient, getSolanaConnection } from './solanaRpcClient';

const ADDRESS: SolanaAddress = requireSolanaAddress('84bv3nsFUgyUrJFFe7nJSa574LSRc7nKYAN4x6NQPdia', 'fixture');
const BLOCKHASH = '8BwinJ4M8npPhwwYTo4kTYHerQM44NABVNR6UBv63pcG';
const SIGNATURE = requireSolanaTransactionSignature(base58Encode(Uint8Array.from(new Array(64).fill(0x2a))), 'fixture');

type Call = { url: unknown; body: { jsonrpc: string; id: number; method: string; params: unknown[] } };

/**
 * A transport that records what was asked and answers with what the test prescribes,
 * following the injection pattern the existing Solana data modules already use.
 */
function stubTransport(answers: unknown[]) {
  const calls: Call[] = [];
  let index = 0;
  return {
    calls,
    post: async <T>(url?: unknown, body?: unknown) => {
      calls.push({ url, body: body as Call['body'] });
      const answer = answers[Math.min(index++, answers.length - 1)];
      return { data: answer as T, headers: new Headers(), status: 200 };
    },
  };
}

const clientWith = (answers: unknown[]) => {
  const transport = stubTransport(answers);
  return { transport, client: createSolanaRpcClient({ endpoint: 'http://stub', client: transport }) };
};

describe('JSON-RPC framing', () => {
  it('sends a well-formed request and reads the result', async () => {
    const { transport, client } = clientWith([{ result: 1234 }]);
    await expect(client.getBlockHeight()).resolves.toBe(1234);

    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0].body.jsonrpc).toBe('2.0');
    expect(transport.calls[0].body.method).toBe('getBlockHeight');
  });

  it('turns a JSON-RPC error into a throw even though the transport succeeded', async () => {
    // The failure shape that matters: a JSON-RPC refusal arrives with HTTP 200 and an
    // `error` member, so a client that only checks transport status reads it as a success
    // carrying undefined. The public devnet faucet is the worked example.
    const { client } = clientWith([{ error: { code: -32603, message: 'Internal error' } }]);
    await expect(client.getBlockHeight()).rejects.toThrow('getBlockHeight failed with -32603: Internal error');
  });

  it('throws when a response carries neither a result nor an error', async () => {
    const { client } = clientWith([{}]);
    await expect(client.getBlockHeight()).rejects.toThrow('returned neither a result nor an error');
  });
});

describe('getLatestBlockhash', () => {
  it('brands the blockhash and returns the expiry height', async () => {
    const { client } = clientWith([{ result: { value: { blockhash: BLOCKHASH, lastValidBlockHeight: 175 } } }]);
    await expect(client.getLatestBlockhash()).resolves.toEqual({ blockhash: BLOCKHASH, lastValidBlockHeight: 175 });
  });

  it('rejects a malformed blockhash rather than branding it', async () => {
    const { client } = clientWith([{ result: { value: { blockhash: 'not-a-blockhash', lastValidBlockHeight: 175 } } }]);
    await expect(client.getLatestBlockhash()).rejects.toThrow('malformed blockhash');
  });

  it('rejects a response with no expiry height', async () => {
    const { client } = clientWith([{ result: { value: { blockhash: BLOCKHASH } } }]);
    await expect(client.getLatestBlockhash()).rejects.toThrow('no lastValidBlockHeight');
  });
});

describe('sendTransaction', () => {
  it('base64-encodes the bytes and says so in the request', async () => {
    const bytes = Uint8Array.from([1, 2, 3, 4, 5]);
    const { transport, client } = clientWith([{ result: SIGNATURE }]);

    await expect(client.sendTransaction(bytes)).resolves.toBe(SIGNATURE);

    const [encoded, options] = transport.calls[0].body.params as [string, Record<string, unknown>];
    expect(encoded).toBe(base64.encode(bytes));
    expect(options.encoding).toBe('base64');
  });

  it('keeps the cluster simulation in front of the send and asks for no internal retries', async () => {
    // `skipPreflight: false` means a transaction that cannot succeed is refused before it
    // is broadcast. `maxRetries: 0` because retrying is the caller's business,
    // because a retry must resend byte-identical bytes and never re-sign.
    const { transport, client } = clientWith([{ result: SIGNATURE }]);
    await client.sendTransaction(Uint8Array.from([1]));

    const options = (transport.calls[0].body.params as [string, Record<string, unknown>])[1];
    expect(options.skipPreflight).toBe(false);
    expect(options.maxRetries).toBe(0);
  });

  it('rejects a malformed signature rather than branding it', async () => {
    const { client } = clientWith([{ result: 'nope' }]);
    await expect(client.sendTransaction(Uint8Array.from([1]))).rejects.toThrow('malformed signature');
  });
});

describe('getSignatureStatuses', () => {
  it('returns the cluster values, including nulls for unknown signatures', async () => {
    const status = { slot: 26, confirmations: null, confirmationStatus: 'finalized', err: null };
    const { client } = clientWith([{ result: { value: [status, null] } }]);
    await expect(client.getSignatureStatuses([SIGNATURE, SIGNATURE])).resolves.toEqual([status, null]);
  });

  it('short-circuits an empty request rather than calling the cluster', async () => {
    const { transport, client } = clientWith([{ result: { value: [] } }]);
    await expect(client.getSignatureStatuses([])).resolves.toEqual([]);
    expect(transport.calls).toHaveLength(0);
  });
});

describe('lamport quantities', () => {
  it('returns balances as bigint', async () => {
    const { client } = clientWith([{ result: { value: 500_000_000 } }]);
    await expect(client.getBalance(ADDRESS)).resolves.toBe(500_000_000n);
  });

  it('returns the rent-exempt minimum as bigint', async () => {
    const { client } = clientWith([{ result: 890_880 }]);
    await expect(client.getMinimumBalanceForRentExemption(0)).resolves.toBe(890_880n);
  });

  it('throws on a non-integer lamport amount rather than truncating', async () => {
    const { client } = clientWith([{ result: { value: 1.5 } }]);
    await expect(client.getBalance(ADDRESS)).rejects.toThrow('non-integer lamport amount');
  });

  it('cannot detect a value that lost precision before it arrived, and that is the hazard', async () => {
    // A u64 above 2^53 arrives already rounded, still an integer, so no guard can catch
    // it. Measured on a local validator's genesis mint, whose balance reads as a multiple
    // of 64 lamports. Recorded here so the limitation is asserted, not just
    // described in a comment.
    const rounded = 500_000_000_000_000_000;
    const { client } = clientWith([{ result: { value: rounded } }]);
    await expect(client.getBalance(ADDRESS)).resolves.toBe(BigInt(rounded));
    expect(rounded % 64).toBe(0);
    expect(rounded).toBeGreaterThan(Number.MAX_SAFE_INTEGER);
  });

  it('converts prioritization fees per entry', async () => {
    const { client } = clientWith([
      {
        result: [
          { slot: 1, prioritizationFee: 0 },
          { slot: 2, prioritizationFee: 1_000 },
        ],
      },
    ]);
    await expect(client.getRecentPrioritizationFees([ADDRESS])).resolves.toEqual([
      { slot: 1, prioritizationFeeMicroLamports: 0n },
      { slot: 2, prioritizationFeeMicroLamports: 1_000n },
    ]);
  });
});

describe('getFeeForMessage', () => {
  it('returns the quoted fee as bigint', async () => {
    const { transport, client } = clientWith([{ result: { value: 5_001 } }]);
    await expect(client.getFeeForMessage(Uint8Array.from([9, 9]))).resolves.toBe(5_001n);
    expect((transport.calls[0].body.params as string[])[0]).toBe(base64.encode(Uint8Array.from([9, 9])));
  });

  it('returns null when the blockhash has already expired', async () => {
    const { client } = clientWith([{ result: { value: null } }]);
    await expect(client.getFeeForMessage(Uint8Array.from([9]))).resolves.toBeNull();
  });
});

describe('endpoints', () => {
  it('carries its endpoint, so an unverifiable outcome can name where it was submitted', () => {
    expect(createSolanaRpcClient({ endpoint: 'http://127.0.0.1:8899' }).endpoint).toBe('http://127.0.0.1:8899');
  });

  it('resolves the two clusters to the public keyless endpoints, neither of them a Rainbow one', () => {
    // Not an oversight: no Rainbow endpoint currently serves Solana RPC to the app.
    expect(getSolanaConnection({ cluster: 'devnet' }).endpoint).toBe('https://api.devnet.solana.com');
    expect(getSolanaConnection({ cluster: 'mainnet' }).endpoint).toBe('https://api.mainnet-beta.solana.com');
  });
});
