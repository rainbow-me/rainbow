import { RainbowError } from '@/logger';

import { base58Encode } from '../address';
import { buildSolanaTransferMessage, type SolanaTransferIntent } from '../core/send';
import { compileSolanaMessage } from '../core/transaction/message';
import { requireSolanaTransactionSignature, type SolanaTransactionSignature } from '../core/transaction/signature';
import { serializeSignedTransaction } from '../core/transaction/transaction';
import { type SolanaSigner } from '../derivation';
import { type SolanaRpcClient } from './solanaRpcClient';

/**
 * A signed transfer that has not been sent yet: the exact bytes, the signature they
 * carry, and the block height past which they can no longer land.
 *
 * **This type exists because the retry rule cannot be honoured without it.** The rule
 * is that a retry resends byte-identical signed bytes and never re-signs, because a fresh
 * blockhash is a different message, a different signature and a genuinely second
 * transfer. An API that signs and sends in one call, and hands back only a signature,
 * makes the mandated retry unrepresentable and the forbidden one the only thing a caller
 * can reach: the caller's sole recovery path becomes "call it again", which draws a new
 * blockhash and moves the money twice. That is not a hypothetical; it was demonstrated on
 * a validator against an earlier shape of this module, moving 4,000,000 lamports for a
 * 2,000,000-lamport intent.
 *
 * So the bytes are the unit that crosses the boundary. Hold them for as long as the
 * transfer might still need resending, and resend exactly them.
 */
export type PreparedSolanaTransfer = {
  readonly signature: SolanaTransactionSignature;
  readonly signedBytes: Uint8Array;
  readonly lastValidBlockHeight: number;
};

export type SolanaSubmitResult = {
  readonly signature: SolanaTransactionSignature;
  /**
   * The bytes that were sent, so the caller can resend precisely these and nothing else.
   */
  readonly signedBytes: Uint8Array;
  /** The block height past which this transaction can no longer land. */
  readonly lastValidBlockHeight: number;
  /**
   * True when the cluster already knew this signature before the send, so this call found
   * an earlier attempt rather than creating a second transfer.
   */
  readonly wasAlreadySubmitted: boolean;
  /**
   * Set when the cluster already knew the signature **and** it had failed on chain.
   *
   * Present because `wasAlreadySubmitted` alone conflates "already landed" with "already
   * failed", and a caller that short-circuits on the flag would report success for a
   * transfer the runtime rejected.
   */
  readonly alreadyFailedWith?: unknown;
};

/**
 * Builds and signs a transfer without sending anything.
 *
 * The six steps, and each one's rule is deliberate rather than habit: read a
 * blockhash and its `lastValidBlockHeight`; build the message from the intent; compile it,
 * which fixes the account-key ordering; sign `compiled.bytes`, **not** the serialized
 * transaction; place the signature at the fee payer's index, which for a single-signer
 * transfer is 0; serialize.
 *
 * No network write happens here, which is the point: the caller holds signed bytes before
 * anything is irreversible.
 */
