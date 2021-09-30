import { Contract } from '@ethersproject/contracts';
import { RainbowFetchClient } from '../rainbow-fetch';
import { web3Provider } from './web3';
import { ZerionTransaction } from '@rainbow-me/entities';
import store from '@rainbow-me/redux/store';
import { transactionSignaturesDataAddNewSignature } from '@rainbow-me/redux/transactionSignatures';
import {
  SIGNATURE_REGISTRY_ADDRESS,
  signatureRegistryABI,
} from '@rainbow-me/references';

const parseSignatureToTitle = (signature: string) => {
  const rawName = signature.match(/^([^)(]*)\((.*)\)([^)(]*)$/u);
  let parsedName = '';

  if (rawName) {
    parsedName =
      rawName[1].charAt(0).toUpperCase() +
      rawName[1]
        .slice(1)
        .split(/(?=[A-Z])/u)
        .join(' ');
  }
  return parsedName;
};

const fourByteApi = new RainbowFetchClient({
  baseURL: 'https://www.4byte.directory/api/v1/signatures',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 800,
});

const timeoutPromise = new Promise((_, reject) => {
  setTimeout(reject, 800);
});

export const getTransactionMethodName = async (
  transaction: ZerionTransaction
) => {
  try {
    const { signatures } = store.getState().transactionSignatures;
    // only being used on mainnet transactions, so we can use the default web3 provider
    const txn = await web3Provider.getTransaction(transaction.hash);
    const bytes = txn?.data?.substring(0, 10) || '';
    let signature = signatures[bytes] || '';
    if (signature) return signature;
    try {
      const response = await fourByteApi.get(`/?hex_signature=${bytes}`);
      const responseData: any = response?.data;
      const bestResult = responseData?.results.sort(
        (a: { id: number }, b: { id: number }) => (a.id < b.id ? -1 : 1)
      )?.[0];
      signature = bestResult.text_signature;
      // eslint-disable-next-line no-empty
    } catch (e) {}
    if (!signature) {
      try {
        const contract = new Contract(
          SIGNATURE_REGISTRY_ADDRESS,
          signatureRegistryABI,
          web3Provider
        );
        signature = await Promise.race([
          contract.entries(bytes),
          timeoutPromise,
        ]);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    const parsedSignature = parseSignatureToTitle(signature);
    store.dispatch(
      transactionSignaturesDataAddNewSignature(parsedSignature, bytes)
    );
    return parsedSignature;
  } catch (e) {
    return '';
  }
};
