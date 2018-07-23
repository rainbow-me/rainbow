import { setInternetCredentials, getInternetCredentials, resetInternetCredentials } from 'react-native-keychain';

// NOTE: implement access control for iOS keychain
export async function saveString(key, value, accessControlOptions) {
  try {
    await setInternetCredentials(key, key, value, accessControlOptions);
    console.log(`Keychain: saved string for key: ${key}`);
  } catch (err) {
    console.log(`Keychain: failed to save string for key: ${key} error: ${err}`);
  }
}

export async function loadString(key, authenticationPrompt) {
  try {
    const credentials = await getInternetCredentials(key, authenticationPrompt);
    if (credentials) {
      console.log(`Keychain: loaded string for key: ${key}`);
      return credentials.password;
    }
    console.log(`Keychain: string does not exist for key: ${key}`);
  } catch (err) {
    console.log(`Keychain: failed to load string for key: ${key} error: ${err}`);
  }
  return null;
}

export async function saveObject(key, value) {
  const jsonValue = JSON.stringify(value);
  await saveString(key, jsonValue);
}

export async function loadObject(key) {
  const jsonValue = await loadString(key);
  try {
    const objectValue = JSON.parse(jsonValue);
    console.log(`Keychain: parsed object for key: ${key}`);
    return objectValue;
  } catch (err) {
    console.log(`Keychain: failed to parse object for key: ${key} error: ${err}`);
  }
  return null;
}

export async function remove(key) {
  try {
    await resetInternetCredentials(key);
    console.log(`Keychain: removed value for key: ${key}`);
  } catch (err) {
    console.log(`Keychain: failed to remove value for key: ${key} error: ${err}`);
  }
}
