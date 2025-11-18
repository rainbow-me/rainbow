'use strict';

import AppEth, { ledgerService } from '@ledgerhq/hw-app-eth';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';
import { Signer } from '@ethersproject/abstract-signer';
import { Provider, TransactionRequest } from '@ethersproject/abstract-provider';
import { BigNumber } from '@ethersproject/bignumber';
import { getAddress, Hex, serializeTransaction, signatureToHex, stringToBytes, toHex, type TransactionSerializable } from 'viem';
import { logger, RainbowError } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { getEthApp } from '@/utils/ledger';

function waiter(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}

// Helper to resolve all promise properties in an object
async function resolveProperties<T>(object: T): Promise<T> {
  const promises = Object.keys(object as any).map(async key => {
    const value = (object as any)[key];
    return { key, value: await value };
  });
  const resolved = await Promise.all(promises);
  const result = { ...object };
  resolved.forEach(({ key, value }) => {
    (result as any)[key] = value;
  });
  return result;
}

export class LedgerSigner extends Signer {
  readonly path: string | undefined;
  readonly privateKey: null | undefined;
  readonly deviceId: string | undefined;
  readonly isLedger: boolean | undefined;

  readonly _eth: Promise<AppEth> | undefined;

  constructor(provider: Provider, path: string, deviceId: string) {
    super();

    Object.defineProperty(this, 'isLedger', { value: true, writable: false });
    Object.defineProperty(this, 'privateKey', { value: null, writable: false });
    Object.defineProperty(this, 'path', { value: path, writable: false });
    Object.defineProperty(this, 'deviceId', { value: deviceId, writable: false });
    Object.defineProperty(this, 'provider', { value: provider || null, writable: false });
    Object.defineProperty(this, '_eth', {
      value: getEthApp(deviceId).then(
        ethApp => {
          return ethApp;
        },
        error => {
          return Promise.reject(error);
        }
      ),
      writable: false,
    });
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

  async signMessage(message: Hex | string): Promise<string> {
    if (typeof message === 'string') {
      message = toHex(stringToBytes(message));
    }

    const messageHex = message.substring(2);

    const sig = await this._retry(eth => eth.signPersonalMessage(this.path!, messageHex));
    return signatureToHex({
      r: ('0x' + sig.r) as Hex,
      s: ('0x' + sig.s) as Hex,
      v: BigInt(sig.v),
    });
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
    return signatureToHex({
      r: ('0x' + sig.r) as Hex,
      s: ('0x' + sig.s) as Hex,
      v: BigInt(sig.v),
    });
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    const tx = await resolveProperties(transaction);
    const isEIP1559 = tx.maxFeePerGas || tx.maxPriorityFeePerGas;
    const baseTx = {
      ...(tx.chainId && { chainId: Number(tx.chainId) }),
      ...(tx.data && { data: tx.data as Hex }),
      ...(tx.gasLimit && { gas: BigInt(tx.gasLimit.toString()) }),
      // Legacy transactions use gasPrice, EIP-1559 use maxFeePerGas/maxPriorityFeePerGas
      ...(!isEIP1559 && tx.gasPrice && { gasPrice: BigInt(tx.gasPrice.toString()) }),
      ...(tx.maxFeePerGas && { maxFeePerGas: BigInt(tx.maxFeePerGas.toString()) }),
      ...(tx.maxPriorityFeePerGas && {
        maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas.toString()),
      }),
      ...(tx.nonce && { nonce: BigNumber.from(tx.nonce).toNumber() }),
      ...(tx.to && { to: tx.to as Hex }),
      ...(isEIP1559 && { type: 'eip1559' as const }),
      ...(tx.value && { value: BigInt(tx.value.toString()) }),
    } as TransactionSerializable;
    const unsignedTx = serializeTransaction(baseTx).substring(2);

    const resolution = await this._retry(eth =>
      ledgerService.resolveTransaction(unsignedTx, eth.loadConfig, {
        erc20: true,
        externalPlugins: true,
        nft: true,
      })
    );
    const sig = await this._retry(eth => eth.signTransaction(this.path!, unsignedTx, resolution));
    return serializeTransaction(baseTx, {
      r: ('0x' + sig.r) as Hex,
      s: ('0x' + sig.s) as Hex,
      v: BigInt(BigNumber.from('0x' + sig.v).toNumber()),
    });
  }

  connect(provider: Provider): Signer {
    return new LedgerSigner(provider, this.path!, this.deviceId!);
  }
}
