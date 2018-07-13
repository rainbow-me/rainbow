import ethers from 'ethers';
import * as keychain from '../model/keychain';
import { accountUpdateAccountAddress } from 'balance-common';
const seedPhraseKey = 'seedPhrase';
const privateKeyKey = 'privateKey';
const addressKey = 'addressKey';

// -- Constants --------------------------------------- //
const WALLET_LOAD_REQUEST = 'wallet/WALLET_LOAD_REQUEST';
const WALLET_LOAD_SUCCESS = 'wallet/WALLET_LOAD_SUCCESS';
const WALLET_LOAD_FAILURE = 'wallet/WALLET_LOAD_FAILURE';

const WALLET_CREATE_REQUEST = 'wallet/WALLET_CREATE_REQUEST';
const WALLET_CREATE_SUCCESS = 'wallet/WALLET_CREATE_SUCCESS';
const WALLET_CREATE_FAILURE = 'wallet/WALLET_CREATE_FAILURE';


export function generateSeedPhrase() {
  return ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
}

export const walletInit = (seedPhrase = generateSeedPhrase()) => (dispatch, getState) => {
  const totalState = getState();
  dispatch({ type: WALLET_LOAD_REQUEST });
  loadWallet().then(wallet => {
    if (wallet) {
      dispatch({ type: WALLET_LOAD_SUCCESS });
      dispatch(accountUpdateAccountAddress(wallet.address, 'BALANCEWALLET'));
    } else {
      dispatch({ type: WALLET_CREATE_REQUEST });
      createWallet().then(newWallet => {
        dispatch({ type: WALLET_CREATE_SUCCESS });
        dispatch(accountUpdateAccountAddress(newWallet.address, 'BALANCEWALLET'));
      })
      .catch(error => {
        dispatch({ type: WALLET_CREATE_FAILURE });
      });
    }})
  .catch(error => {
    dispatch({ type: WALLET_LOAD_FAILURE });
  });
};

export async function createWallet(seedPhrase = generateSeedPhrase()) {
  const wallet = ethers.Wallet.fromMnemonic(seedPhrase);
  wallet.provider = ethers.providers.getDefaultProvider();
  saveSeedPhrase(seedPhrase);
  savePrivateKey(wallet.privateKey);
  saveAddress(wallet.address);

  console.log(`Wallet: Generated wallet with public address: ${wallet.address}`);

  return wallet;
}

export async function loadWallet() {
  const privateKey = await loadPrivateKey();
  if (privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    wallet.provider = ethers.providers.getDefaultProvider();
    console.log(`Wallet: successfully loaded existing wallet with public address: ${wallet.address}`);
    return wallet;
  }
  console.log("Wallet: failed to load existing wallet because the private key doesn't exist");
  return null;
}

export async function createTransaction(to, data, value, gasLimit, gasPrice, nonce = null) {
  return {
    to,
    data,
    value: ethers.utils.parseEther(value),
    gasLimit,
    gasPrice,
    nonce,
  };
}

export async function sendTransaction(transaction) {
  const wallet = await loadWallet();
  const transactionHash = await wallet.sendTransaction(transaction);
  return transactionHash;
}

export async function saveSeedPhrase(seedPhrase) {
  await keychain.saveString(seedPhraseKey, seedPhrase);
}

export async function loadSeedPhrase() {
  const seedPhrase = await keychain.loadString(seedPhraseKey);
  return seedPhrase;
}

export async function savePrivateKey(privateKey) {
  await keychain.saveString(privateKeyKey, privateKey);
}

export async function loadPrivateKey() {
  const privateKey = await keychain.loadString(privateKeyKey);
  return privateKey;
}

export async function saveAddress(address) {
  await keychain.saveString(addressKey, address);
}

export async function loadAddress() {
  const privateKey = await keychain.loadString(addressKey);
  return privateKey;
}

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    default:
      return state;
  }
};
