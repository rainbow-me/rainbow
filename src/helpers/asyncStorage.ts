import AsyncStorage from '@react-native-community/async-storage';
import { WALLET_BALANCES } from '@rainbow-me/handlers/localstorage/walletBalances';

const POST_REINSTALL_INTEGRITY_CHECK = 'postReinstallIntegrityCheck';

export const markKeychainAsRepaired = async () => {
  await AsyncStorage.setItem(POST_REINSTALL_INTEGRITY_CHECK, 'true');
};

/**
 * I observed that after installing the app, AsyncStorage often has key
 * __react_native_storage_test present. To avoid running into issues, we will
 * check existence of any key from a list of specific keys. Or, in other words,
 * storage is empty if ALL expected keys are missing.
 */
export const checkIfAsyncStorageIsEmpty = async () => {
  const keys = [WALLET_BALANCES];
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      return false;
    }
  }

  return true;
};
