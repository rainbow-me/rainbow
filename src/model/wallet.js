import ethers from 'ethers';
import * as keychain from '../model/keychain';
const seedPhraseKey = 'seedPhrase';
const privateKeyKey = 'privateKey';
const addressKey = 'addressKey';

export function generateSeedPhrase() {
  return ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
}

export const walletInit = async (seedPhrase = null) => {
  let wallet = null;
  try {
    wallet = await loadWallet();
    if (!wallet) {
      wallet = await createWallet(seedPhrase);
    }
    return wallet;
  } catch(error) {
    return wallet;
  }
};

export const loadWallet = async () => {
  const privateKey = await loadPrivateKey();
  if (privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    wallet.provider = ethers.providers.getDefaultProvider();
    console.log(`Wallet: successfully loaded existing wallet with public address: ${wallet.address}`);
    return wallet;
  }
  console.log("Wallet: failed to load existing wallet because the private key doesn't exist");
  return null;
};

export const createTransaction = async (to, data, value, gasLimit, gasPrice, nonce = null) => {
  return {
    to,
    data,
    value: ethers.utils.parseEther(value),
    gasLimit,
    gasPrice,
    nonce,
  };
};

export const sendTransaction = async (transaction) => {
  const wallet = await loadWallet();
  const transactionHash = await wallet.sendTransaction(transaction);
  return transactionHash;
};

export const loadSeedPhrase = async () => {
  const seedPhrase = await keychain.loadString(seedPhraseKey);
  return seedPhrase;
};

const createWallet = async (seedPhrase) => {
  const wallet = ethers.Wallet.fromMnemonic(seedPhrase || generateSeedPhrase());
  wallet.provider = ethers.providers.getDefaultProvider();
  saveSeedPhrase(seedPhrase);
  savePrivateKey(wallet.privateKey);
  saveAddress(wallet.address);

  console.log(`Wallet: Generated wallet with public address: ${wallet.address}`);

  return wallet;
};

const saveSeedPhrase = async (seedPhrase) => {
  await keychain.saveString(seedPhraseKey, seedPhrase);
};

const savePrivateKey = async (privateKey) => {
  await keychain.saveString(privateKeyKey, privateKey);
};

const loadPrivateKey = async () => {
  const privateKey = await keychain.loadString(privateKeyKey);
  return privateKey;
};

const saveAddress = async (address) => {
  await keychain.saveString(addressKey, address);
};

const loadAddress = async () => {
  const privateKey = await keychain.loadString(addressKey);
  return privateKey;
};

