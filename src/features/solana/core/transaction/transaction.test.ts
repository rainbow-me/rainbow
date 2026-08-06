import { base58Decode, base58Encode, requireSolanaAddress, type SolanaAddress } from '../../address';
import { requireSolanaBlockhash } from './blockhash';
import { compileSolanaMessage, type CompiledSolanaMessage } from './message';
import { serializeSignedTransaction, SOLANA_PACKET_DATA_SIZE } from './transaction';

const filled = (byte: number): SolanaAddress => requireSolanaAddress(base58Encode(Uint8Array.from(new Array(32).fill(byte))), 'fixture');

const PAYER = filled(0x11);
const RECIPIENT = filled(0x22);
const PROGRAM = filled(0x33);
const BLOCKHASH = requireSolanaBlockhash('5ev4GFkRqDDK8r1uvS593emEAmFShBV3pMb261idTwiy', 'fixture');

const signature = (byte: number) => Uint8Array.from(new Array(64).fill(byte));

const singleSigner = (): CompiledSolanaMessage =>
  compileSolanaMessage({
    version: 'legacy',
    feePayer: PAYER,
    recentBlockhash: BLOCKHASH,
    instructions: [{ programId: PROGRAM, accounts: [{ pubkey: RECIPIENT, isSigner: false, isWritable: true }], data: new Uint8Array([1]) }],
  });

const twoSigners = (): CompiledSolanaMessage =>
  compileSolanaMessage({
    version: 'legacy',
    feePayer: PAYER,
    recentBlockhash: BLOCKHASH,
    instructions: [{ programId: PROGRAM, accounts: [{ pubkey: RECIPIENT, isSigner: true, isWritable: true }], data: new Uint8Array([1]) }],
  });

describe('serializeSignedTransaction', () => {
  it('prefixes the signature count, then the signatures, then the message verbatim', () => {
    const message = singleSigner();
    const bytes = serializeSignedTransaction({ signatures: [signature(0xab)], message });

    expect(bytes[0]).toBe(1);
    expect(Array.from(bytes.slice(1, 65))).toEqual(Array.from(signature(0xab)));
    expect(Array.from(bytes.slice(65))).toEqual(Array.from(message.bytes));
    expect(bytes.length).toBe(1 + 64 + message.bytes.length);
  });

  it('serializes two signatures in the order given', () => {
    const message = twoSigners();
    expect(message.header.numRequiredSignatures).toBe(2);

    const bytes = serializeSignedTransaction({ signatures: [signature(0x01), signature(0x02)], message });
    expect(bytes[0]).toBe(2);
    expect(bytes[1]).toBe(0x01);
    expect(bytes[65]).toBe(0x02);
  });

  it('refuses to serialize when the signature count does not match the header', () => {
    const message = singleSigner();
    expect(() => serializeSignedTransaction({ signatures: [], message })).toThrow('requires 1 signatures, received 0');
    expect(() => serializeSignedTransaction({ signatures: [signature(1), signature(2)], message })).toThrow(
      'requires 1 signatures, received 2'
    );
  });

  it('refuses a signature that is not 64 bytes', () => {
    const message = singleSigner();
    expect(() => serializeSignedTransaction({ signatures: [new Uint8Array(63)], message })).toThrow('must be 64 bytes');
    expect(() => serializeSignedTransaction({ signatures: [new Uint8Array(65)], message })).toThrow('must be 64 bytes');
  });

  it('refuses to emit anything over the packet size rather than truncating', () => {
    // The failure this prevents is a partially serialized transaction reaching the wire.
    // A single native transfer is nowhere near the bound, so it is reached deliberately
    // here with an oversized instruction payload.
    const oversized = compileSolanaMessage({
      version: 'legacy',
      feePayer: PAYER,
      recentBlockhash: BLOCKHASH,
      instructions: [{ programId: PROGRAM, accounts: [], data: new Uint8Array(SOLANA_PACKET_DATA_SIZE) }],
    });

    expect(() => serializeSignedTransaction({ signatures: [signature(0xab)], message: oversized })).toThrow(
      `over the ${SOLANA_PACKET_DATA_SIZE} limit`
    );
  });

  it('leaves a real single transfer far under the packet size', () => {
    const bytes = serializeSignedTransaction({ signatures: [signature(0xab)], message: singleSigner() });
    expect(bytes.length).toBeLessThan(SOLANA_PACKET_DATA_SIZE / 4);
  });

  it('places signature i so that it corresponds to accountKeys[i]', () => {
    // That rule is the reason the compiled message exposes its account table. The
    // fee payer is at index 0, so a single-signer transaction's signature goes first.
    const message = singleSigner();
    const bytes = serializeSignedTransaction({ signatures: [signature(0x7f)], message });

    expect(message.accountKeys[0]).toBe(PAYER);
    const firstKeyOffset = 1 + 64 + 3 + 1;
    expect(Array.from(bytes.slice(firstKeyOffset, firstKeyOffset + 32))).toEqual(Array.from(base58Decode(PAYER)!));
  });
});
