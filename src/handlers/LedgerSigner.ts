'use strict';

import AppEth from '@ledgerhq/hw-app-eth';
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble';
import { ethers } from 'ethers';

function waiter(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}

export class LedgerSigner extends ethers.Signer {
  readonly path: string | undefined;
  readonly privateKey: null | undefined;
  readonly deviceId: string | undefined;
  readonly isLedger: boolean | undefined;

  readonly _eth: Promise<AppEth> | undefined;

  constructor(
    provider: ethers.providers.Provider,
    path: string,
    deviceId: string
  ) {
    super();

    ethers.utils.defineReadOnly(this, 'isLedger', true);
    ethers.utils.defineReadOnly(this, 'privateKey', null);
    ethers.utils.defineReadOnly(this, 'path', path);
    ethers.utils.defineReadOnly(this, 'deviceId', deviceId);
    ethers.utils.defineReadOnly(this, 'provider', provider || null);
    ethers.utils.defineReadOnly(
      this,
      '_eth',
      TransportBLE.open(deviceId).then(
        transport => {
          const eth = new AppEth(transport);
          return eth;
        },
        error => {
          return Promise.reject(error);
        }
      )
    );
  }

  _retry<T = any>(
    callback: (eth: AppEth) => Promise<T>,
    timeout?: number
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      if (timeout && timeout > 0) {
        setTimeout(() => {
          reject(new Error('timeout'));
        }, timeout);
      }

      const eth = await this._eth;
      if (!eth) {
        return reject(new Error('no eth'));
      }

      // Wait up to 5 seconds
      for (let i = 0; i < 50; i++) {
        try {
          const result = await callback(eth);
          return resolve(result);
        } catch (error: any) {
          if (error.id !== 'TransportLocked') {
            return reject(error);
          }
        }
        await waiter(100);
      }

      return reject(new Error('timeout'));
    });
  }

  async getAddress(): Promise<string> {
    const account = await this._retry(eth => eth.getAddress(this.path!));
    return ethers.utils.getAddress(account.address);
  }

  async signMessage(message: ethers.utils.Bytes | string): Promise<string> {
    if (typeof message === 'string') {
      message = ethers.utils.toUtf8Bytes(message);
    }

    const messageHex = ethers.utils.hexlify(message).substring(2);

    const sig = await this._retry(eth =>
      eth.signPersonalMessage(this.path!, messageHex)
    );
    sig.r = '0x' + sig.r;
    sig.s = '0x' + sig.s;
    return ethers.utils.joinSignature(sig);
  }

  async signTypedDataMessage(message: any, legacy: boolean): Promise<string> {
    const sig = await this._retry(eth =>
      eth.signEIP712Message(this.path!, message, legacy)
    );
    sig.r = '0x' + sig.r;
    sig.s = '0x' + sig.s;
    return ethers.utils.joinSignature(sig);
  }

  async signTransaction(
    transaction: ethers.providers.TransactionRequest
  ): Promise<string> {
    const tx = await ethers.utils.resolveProperties(transaction);
    const baseTx: ethers.utils.UnsignedTransaction = {
      chainId: tx.chainId || undefined,
      data: tx.data || undefined,
      gasLimit: tx.gasLimit || undefined,
      gasPrice: tx.gasPrice || undefined,
      nonce: tx.nonce ? ethers.BigNumber.from(tx.nonce).toNumber() : undefined,
      to: tx.to || undefined,
      value: tx.value || undefined,
    };

    const unsignedTx = ethers.utils.serializeTransaction(baseTx).substring(2);
    const sig = await this._retry(eth =>
      eth.signTransaction(this.path!, unsignedTx)
    );

    return ethers.utils.serializeTransaction(baseTx, {
      r: '0x' + sig.r,
      s: '0x' + sig.s,
      v: ethers.BigNumber.from('0x' + sig.v).toNumber(),
    });
  }

  connect(provider: ethers.providers.Provider): ethers.Signer {
    return new LedgerSigner(provider, this.path!, this.deviceId!);
  }
}
