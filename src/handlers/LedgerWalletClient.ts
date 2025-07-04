import { logger, RainbowError } from '@/logger';
import { getHdPath, WalletLibraryType } from '@/model/wallet';
import { getEthApp } from '@/utils/ledger';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';
import AppEth, { ledgerService } from '@ledgerhq/hw-app-eth';
import { toUtf8Bytes } from '@ethersproject/strings';
import {
  createWalletClient,
  serializeTransaction as viemSerializeTransaction,
  type Account,
  type Address,
  type Hex,
  type WalletClient,
  type Transport,
  type Chain,
  type TransactionSerializable,
} from 'viem';
import { hexlify, joinSignature, type Bytes } from '@ethersproject/bytes';
import { getAddress } from '@ethersproject/address';

/**
 * Wait helper
 */
function waiter(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}

/**
 * Retry wrapper used for all Ledger calls so we can gracefully handle `TransportLocked` errors
 */
async function retryLedgerCall<T = any>(ethPromise: Promise<AppEth>, callback: (eth: AppEth) => Promise<T>, timeout?: number): Promise<T> {
  return new Promise(async (resolve, reject) => {
    if (timeout && timeout > 0) {
      setTimeout(() => {
        logger.debug('[LedgerWalletClient]: Signer timeout', {}, logger.DebugContext.ledger);
        return reject(new RainbowError('Ledger: Signer timeout'));
      }, timeout);
    }

    const eth = await ethPromise;
    if (!eth) {
      logger.debug('[LedgerWalletClient]: Eth app not open', {}, logger.DebugContext.ledger);
      return reject(new Error('Ledger: Eth app not open'));
    }

    // Wait up to ~5 seconds – same strategy that the ethers LedgerSigner implementation uses
    for (let i = 0; i < 50; i++) {
      try {
        const result = await callback(eth);
        return resolve(result);
      } catch (error: any) {
        logger.error(new RainbowError('[LedgerWalletClient]: Transport error'), error);
        if (error.id !== 'TransportLocked') {
          return reject(error);
        }
      }
      await waiter(100);
    }

    return reject(new RainbowError('Ledger: Signer timeout'));
  });
}

export interface CreateLedgerAccountParams {
  /** Bluetooth device identifier of the Ledger */
  deviceId: string;
  /** Derivation index (defaults to 0) */
  index?: number;
}

/**
 * Builds a viem `Account` implementation backed by a Ledger hardware wallet.
 * You can then pass this account object into viem's `createWalletClient` to obtain
 * a fully-featured WalletClient that signs messages & transactions via Ledger.
 */
export async function createLedgerAccount({ deviceId, index = 0 }: CreateLedgerAccountParams): Promise<Account> {
  // Derivation path (m/44'/60'/0'/0/index)
  const path = getHdPath({ type: WalletLibraryType.ledger, index });

  // Lazily instantiate the Ledger ETH application
  const ethPromise = getEthApp(deviceId);

  // Resolve Ledger address up-front as the account `address` must be synchronous
  const accountResponse = await retryLedgerCall(ethPromise, eth => eth.getAddress(path));
  const address = getAddress(accountResponse.address) as Address;

  /**
   * Helper that returns a closure over the Ledger retry logic for each sign method
   */
  const withRetry = <T>(fn: (eth: AppEth) => Promise<T>) => retryLedgerCall(ethPromise, fn);

  const account: Account = {
    address,
    async signMessage({ message }: { message: Bytes | string | Hex }) {
      // Convert input to bytes then to a hex string without the 0x prefix – the format expected by Ledger
      if (typeof message === 'string') {
        message = toUtf8Bytes(message);
      }
      // `hexlify` will handle Uint8Array / BytesLike inputs.
      const messageHex = hexlify(message as Bytes).substring(2);
      const sig = await withRetry(eth => eth.signPersonalMessage(path, messageHex));
      sig.r = '0x' + sig.r;
      sig.s = '0x' + sig.s;
      return joinSignature(sig) as Hex;
    },
    async signTypedData({ domain, types, primaryType, message, version = SignTypedDataVersion.V4 as any }: any) {
      // Sanitize & hash typed-data exactly like ethers implementation
      const domainSeparatorHex = TypedDataUtils.hashStruct('EIP712Domain', domain, types, version).toString('hex');
      const hashStructMessageHex = TypedDataUtils.hashStruct(primaryType, message, types, version).toString('hex');
      const sig = await withRetry(eth => eth.signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex));
      sig.r = '0x' + sig.r;
      sig.s = '0x' + sig.s;
      return joinSignature(sig) as Hex;
    },
    async signTransaction(tx: TransactionSerializable) {
      // Serialize the unsigned transaction to hex (without 0x prefix) for Ledger
      const unsignedTx = viemSerializeTransaction(tx).slice(2);

      // Provide Ledger with additional plugin resolution context
      const resolution = await withRetry(eth =>
        ledgerService.resolveTransaction(unsignedTx, eth.loadConfig, {
          erc20: true,
          externalPlugins: true,
          nft: true,
        })
      );

      // Sign the transaction on the Ledger device
      const sig = await withRetry(eth => eth.signTransaction(path, unsignedTx, resolution));

      // Combine the signature with the original transaction
      const signedTx = viemSerializeTransaction(tx, {
        r: `0x${sig.r}` as Hex,
        s: `0x${sig.s}` as Hex,
        v: BigInt(`0x${sig.v}`),
      }) as Hex;

      return signedTx;
    },
  } as unknown as Account;

  return account;
}

export interface CreateLedgerWalletClientParams extends CreateLedgerAccountParams {
  /** The chain definition to use for this wallet client */
  chain: Chain;
  /** viem transport implementation. */
  transport: Transport;
}

/**
 * Convenience helper that returns a viem `WalletClient` already initialised with a Ledger-backed account.
 */
export async function createLedgerWalletClient({
  deviceId,
  index,
  chain,
  transport,
}: CreateLedgerWalletClientParams): Promise<WalletClient> {
  const account = await createLedgerAccount({ deviceId, index });

  return createWalletClient({
    account,
    chain,
    transport,
  });
}
