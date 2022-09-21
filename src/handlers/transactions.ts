import { Contract } from '@ethersproject/contracts';
import { isEmpty } from 'lodash';
import { web3Provider } from './web3';
import { metadataClient } from '@/apollo/client';
import { CONTRACT_FUNCTION } from '@/apollo/queries';
import { ZerionTransaction } from '@/entities';
import store from '@/redux/store';
import { transactionSignaturesDataAddNewSignature } from '@/redux/transactionSignatures';
import { SIGNATURE_REGISTRY_ADDRESS, signatureRegistryABI } from '@/references';

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
      const response = await metadataClient.queryWithTimeout(
        {
          query: CONTRACT_FUNCTION,
          variables: {
            chainID: 1,
            hex: bytes,
          },
        },
        800
      );
      if (!isEmpty(response?.data?.contractFunction?.text)) {
        signature = response.data.contractFunction.text;
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
    if (!signature) {
      try {
        const contract = new Contract(
          SIGNATURE_REGISTRY_ADDRESS,
          signatureRegistryABI,
          web3Provider!
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
