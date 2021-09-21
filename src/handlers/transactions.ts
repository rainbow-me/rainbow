import { Contract } from '@ethersproject/contracts';
import { web3Provider } from './web3';
import { ZerionTransaction } from '@rainbow-me/entities';

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
export const getTransacionMethodName = async (
  transaction: ZerionTransaction
) => {
  const tx = await web3Provider.getTransaction(transaction.hash);
  const contract = new Contract(
    '0x44691B39d1a75dC4E0A0346CBB15E310e6ED1E86',
    abi,
    web3Provider
  );
  const bytes = tx.data.substring(0, 10);
  const entry = await contract.entries(bytes);
  //   try {
  //     const response = await fourBytes.get(`/?hex_signature=${bytes}`);

  //     console.log('entriessssss', response);
  //   } catch (e) {
  //     console.log('etf', e);
  //   }
  return parse(entry);
};
