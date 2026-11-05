import { ed25519 } from '@noble/curves/ed25519';
import { address } from '@solana/addresses';

import { assertSolanaSource } from '@/features/wallet/data/enableSolanaAccount';
import { readSolanaKey } from '@/features/wallet/data/solanaKeychain';
import { getSolanaAccount, type EnabledSolanaAccount } from '@/features/wallet/data/stores/accountMetadataStore';
import { SolanaCluster, type SolanaSigner } from '@rainbow-me/solana-sdk';

export async function withSolanaSigner<T>(record: EnabledSolanaAccount, operation: (signer: SolanaSigner) => Promise<T>): Promise<T> {
  const assertCurrent = () => {
    assertSolanaSource(record);
    if (getSolanaAccount(record.walletId, record.index)?.address !== record.address) throw new Error('Solana account changed.');
  };
  assertCurrent();
  const key = await readSolanaKey(record.address);
  let active = true;
  try {
    assertCurrent();
    return await operation({
      address: address(record.address),
      signTransactionMessage: async ({ cluster, messageBytes }) => {
        if (!active || cluster !== SolanaCluster.Mainnet) throw new Error('Unsupported Solana signing request.');
        assertCurrent();
        return ed25519.sign(messageBytes, key);
      },
    });
  } finally {
    active = false;
    key.fill(0);
  }
}
