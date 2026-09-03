import { createHash } from 'crypto';

import { base58Encode, requireSolanaAddress, type SolanaAddress } from '../address';
import { requireSolanaBlockhash } from '../core/transaction/blockhash';
import { requireSolanaTransactionSignature } from '../core/transaction/signature';
import { deriveSolanaSigner } from '../derivation';
import { type SolanaRpcClient, type SolanaSignatureStatus } from './solanaRpcClient';
import { confirmSolanaTransfer, prepareSolanaTransfer, sendPreparedSolanaTransfer, submitSolanaTransfer } from './submitSolanaTransfer';

const SEED = new Uint8Array(createHash('sha512').update('submitSolanaTransfer unit test seed', 'utf8').digest());
const signer = deriveSolanaSigner(SEED, 0);
const RECIPIENT: SolanaAddress = requireSolanaAddress('84bv3nsFUgyUrJFFe7nJSa574LSRc7nKYAN4x6NQPdia', 'fixture');
const BLOCKHASH = requireSolanaBlockhash('8BwinJ4M8npPhwwYTo4kTYHerQM44NABVNR6UBv63pcG', 'fixture');
const OTHER_BLOCKHASH = requireSolanaBlockhash('5ev4GFkRqDDK8r1uvS593emEAmFShBV3pMb261idTwiy', 'fixture');

const intent = {
  from: signer.address,
  to: RECIPIENT,
  lamports: 1_234_567n,
  feeParams: { computeUnitLimit: 450, computeUnitPriceMicroLamports: 1_000n },
};

const confirmed = (slot = 26): SolanaSignatureStatus => ({ slot, confirmations: null, confirmationStatus: 'confirmed', err: null });

type StubConnection = SolanaRpcClient & {
  sent: Uint8Array[];
  sendOptions: { skipPreflight?: boolean }[];
  statusQueries: { searchTransactionHistory?: boolean }[];
};

function stubConnection(overrides: Partial<SolanaRpcClient> = {}): StubConnection {
  const sent: Uint8Array[] = [];
  const sendOptions: { skipPreflight?: boolean }[] = [];
  const statusQueries: { searchTransactionHistory?: boolean }[] = [];
  const base: SolanaRpcClient = {
    endpoint: 'http://stub',
    getLatestBlockhash: async () => ({ blockhash: BLOCKHASH, lastValidBlockHeight: 175 }),
    getBlockHeight: async () => 100,
    sendTransaction: async (bytes, options) => {
      sent.push(bytes);
      sendOptions.push({ skipPreflight: options?.skipPreflight });
      // A real cluster answers with the transaction's first signature, which is what the
      // caller already computed; the stub reproduces that rather than inventing a value.
      return requireSolanaTransactionSignature(base58Encode(bytes.slice(1, 65)), 'stub');
    },
    getSignatureStatuses: async (signatures, options) => {
      statusQueries.push({ searchTransactionHistory: options?.searchTransactionHistory });
      return signatures.map(() => null);
    },
    getBalance: async () => 0n,
    getRecentPrioritizationFees: async () => [],
    getMinimumBalanceForRentExemption: async () => 890_880n,
    getFeeForMessage: async () => 5_001n,
  };
  return Object.assign(base, overrides, { sent, sendOptions, statusQueries });
}

describe('prepareSolanaTransfer', () => {
  it('signs without sending anything, and hands back the bytes', async () => {
    const connection = stubConnection();
    const prepared = await prepareSolanaTransfer({ intent, signer, connection });

    expect(connection.sent).toHaveLength(0);
    expect(prepared.signedBytes.length).toBeGreaterThan(64);
    expect(prepared.lastValidBlockHeight).toBe(175);
    expect(base58Encode(prepared.signedBytes.slice(1, 65))).toBe(prepared.signature);
  });

  it('signs the compiled message rather than the serialized transaction', async () => {
    // A mistake here produces a transaction the cluster rejects for
    // signature verification, so it is checked by re-verifying the emitted signature
    // against the message bytes carried inside the emitted transaction.
    const prepared = await prepareSolanaTransfer({ intent, signer, connection: stubConnection() });
    const messageBytes = prepared.signedBytes.slice(65);
    expect(base58Encode(signer.sign(messageBytes))).toBe(base58Encode(prepared.signedBytes.slice(1, 65)));
  });

  it('is deterministic: the same blockhash yields byte-identical bytes', async () => {
    // The property the whole retry rule rests on. ed25519 signing here is not randomised.
    const first = await prepareSolanaTransfer({ intent, signer, connection: stubConnection() });
    const second = await prepareSolanaTransfer({ intent, signer, connection: stubConnection() });
    expect(Array.from(second.signedBytes)).toEqual(Array.from(first.signedBytes));
  });

  it('produces different bytes for a different blockhash, which is a different transfer', async () => {
    const first = await prepareSolanaTransfer({ intent, signer, connection: stubConnection() });
    const second = await prepareSolanaTransfer({
      intent,
      signer,
      connection: stubConnection({ getLatestBlockhash: async () => ({ blockhash: OTHER_BLOCKHASH, lastValidBlockHeight: 175 }) }),
    });
    expect(second.signature).not.toBe(first.signature);
  });

  it('refuses when the signer does not hold the sending account', async () => {
    const otherSigner = deriveSolanaSigner(SEED, 1);
    await expect(prepareSolanaTransfer({ intent, signer: otherSigner, connection: stubConnection() })).rejects.toThrow(
      'does not hold the account'
    );
  });
});

