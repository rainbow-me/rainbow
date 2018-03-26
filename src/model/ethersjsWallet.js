// NOTE: Not using now until it properly supports HD wallets

import ethers from 'ethers';
import * as Keychain from './keychain';

const seedPhraseKey = 'seedPhrase';
const privateKeyKey = 'privateKey';

export function generateSeedPhrase() {
    return ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
}

export async function createEthHDNode(seedPhrase = generateSeedPhrase()) {
    // const masterNode = ethers.HDNode.fromMnemonic(seedPhrase);
    // const standardEthereumNode = masterNode.derivePath("m/44'/60'/0'/0/0");
    // for (let i = 0; i <= 2; i++) {
    //     for (let d = 0; d <= 2; d++) {
    //         masterNode.index = i;
    //         masterNode.depth = d;
    //         // console.log(`[${i},${d}] chainCode: ${standardEthereumNode.chainCode}`);
    //         console.log(`[${i},${d}] publicKey: ${masterNode.publicKey}`);
    //         console.log(`[${i},${d}] privateKey: ${masterNode.privateKey}`);
    //         console.log(' ');
    //     }
    // }

    const wallet = ethers.Wallet.fromMnemonic(seedPhrase);
    wallet.provider = ethers.providers.getDefaultProvider();
    console.log(`Wallet: Generated wallet with public address: ${wallet.address}`);

    wallet.provider.getBalance(wallet.address).then((balance) => {
        // balance is a BigNumber (in wei); format is as a sting (in ether)
        const etherString = ethers.utils.formatEther(balance);
        console.log(`Balance: ${etherString}`);
    });
}

export async function createWallet(seedPhrase = generateSeedPhrase()) {
    const wallet = ethers.Wallet.fromMnemonic(seedPhrase);
    wallet.provider = ethers.providers.getDefaultProvider();

    await Keychain.saveString(seedPhraseKey, seedPhrase);
    await Keychain.saveString(privateKeyKey, wallet.privateKey);

    console.log(`Wallet: Generated wallet with public address: ${wallet.address}`);
    return wallet;
}

export async function loadWallet() {
    const privateKey = await loadPrivateKey();
    if (privateKey) {
        const wallet = new ethers.Wallet(privateKey);
        wallet.provider = ethers.providers.getDefaultProvider();
        console.log('Wallet: successfully loaded existing wallet');
        return wallet;
    }
    console.log("Wallet: failed to load existing wallet because the private key doesn't exist");
    return null;
}

export async function loadSeedPhrase() {
    const seedPhrase = await Keychain.loadString(seedPhraseKey);
    return seedPhrase;
}

export async function loadPrivateKey() {
    const privateKey = await Keychain.loadString(privateKeyKey);
    return privateKey;
}