export async function prepareSolanaTransfer(args: {
  readonly intent: SolanaTransferIntent;
  readonly signer: SolanaSigner;
  readonly connection: SolanaRpcClient;
}): Promise<PreparedSolanaTransfer> {
  const { intent, signer, connection } = args;

  if (signer.address !== intent.from) {
    throw new RainbowError('[solana/submit]: the signer does not hold the account the transfer sends from');
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const compiled = compileSolanaMessage(buildSolanaTransferMessage({ intent, blockhash }));

  if (compiled.header.numRequiredSignatures !== 1) {
    throw new RainbowError(
      `[solana/submit]: expected a single-signer transfer, compiled message requires ${compiled.header.numRequiredSignatures}`
    );
  }
  if (compiled.accountKeys[0] !== signer.address) {
    throw new RainbowError('[solana/submit]: the fee payer is not at account index 0, so the signature would be misplaced');
  }

  const signatureBytes = signer.sign(compiled.bytes);
  const signedBytes = serializeSignedTransaction({ signatures: [signatureBytes], message: compiled });

  // The transaction's id is its first signature, so it is known before the send rather
  // than learned from it. That is what makes the pre-send check possible at all.
  const signature = requireSolanaTransactionSignature(
    base58Encode(signatureBytes),
    '[solana/submit]: the produced signature did not encode to a transaction signature'
  );

  return { signature, signedBytes, lastValidBlockHeight };
}

/**
 * Sends prepared bytes, or resends them.
 *
 * **Safe to call more than once with the same `prepared`, which is the whole reason it is
 * separate from `prepareSolanaTransfer`.** Two mechanisms make that true. It asks
 * `getSignatureStatuses` first, so an attempt the cluster already knows is reported rather
 * than repeated. And a resend passes `skipPreflight`, because preflight simulates against
 * the current bank and would fail byte-identical bytes with `AlreadyProcessed`, turning
 * the sanctioned retry into a thrown error.
 *
 * It never re-signs and it cannot: it has no signer and no intent, only bytes.
 */
export async function sendPreparedSolanaTransfer(args: {
  readonly connection: SolanaRpcClient;
  readonly prepared: PreparedSolanaTransfer;
  /** Set on any call after the first for the same prepared transfer. */
  readonly resend?: boolean;
}): Promise<SolanaSubmitResult> {
  const { connection, prepared, resend = false } = args;
  const { signature, signedBytes, lastValidBlockHeight } = prepared;

  const [existing] = await connection.getSignatureStatuses([signature]);
  if (existing) {
    return {
      signature,
      signedBytes,
      lastValidBlockHeight,
      wasAlreadySubmitted: true,
      ...(existing.err ? { alreadyFailedWith: existing.err } : {}),
    };
  }

  const submitted = await connection.sendTransaction(signedBytes, { skipPreflight: resend });

  if (submitted !== signature) {
    throw new RainbowError('[solana/submit]: the cluster reported a different signature than the one that was signed');
  }

  return { signature, signedBytes, lastValidBlockHeight, wasAlreadySubmitted: false };
}

/**
 * Prepares and sends a transfer in one call, for the ordinary first attempt.
 *
 * **Calling this a second time for the same intent is not a retry; it is a second
 * transfer.** It draws a fresh blockhash, which is a different message and a different
 * signature, so the pre-send check cannot recognise the earlier attempt. To retry, keep the
 * `signedBytes` this returns and call `sendPreparedSolanaTransfer` with `resend: true`.
 * A double-spend observed against an earlier shape of this module is what made this
 * warning necessary.
 */
export async function submitSolanaTransfer(args: {
  readonly intent: SolanaTransferIntent;
  readonly signer: SolanaSigner;
  readonly connection: SolanaRpcClient;
}): Promise<SolanaSubmitResult> {
  const prepared = await prepareSolanaTransfer(args);
  return sendPreparedSolanaTransfer({ connection: args.connection, prepared });
}

/**
 * What became of a submitted transfer.
 *
 * **`unknown` is a first-class outcome rather than an error.** It is the honest answer
 * to the write-side half of the partial-failure gap: a send whose fate could not be
 * established is not a
 * failure, and reporting it as one invites the user to send again. It carries the
 * endpoint, the signature and the deadline, which is everything needed to find out
 * later.
 *
 * `expired` is the opposite and is deliberately separate: once the blockhash's
 * 150-block window has passed with no status, the transaction *cannot* land, so that is
 * a definite negative rather than an unknown one.
 */
export type SolanaTransferOutcome =
  | { readonly status: 'confirmed'; readonly signature: SolanaTransactionSignature; readonly slot: number }
  | { readonly status: 'failed'; readonly signature: SolanaTransactionSignature; readonly error: unknown }
  | { readonly status: 'expired'; readonly signature: SolanaTransactionSignature }
  | {
      readonly status: 'unknown';
      readonly signature: SolanaTransactionSignature;
      readonly endpoint: string;
      readonly lastValidBlockHeight: number;
      readonly reason: string;
    };

/**
 * Polls a submitted transfer to one of the four outcomes above.
 *
 * The loop asks two questions in this order, and the order is the point: first whether
 * the cluster has a status for the signature, and only then whether the blockhash
 * window has closed. A transaction can land in the very block that closes the window,
 * so checking expiry first would report `expired` for a transfer that actually
 * succeeded.
 *
 * **It never re-signs and never re-sends.** A fresh blockhash is a different
 * message, a different signature and a genuinely second transfer. Resending the same
 * bytes is safe and is the caller's business; producing new bytes is never correct here.
 */
export async function confirmSolanaTransfer(args: {
  readonly connection: SolanaRpcClient;
  readonly signature: SolanaTransactionSignature;
  readonly lastValidBlockHeight: number;
  readonly pollIntervalMs?: number;
  readonly maxPolls?: number;
  readonly sleep?: (ms: number) => Promise<void>;
}): Promise<SolanaTransferOutcome> {
  const {
    connection,
    signature,
    lastValidBlockHeight,
    pollIntervalMs = 1_000,
    maxPolls = 90,
    sleep = ms => new Promise<void>(resolve => setTimeout(resolve, ms)),
  } = args;

  const unknown = (reason: string): SolanaTransferOutcome => ({
    status: 'unknown',
    signature,
    endpoint: connection.endpoint,
    lastValidBlockHeight,
    reason,
  });

  let consecutiveTransportFailures = 0;

  for (let poll = 0; poll < maxPolls; poll++) {
    try {
      const [status] = await connection.getSignatureStatuses([signature]);

      if (status) {
        if (status.err) return { status: 'failed', signature, error: status.err };
        if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
          return { status: 'confirmed', signature, slot: status.slot };
        }
      }

      const blockHeight = await connection.getBlockHeight();
      if (blockHeight > lastValidBlockHeight) {
        // One last look, and this one **searches transaction history**, which the polling
        // look deliberately does not. Two different races need it. The window closing and
        // the transaction landing can be the same block. And the status cache evicts, so a
        // poll that resumed after a gap — a backgrounded app, a process restart — sees
        // `null` for a transaction that landed long ago, and concluding `expired` from that
        // reports a completed transfer as one that never happened.
        const [finalStatus] = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
        if (finalStatus?.err) return { status: 'failed', signature, error: finalStatus.err };
        if (finalStatus?.confirmationStatus === 'confirmed' || finalStatus?.confirmationStatus === 'finalized') {
          return { status: 'confirmed', signature, slot: finalStatus.slot };
        }
        // A status of `processed` here is genuinely undecided rather than good news: the
        // transaction is in a block, but that block has not been confirmed by a
        // supermajority and can still be abandoned on a fork. Calling it confirmed would
        // be the optimistic lie this result type exists to avoid.
        if (finalStatus) return unknown('the blockhash expired while the transaction was processed but not confirmed');
        return { status: 'expired', signature };
      }

      consecutiveTransportFailures = 0;
    } catch {
      consecutiveTransportFailures += 1;
      if (consecutiveTransportFailures >= 3) {
        return unknown(`the cluster could not be reached ${consecutiveTransportFailures} times in a row`);
      }
    }

    await sleep(pollIntervalMs);
  }

  return unknown(`no status after ${maxPolls} polls`);
}