describe('sendPreparedSolanaTransfer', () => {
  it('sends the prepared bytes verbatim and reports the signature', async () => {
    const connection = stubConnection();
    const prepared = await prepareSolanaTransfer({ intent, signer, connection });
    const result = await sendPreparedSolanaTransfer({ connection, prepared });

    expect(result.wasAlreadySubmitted).toBe(false);
    expect(connection.sent).toHaveLength(1);
    expect(Array.from(connection.sent[0])).toEqual(Array.from(prepared.signedBytes));
    expect(result.signature).toBe(prepared.signature);
  });

  it('resends the identical bytes without re-signing, which is the mandated retry', async () => {
    // The defect this pins: an API that cannot resend its own bytes forces a caller to
    // re-enter the whole submit, which draws a fresh blockhash and moves the money twice.
    const connection = stubConnection();
    const prepared = await prepareSolanaTransfer({ intent, signer, connection });

    await sendPreparedSolanaTransfer({ connection, prepared });
    await sendPreparedSolanaTransfer({ connection, prepared, resend: true });

    expect(connection.sent).toHaveLength(2);
    expect(Array.from(connection.sent[1])).toEqual(Array.from(connection.sent[0]));
  });

  it('skips preflight on a resend, because preflight rejects bytes the cluster already has', async () => {
    // Preflight simulates against the current bank, so byte-identical bytes for an already
    // processed transaction fail with `AlreadyProcessed` and the send throws instead of
    // returning the signature. That would turn the sanctioned retry into an error.
    const connection = stubConnection();
    const prepared = await prepareSolanaTransfer({ intent, signer, connection });

    await sendPreparedSolanaTransfer({ connection, prepared });
    await sendPreparedSolanaTransfer({ connection, prepared, resend: true });

    expect(connection.sendOptions).toEqual([{ skipPreflight: false }, { skipPreflight: true }]);
  });

  it('does not send at all when the cluster already knows the signature', async () => {
    const connection = stubConnection({ getSignatureStatuses: async () => [confirmed()] });
    const prepared = await prepareSolanaTransfer({ intent, signer, connection });
    const result = await sendPreparedSolanaTransfer({ connection, prepared });

    expect(result.wasAlreadySubmitted).toBe(true);
    expect(connection.sent).toHaveLength(0);
    expect(result.alreadyFailedWith).toBeUndefined();
  });

  it('surfaces an earlier attempt that failed on chain rather than reporting a bare success', async () => {
    // `wasAlreadySubmitted` alone conflates "already landed" with "already failed", and a
    // caller short-circuiting on the flag would report success for a rejected transfer.
    const err = { InstructionError: [2, { Custom: 1 }] };
    const connection = stubConnection({
      getSignatureStatuses: async () => [{ slot: 9, confirmations: null, confirmationStatus: 'finalized', err }],
    });
    const prepared = await prepareSolanaTransfer({ intent, signer, connection });
    const result = await sendPreparedSolanaTransfer({ connection, prepared });

    expect(result.wasAlreadySubmitted).toBe(true);
    expect(result.alreadyFailedWith).toEqual(err);
    expect(connection.sent).toHaveLength(0);
  });

  it('refuses when the cluster answers with a signature other than the one signed', async () => {
    const wrong = requireSolanaTransactionSignature(base58Encode(new Uint8Array(64).fill(0x09)), 'fixture');
    const connection = stubConnection({ sendTransaction: async () => wrong });
    const prepared = await prepareSolanaTransfer({ intent, signer, connection: stubConnection() });
    await expect(sendPreparedSolanaTransfer({ connection, prepared })).rejects.toThrow('different signature');
  });
});

describe('submitSolanaTransfer', () => {
  it('prepares and sends in one call, returning the bytes so a retry is possible', async () => {
    const connection = stubConnection();
    const result = await submitSolanaTransfer({ intent, signer, connection });

    expect(result.wasAlreadySubmitted).toBe(false);
    expect(result.lastValidBlockHeight).toBe(175);
    expect(connection.sent).toHaveLength(1);
    expect(base58Encode(result.signedBytes.slice(1, 65))).toBe(result.signature);
  });

  it('called twice, is two transfers rather than a retry, which is why it returns the bytes', async () => {
    // Documented rather than prevented: a fresh blockhash is a different message and a
    // different signature, so the pre-send check cannot recognise the earlier attempt. The
    // retry a caller wants is sendPreparedSolanaTransfer with the bytes from the first call.
    let call = 0;
    const connection = stubConnection({
      getLatestBlockhash: async () => ({
        blockhash: ++call === 1 ? BLOCKHASH : OTHER_BLOCKHASH,
        lastValidBlockHeight: 175,
      }),
    });

    const first = await submitSolanaTransfer({ intent, signer, connection });
    const second = await submitSolanaTransfer({ intent, signer, connection });

    expect(second.signature).not.toBe(first.signature);
    expect(connection.sent).toHaveLength(2);
    expect(second.wasAlreadySubmitted).toBe(false);
  });
});

