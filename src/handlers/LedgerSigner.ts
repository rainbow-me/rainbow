'use strict';

import { type Provider, type TransactionRequest } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { hexlify, joinSignature, type Bytes } from '@ethersproject/bytes';
import { defineReadOnly, resolveProperties } from '@ethersproject/properties';
import { toUtf8Bytes } from '@ethersproject/strings';
import { serialize, type UnsignedTransaction } from '@ethersproject/transactions';
import type AppEth from '@ledgerhq/hw-app-eth';
import { ledgerService } from '@ledgerhq/hw-app-eth';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';

import { ensureError, logger, RainbowError } from '@/logger';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { getEthApp } from '@/utils/ledger';
import { time } from '@/utils/time';

type LedgerTransactionResolution = Awaited<ReturnType<typeof ledgerService.resolveTransaction>>;

const LEDGER_TRANSACTION_RESOLUTION_TIMEOUT_MS = time.seconds(10);
const LEDGER_TRANSACTION_RESOLUTION_CONFIG = {
  erc20: true,
  externalPlugins: true,
  nft: true,
};

function waiter(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}

function withTimeout<T>(promise: Promise<T>, duration: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new RainbowError(message)), duration);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

/**
 * Converts a signature component to a hex string.
 * Handles multiple formats that Ledger libraries may return:
 * - Hex string (with or without 0x prefix)
 * - Buffer/Uint8Array
 * - Comma-separated decimal string (e.g., "40,126,97,42,...")
 */
function sigComponentToHex(value: string | Buffer | Uint8Array): string {
  if (typeof value === 'string') {
    // Comma-separated decimal string
    if (value.includes(',')) {
      const bytes = new Uint8Array(value.split(',').map(Number));
      return hexlify(bytes);
    }
    // Already a hex string
    return value.startsWith('0x') ? value : '0x' + value;
  }
  // Buffer or Uint8Array
  return hexlify(value);
}

/** Ethers signer that routes signing requests through a paired Ledger device. */
export class LedgerSigner extends Signer {
  readonly path: string | undefined;
  readonly privateKey: null | undefined;
  readonly deviceId: string | undefined;
  readonly isLedger: boolean | undefined;

  readonly _eth: Promise<AppEth> | undefined;

  constructor(provider: Provider, path: string, deviceId: string) {
    super();

    defineReadOnly(this, 'isLedger', true);
    defineReadOnly(this, 'privateKey', null);
    defineReadOnly(this, 'path', path);
    defineReadOnly(this, 'deviceId', deviceId);
    defineReadOnly(this, 'provider', provider || null);
    defineReadOnly(
      this,
      '_eth',
      getEthApp(deviceId).then(
        ethApp => {
          return ethApp;
        },
        error => {
          return Promise.reject(error);
        }
      )
    );
  }

  // @skylarbarrera - may end up removing/tweaking retry logic but for now it works and lets us move forward
  _retry<T = any>(callback: (eth: AppEth) => Promise<T>, timeout?: number): Promise<T> {
    return new Promise(async (resolve, reject) => {
      if (timeout && timeout > 0) {
        setTimeout(() => {
          logger.debug('[LedgerSigner]: Signer timeout', {}, logger.DebugContext.ledger);
          return reject(new RainbowError('Ledger: Signer timeout'));
        }, timeout);
      }

      const eth = await this._eth;
      if (!eth) {
        logger.debug('[LedgerSigner]: Eth app not open', {}, logger.DebugContext.ledger);
        return reject(new Error('Ledger: Eth app not open'));
      }

      // Wait up to 5 seconds
      for (let i = 0; i < 50; i++) {
        try {
          const result = await callback(eth);
          return resolve(result);
        } catch (error: any) {
          logger.error(new RainbowError('[LedgerSigner]: Transport error'), error);

          // blind signing isnt enabled
          if (error.name === 'EthAppPleaseEnableContractData')
            Navigation.handleAction(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR, {
              screen: Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET,
              params: {
                shouldGoBack: true,
              },
            });
          if (error.id !== 'TransportLocked') {
            return reject(error);
          }
        }
        await waiter(100);
      }

      return reject(new RainbowError('Ledger: Signer timeout'));
    });
  }

  async getAddress(): Promise<string> {
    const account = await this._retry(eth => eth.getAddress(this.path!));
    return getAddress(account.address);
  }

  async signMessage(message: Bytes | string): Promise<string> {
    if (typeof message === 'string') {
      message = toUtf8Bytes(message);
    }

    const messageHex = hexlify(message).substring(2);

    const sig = await this._retry(eth => eth.signPersonalMessage(this.path!, messageHex));
    sig.r = sigComponentToHex(sig.r);
    sig.s = sigComponentToHex(sig.s);
    return joinSignature(sig);
  }

  async signTypedDataMessage(data: any, legacy: boolean): Promise<string> {
    const version = legacy === false ? SignTypedDataVersion.V4 : SignTypedDataVersion.V3;
    const { domain, types, primaryType, message } = TypedDataUtils.sanitizeData(data);

    const domainSeparatorHex = TypedDataUtils.hashStruct('EIP712Domain', domain, types, version).toString('hex');

    const hashStructMessageHex = TypedDataUtils.hashStruct(
      // @ts-ignore
      primaryType,
      message,
      types,
      version
    ).toString('hex');

    const sig = await this._retry(eth => eth.signEIP712HashedMessage(this.path!, domainSeparatorHex, hashStructMessageHex));
    sig.r = sigComponentToHex(sig.r);
    sig.s = sigComponentToHex(sig.s);
    return joinSignature(sig);
  }

  private async resolveTransaction(unsignedTx: string): Promise<LedgerTransactionResolution | null> {
    try {
      return await withTimeout(
        this._retry(eth => ledgerService.resolveTransaction(unsignedTx, eth.loadConfig, LEDGER_TRANSACTION_RESOLUTION_CONFIG)),
        LEDGER_TRANSACTION_RESOLUTION_TIMEOUT_MS,
        'Ledger: transaction resolution timeout'
      );
    } catch (error) {
      logger.warn('[LedgerSigner]: Transaction resolution failed, falling back to blind signing', {
        message: ensureError(error).message,
      });
      return null;
    }
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    const tx = await resolveProperties(transaction);
    const baseTx: UnsignedTransaction = {
      chainId: tx.chainId || undefined,
      data: tx.data || undefined,
      gasLimit: tx.gasLimit || undefined,
      gasPrice: tx.gasPrice || undefined,
      // only add these fields if they are defined ( network supports EIP-1559)
      ...(tx.maxFeePerGas && { maxFeePerGas: tx.maxFeePerGas }),
      ...(!!tx.maxPriorityFeePerGas && {
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      }),
      nonce: tx.nonce ? BigNumber.from(tx.nonce).toNumber() : undefined,
      to: tx.to || undefined,
      type: tx.type || undefined,
      value: tx.value || undefined,
    };
    const unsignedTx = serialize(baseTx).substring(2);

    const resolution = await this.resolveTransaction(unsignedTx);
    const sig = await this._retry(eth => eth.signTransaction(this.path!, unsignedTx, resolution));
    return serialize(baseTx, {
      r: sigComponentToHex(sig.r),
      s: sigComponentToHex(sig.s),
      v: BigNumber.from(sigComponentToHex(sig.v)).toNumber(),
    });
  }

  connect(provider: Provider): Signer {
    return new LedgerSigner(provider, this.path!, this.deviceId!);
  }
}
