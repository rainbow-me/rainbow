'use strict';
import {
  TransactionSerializable,
  hashMessage,
  serializeTransaction,
  toHex,
} from 'viem';
import { toAccount } from 'viem/accounts';
import AppEth, { ledgerService } from '@ledgerhq/hw-app-eth';
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util';
import { logger, RainbowError } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Signature, signatureToHex } from './utils';

export const getLedgerAccount = async (path: string, deviceId: string) => {
  function waiter(duration: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }

  let _eth: AppEth;

  function retry<T = any>(
    callback: (eth: AppEth) => Promise<T>,
    timeout?: number
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      if (timeout && timeout > 0) {
        setTimeout(() => {
          logger.debug(
            'Ledger: Signer timeout',
            {},
            logger.DebugContext.ledger
          );
          return reject(new RainbowError('Ledger: Signer timeout'));
        }, timeout);
      }

      const eth = await _eth;
      if (!eth) {
        logger.debug(
          'Ledger: Eth app not open',
          {},
          logger.DebugContext.ledger
        );
        return reject(new Error('Ledger: Eth app not open'));
      }

      // Wait up to 5 seconds
      for (let i = 0; i < 50; i++) {
        try {
          const result = await callback(eth);
          return resolve(result);
        } catch (error: any) {
          logger.error(new RainbowError('Ledger: Transport error'), error);

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

  async function getAddress() {
    const account = await retry(eth => eth.getAddress(path));
    return account.address as `0x${string}`;
  }

  const ledgerAddress = await getAddress();

  async function ledgerSignMessage(message: string) {
    const messageHex = hashMessage(message).substring(2);

    const sig = await retry(eth => eth.signPersonalMessage(path!, messageHex));

    const viemSig: Signature = {
      r: toHex(sig.r),
      s: toHex(sig.s),
      v: BigInt(sig.v),
    };
    return signatureToHex(viemSig);
  }

  async function ledgerSignTypedDataMessage(data: any, legacy: boolean) {
    const version =
      legacy === false ? SignTypedDataVersion.V4 : SignTypedDataVersion.V3;
    const { domain, types, primaryType, message } = TypedDataUtils.sanitizeData(
      data
    );

    const domainSeparatorHex = TypedDataUtils.hashStruct(
      'EIP712Domain',
      domain,
      types,
      version
    ).toString('hex');

    const hashStructMessageHex = TypedDataUtils.hashStruct(
      // @ts-ignore
      primaryType,
      message,
      types,
      version
    ).toString('hex');

    const sig = await retry(eth =>
      eth.signEIP712HashedMessage(
        path,
        domainSeparatorHex,
        hashStructMessageHex
      )
    );
    const viemSig: Signature = {
      r: toHex(sig.r),
      s: toHex(sig.s),
      v: BigInt(sig.v),
    };
    return signatureToHex(viemSig);
  }

  async function ledgerSignTransaction(transaction: TransactionSerializable) {
    const tx = transaction;
    const baseTx = {
      chainId: tx.chainId || 1,
      data: tx.data || undefined,
      //   gasLimit: tx.gasLimit || undefined,
      //   gasPrice: tx.gasPrice || undefined,
      //   // only add these fields if they are defined ( network supports EIP-1559)
      //   ...(tx.maxFeePerGas && { maxFeePerGas: tx.maxFeePerGas }),
      //   ...(!!tx.maxPriorityFeePerGas && {
      //     maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      //   }),
      nonce: tx.nonce ? tx.nonce : undefined,
      to: tx.to || undefined,
      type: tx.type || undefined,
      value: tx.value || undefined,
    };
    const unsignedTx = serializeTransaction(baseTx).substring(2);

    const resolution = await retry(eth =>
      ledgerService.resolveTransaction(unsignedTx, eth.loadConfig, {
        erc20: true,
        externalPlugins: true,
        nft: true,
      })
    );
    const sig = await retry(eth =>
      eth.signTransaction(path!, unsignedTx, resolution)
    );

    const viemSig: Signature = {
      r: toHex(sig.r),
      s: toHex(sig.s),
      v: BigInt(sig.v),
    };
    return serializeTransaction(baseTx, viemSig);
  }

  const account = toAccount({
    address: ledgerAddress,
    async signMessage({ message }) {
      return ledgerSignMessage(message);
    },
    async signTransaction(transaction) {
      return ledgerSignTransaction(transaction);
    },
    async signTypedData(typedData) {
      return ledgerSignTypedDataMessage(typedData, false);
    },
  });
  return account;
};
