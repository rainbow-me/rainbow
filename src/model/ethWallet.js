import ethers from 'ethers';
import * as Keychain from './keychain';

const seedPhraseKey = 'seedPhrase';
const privateKeyKey = 'privateKey';
const addressKey = 'addressKey';

export function generateSeedPhrase() {
    return ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
}

export async function init(seedPhrase = generateSeedPhrase()) {
    let wallet = await loadWallet();
    if (!wallet) {
        wallet = await createWallet();
    }
}

export async function createWallet(seedPhrase = generateSeedPhrase()) {
    const wallet = ethers.Wallet.fromMnemonic(seedPhrase);
    wallet.provider = ethers.providers.getDefaultProvider();

    saveSeedPhrase(seedPhrase);
    savePrivateKey(wallet.privateKey);

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

export async function saveSeedPhrase(seedPhrase) {
    await Keychain.saveString(seedPhraseKey, seedPhrase);
}

export async function loadSeedPhrase() {
    const seedPhrase = await Keychain.loadString(seedPhraseKey);
    return seedPhrase;
}

export async function savePrivateKey(privateKey) {
    await Keychain.saveString(privateKeyKey, privateKey);
}

export async function loadPrivateKey() {
    const privateKey = await Keychain.loadString(privateKeyKey);
    return privateKey;
}

export async function saveAddress(address) {
    await Keychain.saveString(addressKey, address);
}

export async function loadAddress() {
    const privateKey = await Keychain.loadString(addressKey);
    return privateKey;
}