describe('confirmSolanaTransfer', () => {
  const signature = requireSolanaTransactionSignature(base58Encode(new Uint8Array(64).fill(0x2a)), 'fixture');
  const noSleep = async () => {};

  const confirm = (connection: SolanaRpcClient, maxPolls = 5) =>
    confirmSolanaTransfer({ connection, signature, lastValidBlockHeight: 175, maxPolls, sleep: noSleep });

  it('reports a confirmed transfer with its slot', async () => {
    await expect(confirm(stubConnection({ getSignatureStatuses: async () => [confirmed(42)] }))).resolves.toEqual({
      status: 'confirmed',
      signature,
      slot: 42,
    });
  });

  it('reports a landed-but-failed transfer as failed, carrying the runtime error', async () => {
    const err = { InstructionError: [2, { Custom: 1 }] };
    await expect(
      confirm(stubConnection({ getSignatureStatuses: async () => [{ slot: 42, confirmations: 0, confirmationStatus: 'processed', err }] }))
    ).resolves.toEqual({ status: 'failed', signature, error: err });
  });

  it('waits rather than concluding while a transaction is only processed', async () => {
    let polls = 0;
    const connection = stubConnection({
      getSignatureStatuses: async () => {
        polls += 1;
        return polls < 3 ? [{ slot: 1, confirmations: 0, confirmationStatus: 'processed', err: null }] : [confirmed(50)];
      },
    });
    await expect(confirm(connection)).resolves.toEqual({ status: 'confirmed', signature, slot: 50 });
    expect(polls).toBe(3);
  });

  it('reports expiry as a definite negative once the window has closed with no status', async () => {
    const connection = stubConnection({ getBlockHeight: async () => 200 });
    await expect(confirm(connection)).resolves.toEqual({ status: 'expired', signature });
  });

  it('checks once more at expiry, because the closing block can be the landing block', async () => {
    // Ordering bug this pins: reporting `expired` for a transfer that actually succeeded
    // in the very block that closed the window.
    let polls = 0;
    const connection = stubConnection({
      getBlockHeight: async () => 200,
      getSignatureStatuses: async () => {
        polls += 1;
        return polls === 1 ? [null] : [confirmed(175)];
      },
    });
    await expect(confirm(connection)).resolves.toEqual({ status: 'confirmed', signature, slot: 175 });
  });

  it('searches transaction history on the final look, so an evicted status is not read as never landing', async () => {
    // The status cache evicts. A poll resumed after a gap sees null for a transaction that
    // landed long ago, and `expired` is documented as a definite negative, so concluding it
    // from an unsearched null reports a completed transfer as one that never happened.
    const connection = stubConnection({ getBlockHeight: async () => 200 });
    await confirm(connection);

    // The polling look passes no option, so the client's own default of false applies; only
    // the final look asks for history explicitly.
    expect(connection.statusQueries).toEqual([{ searchTransactionHistory: undefined }, { searchTransactionHistory: true }]);
  });

  it('reports unknown, not confirmed, when the window closes on a merely processed transaction', async () => {
    // At expiry a `processed` status is genuinely undecided: the transaction is in a block,
    // but that block has not been confirmed by a supermajority and can still be abandoned
    // on a fork. Calling it confirmed is the optimistic lie this result type exists to
    // avoid, and calling it expired would be wrong in the other direction.
    const connection = stubConnection({
      getBlockHeight: async () => 200,
      getSignatureStatuses: async () => [{ slot: 175, confirmations: 0, confirmationStatus: 'processed', err: null }],
    });
    await expect(confirm(connection)).resolves.toEqual({
      status: 'unknown',
      signature,
      endpoint: 'http://stub',
      lastValidBlockHeight: 175,
      reason: 'the blockhash expired while the transaction was processed but not confirmed',
    });
  });

  it('reports unknown rather than failure when the cluster cannot be reached', async () => {
    // The honest answer to the write-side gap: an unverifiable send is not a failure,
    // and reporting it as one invites the user to send again.
    const connection = stubConnection({
      getSignatureStatuses: async () => {
        throw new Error('network down');
      },
    });
    const outcome = await confirm(connection);
    expect(outcome).toEqual({
      status: 'unknown',
      signature,
      endpoint: 'http://stub',
      lastValidBlockHeight: 175,
      reason: 'the cluster could not be reached 3 times in a row',
    });
  });

  it('reports unknown when it runs out of polls before anything is decided', async () => {
    const outcome = await confirm(stubConnection(), 2);
    expect(outcome).toMatchObject({ status: 'unknown', endpoint: 'http://stub', reason: 'no status after 2 polls' });
  });

  it('never re-sends and never re-signs', async () => {
    const connection = stubConnection({ getBlockHeight: async () => 200 });
    await confirm(connection);
    expect(connection.sent).toHaveLength(0);
  });
});
