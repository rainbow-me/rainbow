import lightwallet from 'eth-lightwallet';
import ethers from 'ethers';
import * as Keychain from './keychain';

const keystoreKeychainKey = 'keystoreKeychainKey';
const vaultPassword = 'hard coding passwords is bad mmmmkay';

let ethKeystore = null;

/*
 * Public Functions
 */

// Loads from Keychain or creates a new one, must be called first
export async function init() {
    console.log('Trying to load keystore from keychain');
    let keystore = await loadKeystoreFromKeychain();
    if (!keystore) {
        keystore = await createKeystore();
        await saveKeystoreToKeychain(keystore);
        console.log('No keystore in keychain, created one and saved it');
    }
    ethKeystore = keystore;
}

export async function generateNextAddress(keystore = ethKeystore) {
    const derivedKey = await getDerivedKey();
    keystore.generateNewAddress(derivedKey);
    const publicAddresses = getPublicAddresses();
    // Return last public address
    return publicAddresses[-1];
}

export function getPublicAddresses(keystore = ethKeystore) {
    return keystore.getAddresses();
}

export async function getSeedPhrase(keystore = ethKeystore) {
    const derivedKey = await getDerivedKey();
    return keystore.getSeed(derivedKey);
}

export async function getPrivateKey(publicAddress, keystore = ethKeystore) {
    const derivedKey = await getDerivedKey();
    return keystore.exportPrivateKey(publicAddress, derivedKey);
}

export async function getEthBalance(publicAddress, keystore = ethKeystore) {
    const privateKey = await getPrivateKey(publicAddress, keystore);
    const wallet = new ethers.Wallet(`0x${privateKey}`, ethers.providers.getDefaultProvider());
    const weiBalance = await wallet.provider.getBalance(wallet.address);
    return ethers.utils.formatEther(weiBalance);
}

/*
 * Private Functions
 */

// Derived key is needed for various keystore functions
function getDerivedKey(password = vaultPassword, keystore = ethKeystore) {
    return new Promise((resolve, reject) => {
        keystore.keyFromPassword(password, (err, derivedKey) => {
            if (err) {
                reject(err);
            }
            resolve(derivedKey);
        });
    });
}

function generateSeedPhrase() {
    return lightwallet.keystore.generateRandomSeed();
}

async function saveKeystoreToKeychain(keystore = ethKeystore) {
    const jsonString = keystore.serialize();
    await Keychain.saveString(keystoreKeychainKey, jsonString);
}

async function loadKeystoreFromKeychain() {
    const jsonString = await Keychain.loadString(keystoreKeychainKey);
    if (jsonString) {
        return lightwallet.keystore.deserialize(jsonString);
    }
    return null;
}

function createKeystore(seedPhrase = generateSeedPhrase(), password = vaultPassword) {
    return new Promise((resolve, reject) => {
        lightwallet.keystore.createVault(
            {
                password,
                seedPhrase,
                hdPathString: "m/44'/60'/0'/0",
            },
            (vaultErr, ks) => {
                console.log('inside createVault completion handler');
                if (vaultErr) {
                    console.log(`vaultErr: ${vaultErr}`);
                    reject(vaultErr);
                }

                console.log(`keystore: ${ks}`);

                // Some methods will require providing the `pwDerivedKey`,
                // Allowing you to only decrypt private keys on an as-needed basis.
                // You can generate that value with this convenient method:
                const keystore = ks;
                keystore.keyFromPassword(password, (keyErr, pwDerivedKey) => {
                    if (keyErr) {
                        reject(keyErr);
                    }

                    keystore.generateNewAddress(pwDerivedKey, 1);
                    keystore.passwordProvider = (callback) => {
                        callback(null, password);
                    };

                    resolve(keystore);
                });
            },
        );
    });
}
