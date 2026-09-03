import { base58Encode, requireSolanaAddress, type SolanaAddress } from '../address';
import { buildSolanaTransferMessage } from './send';
import { requireSolanaBlockhash } from './transaction/blockhash';
import { SOLANA_COMPUTE_BUDGET_PROGRAM_ADDRESS } from './transaction/computeBudget';
import { compileSolanaMessage } from './transaction/message';
import { SOLANA_SYSTEM_PROGRAM_ADDRESS } from './transaction/systemProgram';

const filled = (byte: number): SolanaAddress => requireSolanaAddress(base58Encode(Uint8Array.from(new Array(32).fill(byte))), 'fixture');

const FROM = filled(0x11);
const TO = filled(0x22);
const BLOCKHASH = requireSolanaBlockhash('5ev4GFkRqDDK8r1uvS593emEAmFShBV3pMb261idTwiy', 'fixture');

const intent = {
  from: FROM,
  to: TO,
  lamports: 1_234_567n,
  feeParams: { computeUnitLimit: 450, computeUnitPriceMicroLamports: 1_000n },
};

describe('buildSolanaTransferMessage', () => {
  const built = buildSolanaTransferMessage({ intent, blockhash: BLOCKHASH });

  it('names the sender as fee payer and carries the blockhash through', () => {
    expect(built.feePayer).toBe(FROM);
    expect(built.recentBlockhash).toBe(BLOCKHASH);
  });

  it('defaults to a legacy message and accepts v0', () => {
    expect(built.version).toBe('legacy');
    expect(buildSolanaTransferMessage({ intent, blockhash: BLOCKHASH, version: 'v0' }).version).toBe('v0');
  });

  it('emits the compute budget instructions in the builder, before the transfer', () => {
    // The reason for the separation: if SIMD-0385 removes these instructions,
    // the change is confined to this function rather than spread through orchestration.
    expect(built.instructions).toHaveLength(3);
    expect(built.instructions[0].programId).toBe(SOLANA_COMPUTE_BUDGET_PROGRAM_ADDRESS);
    expect(built.instructions[1].programId).toBe(SOLANA_COMPUTE_BUDGET_PROGRAM_ADDRESS);
    expect(built.instructions[2].programId).toBe(SOLANA_SYSTEM_PROGRAM_ADDRESS);
    expect(built.instructions[0].data[0]).toBe(2);
    expect(built.instructions[1].data[0]).toBe(3);
  });

  it('passes the intent through to the transfer instruction unchanged', () => {
    const transfer = built.instructions[2];
    expect(transfer.accounts).toEqual([
      { pubkey: FROM, isSigner: true, isWritable: true },
      { pubkey: TO, isSigner: false, isWritable: true },
    ]);
    expect(new DataView(transfer.data.buffer, transfer.data.byteOffset).getBigUint64(4, true)).toBe(1_234_567n);
  });

  it('compiles to a single-signer message whose fee payer is at index 0', () => {
    const compiled = compileSolanaMessage(built);
    expect(compiled.header.numRequiredSignatures).toBe(1);
    expect(compiled.accountKeys[0]).toBe(FROM);
    // Sender, recipient, then the two programs as readonly non-signers.
    expect(compiled.accountKeys).toHaveLength(4);
    expect(compiled.header.numReadonlyUnsignedAccounts).toBe(2);
  });

  it('is pure: the same intent and blockhash build an identical message', () => {
    const again = buildSolanaTransferMessage({ intent, blockhash: BLOCKHASH });
    expect(JSON.stringify(again, (_key, value) => (value instanceof Uint8Array ? Array.from(value) : value))).toBe(
      JSON.stringify(built, (_key, value) => (value instanceof Uint8Array ? Array.from(value) : value))
    );
  });

  it('accepts a self-send and a zero amount, because the runtime does', () => {
    expect(() => buildSolanaTransferMessage({ intent: { ...intent, to: FROM }, blockhash: BLOCKHASH })).not.toThrow();
    expect(() => buildSolanaTransferMessage({ intent: { ...intent, lamports: 0n }, blockhash: BLOCKHASH })).not.toThrow();
  });
});
