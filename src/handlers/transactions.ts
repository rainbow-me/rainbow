import { Contract } from '@ethersproject/contracts';
import axios from 'axios';
import {
  getLocalTransactionSignatures,
  saveLocalTransactionSignatures,
} from './localstorage/accountLocal';
import { web3Provider } from './web3';
import { ZerionTransaction } from '@rainbow-me/entities';
import store from '@rainbow-me/redux/store';

interface FourByteResult {
  bytes_signature?: string;
  created_at?: string;
  hex_signature?: string;
  id: number;
  text_signature?: string;
}

const REGISTRY_ADDRESS = '0x44691B39d1a75dC4E0A0346CBB15E310e6ED1E86';
const abi = [
  {
    constant: false,
    inputs: [{ name: '_new', type: 'address' }],
    name: 'setOwner',
    outputs: [],
    payable: false,
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSignatures',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    payable: false,
    type: 'function',
  },
  {
    constant: false,
    inputs: [],
    name: 'drain',
    outputs: [],
    payable: false,
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '', type: 'bytes4' }],
    name: 'entries',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    type: 'function',
  },
  {
    constant: false,
    inputs: [{ name: '_method', type: 'string' }],
    name: 'register',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    type: 'function',
  },
  { inputs: [], type: 'constructor' },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: true, name: 'signature', type: 'bytes4' },
      { indexed: false, name: 'method', type: 'string' },
    ],
    name: 'Registered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'old', type: 'address' },
      { indexed: true, name: 'current', type: 'address' },
    ],
    name: 'NewOwner',
    type: 'event',
  },
];
const parse = (signature: string) => {
  const rawName = signature.match(/^([^)(]*)\((.*)\)([^)(]*)$/u);
  let parsedName;

  if (rawName) {
    parsedName =
      rawName[1].charAt(0).toUpperCase() +
      rawName[1]
        .slice(1)
        .split(/(?=[A-Z])/u)
        .join(' ');
  } else {
    parsedName = '';
  }
  return parsedName;
};

const fourByteApi = axios.create({
  baseURL: 'https://www.4byte.directory/api/v1/signatures',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 1000,
});

export const getTransactionMethodName = async (
  transaction: ZerionTransaction
) => {
  const { transactionSignatures } = store.getState().data;
  // only being used on mainnet ransactions, so we can use the default web3 provider
  const txn = await web3Provider.getTransaction(transaction.hash);
  const bytes = txn?.data?.substring(0, 10) || '';
  let signature = transactionSignatures[bytes];
  if (signature) return signature;
  try {
    const { data } = await fourByteApi.get(`/?hex_signature=${bytes}`);
    const bestResult = data.results.reduce(
      (a: FourByteResult, b: FourByteResult) => (a.id < b.id ? a : b)
    );
    signature = bestResult.text_signature;
    // eslint-disable-next-line no-empty
  } catch (e) {}
  if (!signature) {
    try {
      const contract = new Contract(REGISTRY_ADDRESS, abi, web3Provider);
      signature = await contract.entries(bytes);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
  const parsedSignature = parse(signature);
  if (parsedSignature) {
    const newTransactionSignatures = {
      ...transactionSignatures,
      [bytes]: parsedSignature,
    };
    saveLocalTransactionSignatures(newTransactionSignatures);
  }
  return parsedSignature;
};
