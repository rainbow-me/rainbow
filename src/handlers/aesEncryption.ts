import { NativeModules } from 'react-native';
const AesEncryption = NativeModules.Aes;

export default class AesEncryptor {
  generateSalt(byteCount = 32) {
    const view = new Uint8Array(byteCount);
    // @ts-ignore
    global.crypto.getRandomValues(view);
    // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
    const b64encoded = btoa(String.fromCharCode.apply(null, view));
    return b64encoded;
  }

  generateKey = (password: any, salt: any) =>
    android ? AesEncryption.pbkdf2(password, salt, 5000, 256) : AesEncryption.pbkdf2(password, salt);

  keyFromPassword = (password: any, salt: any) => this.generateKey(password, salt);

  encryptWithKey = (text: any, keyBase64: any) => {
    const ivBase64 = this.generateSalt(32);
    return AesEncryption.encrypt(text, keyBase64, ivBase64).then((cipher: any) => ({
      cipher,
      iv: ivBase64,
    }));
  };

  decryptWithKey = (encryptedData: any, key: any) => AesEncryption.decrypt(encryptedData.cipher, key, encryptedData.iv);

  encrypt = async (password: any, string: any) => {
    try {
      const salt = this.generateSalt(16);
      const key = await this.keyFromPassword(password, salt);
      const result = await this.encryptWithKey(string, key);
      result.salt = salt;
      return JSON.stringify(result);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  };

  decrypt = async (password: any, encryptedString: any) => {
    try {
      const encryptedData = JSON.parse(encryptedString);
      const key = await this.keyFromPassword(password, encryptedData.salt);
      const data = await this.decryptWithKey(encryptedData, key);
      return data;
      // eslint-disable-next-line no-empty
    } catch (e) {}
  };
}
