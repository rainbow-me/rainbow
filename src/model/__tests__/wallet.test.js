import { loadAddress, walletInit, __RewireAPI__ as WalletRewireAPI } from '../wallet';

test('import good seed phrase', async () => {
  const goodSeedPhrase = "there night cash clap pottery cereal silly silent hybrid hour visual hurry";
  const expectedAddress = "0x41f99409865FB23b833C1cD40C1c03BDd3E2C575";
  const { isWalletBrandNew, walletAddress } = await walletInit(goodSeedPhrase);
  expect(isWalletBrandNew).toBeTruthy();
  expect(walletAddress).toBe(expectedAddress);
});

test('import bad seed phrase should return null', async () => {
  const badSeedPhrase = "merp merp merp";
  const { isWalletBrandNew, walletAddress } = await walletInit(badSeedPhrase);
  expect(isWalletBrandNew).toBeFalsy();
  expect(walletAddress).toBeNull();
});

test('create a new wallet', async () => {
  WalletRewireAPI.__Rewire__('loadAddress', () => null);
  WalletRewireAPI.__Rewire__('createWallet', () => "hello");
  const { isWalletBrandNew, walletAddress } = await walletInit();
  expect(isWalletBrandNew).toBeTruthy();
  expect(walletAddress).toBe("hello");
  WalletRewireAPI.__ResetDependency__('loadAddress');
  WalletRewireAPI.__ResetDependency__('createWallet');
});

test('load existing wallet', async () => {
  WalletRewireAPI.__Rewire__('loadAddress', () => "hello");
  const { isWalletBrandNew, walletAddress } = await walletInit();
  expect(isWalletBrandNew).toBeFalsy();
  expect(walletAddress).toBe("hello");
  WalletRewireAPI.__ResetDependency__('loadAddress');
});
