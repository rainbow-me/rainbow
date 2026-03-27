import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { RPCMethod, type RPCPayload } from '../types';
import { getAddress, isAddress } from '@ethersproject/address';
import { isHexString } from '@ethersproject/bytes';
import { toUtf8String } from '@ethersproject/strings';
import { buildApprovedNamespaces } from '@walletconnect/utils';

const T = i18n.l.walletconnect;

export const SUPPORTED_SESSION_EVENTS = ['chainChanged', 'accountsChanged'];

export const SUPPORTED_SIGNING_METHODS = [
  RPCMethod.Sign,
  RPCMethod.PersonalSign,
  RPCMethod.SignTypedData,
  RPCMethod.SignTypedDataV1,
  RPCMethod.SignTypedDataV3,
  RPCMethod.SignTypedDataV4,
];

export const SUPPORTED_TRANSACTION_METHODS = [RPCMethod.SendTransaction];

/**
 * For RPC requests that have [address, message] tuples (order may change),
 * return { address, message } and JSON.parse the value if it's from a typed
 * data request
 */
export function parseRPCParams({ method, params }: RPCPayload): {
  address?: string;
  message?: string;
} {
  switch (method) {
    case RPCMethod.PersonalSign: {
      const [address, message] = params.sort(a => (isAddress(a) ? -1 : 1));
      const isHex = isHexString(message);

      let decodedMessage = message;
      try {
        if (isHex) {
          decodedMessage = toUtf8String(message);
        }
      } catch (err) {
        logger.debug(
          `[walletConnect]: parsing RPC params unable to decode hex message to UTF8 string`,
          {},
          logger.DebugContext.walletconnect
        );
      }

      return {
        address: getAddress(address),
        message: decodedMessage,
      };
    }
    /**
     * @see https://eips.ethereum.org/EIPS/eip-712#specification-of-the-eth_signtypeddata-json-rpc
     * @see https://docs.metamask.io/guide/signing-data.html#a-brief-history
     */
    case RPCMethod.SignTypedData:
    case RPCMethod.SignTypedDataV1:
    case RPCMethod.SignTypedDataV3:
    case RPCMethod.SignTypedDataV4: {
      const [address, message] = params;

      return {
        address: getAddress(address),
        message: JSON.parse(message),
      };
    }
    case RPCMethod.SendTransaction: {
      const [tx] = params;
      return {
        address: getAddress(tx.from),
      };
    }
    default:
      return {};
  }
}

/**
 * Better signature for this type of function
 *
 * @see https://docs.walletconnect.com/2.0/web/walletKit/wallet-usage#-namespaces-builder-util
 */
export function getApprovedNamespaces(props: Parameters<typeof buildApprovedNamespaces>[0]):
  | {
      success: true;
      result: ReturnType<typeof buildApprovedNamespaces>;
      error: undefined;
    }
  | {
      success: false;
      result: undefined;
      error: Error;
    } {
  try {
    const namespaces = buildApprovedNamespaces(props);

    if (!namespaces.eip155.accounts.length) {
      return {
        success: false,
        result: undefined,
        error: new Error(i18n.t(T.errors.no_accounts_found)),
      };
    }

    return {
      success: true,
      result: namespaces,
      error: undefined,
    };
  } catch (e: any) {
    logger.error(new RainbowError(`[walletConnect]: buildApprovedNamespaces threw an error`), {
      message: e.toString(),
    });

    return {
      success: false,
      result: undefined,
      error: e,
    };
  }
}

export function isSupportedSigningMethod(method: RPCMethod) {
  return SUPPORTED_SIGNING_METHODS.includes(method);
}

export function isSupportedTransactionMethod(method: RPCMethod) {
  return SUPPORTED_TRANSACTION_METHODS.includes(method);
}

export function isSupportedMethod(method: RPCMethod) {
  return isSupportedSigningMethod(method) || isSupportedTransactionMethod(method);
}
