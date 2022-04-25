import AsyncStorage from '@react-native-community/async-storage';

const POST_REINSTALL_INTEGRITY_CHECK = 'postReinstallIntegrityCheck';

export const getAllAsyncStorageKeys = () => AsyncStorage.getAllKeys();

export const markKeychainAsRepaired = async () => {
  await AsyncStorage.setItem(POST_REINSTALL_INTEGRITY_CHECK, 'true');
};
