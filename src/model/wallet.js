import ethers from 'ethers';
import * as keychain from '../model/keychain';
const seedPhraseKey = 'seedPhrase';
const privateKeyKey = 'privateKey';
const addressKey = 'addressKey';
import { ACCESS_CONTROL, ACCESSIBLE } from 'react-native-keychain';

export function generateSeedPhrase() {
  return ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
}

export const walletInit = async (seedPhrase = null) => {
  let walletAddress = null;
  try {
    //walletAddress = await loadAddress();
    if (!walletAddress) {
      walletAddress = await createWallet(seedPhrase);
    }
    return walletAddress;
  } catch(error) {
    return walletAddress;
  }
};

export const loadWallet = async () => {
  console.log('load wallet');
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
  console.log('send txn');
  const wallet = await loadWallet();
  const transactionHash = await wallet.sendTransaction(transaction);
  return transactionHash;
};

export const loadSeedPhrase = async () => {
  console.log('load seed phrase');
  const authenticationPrompt = 'Please authenticate to view seed phrase';
  const seedPhrase = await keychain.loadString(seedPhraseKey, { authenticationPrompt });
  return seedPhrase;
};

export const loadAddress = async () => {
  console.log('load address');
  const privateKey = await keychain.loadString(addressKey);
  return privateKey;
};

const createWallet = async (seedPhrase) => {
  console.log('create wallet');
  seedPhrase = seedPhrase || generateSeedPhrase(); 
  const wallet = ethers.Wallet.fromMnemonic(seedPhrase);
  wallet.provider = ethers.providers.getDefaultProvider();
  saveSeedPhrase(seedPhrase);
  savePrivateKey(wallet.privateKey);
  saveAddress(wallet.address);

  console.log(`Wallet: Generated wallet with public address: ${wallet.address}`);

  return wallet.address;
};

const saveSeedPhrase = async (seedPhrase) => {
  console.log('save seed phrase');
  const accessControlOptions = { accessControl: ACCESS_CONTROL.USER_PRESENCE, accessible: ACCESSIBLE.WHEN_UNLOCKED };
  await keychain.saveString(seedPhraseKey, seedPhrase, accessControlOptions);
};

const savePrivateKey = async (privateKey) => {
  console.log('save private key');
  // TODO add accessControlOptions
  await keychain.saveString(privateKeyKey, privateKey);
};

const loadPrivateKey = async () => {
  console.log('load private key');
  const privateKey = await keychain.loadString(privateKeyKey);
  return privateKey;
};

const saveAddress = async (address) => {
  console.log('save address');
  await keychain.saveString(addressKey, address);
};
