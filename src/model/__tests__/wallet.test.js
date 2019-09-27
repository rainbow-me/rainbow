import { walletInit, __RewireAPI__ as WalletRewireAPI } from '../wallet';

xit('import good seed phrase', async () => {
  const goodSeedPhrase =
    'there night cash clap pottery cereal silly silent hybrid hour visual hurry';
  const expectedAddress = '0x41f99409865FB23b833C1cD40C1c03BDd3E2C575';
  const { isImported, isNew, walletAddress } = await walletInit(goodSeedPhrase);
  expect(isImported).toBeTruthy();
  expect(isNew).toBeFalsy();
  expect(walletAddress).toBe(expectedAddress);
});

xit('import bad seed phrase should return null', async () => {
  const badSeedPhrase = 'merp merp merp';
  const { isImported, isNew, walletAddress } = await walletInit(badSeedPhrase);
  expect(isImported).toBeFalsy();
  expect(isNew).toBeFalsy();
  expect(walletAddress).toBeNull();
});

xit('create a new wallet', async () => {
  WalletRewireAPI.__Rewire__('loadAddress', () => null);
  WalletRewireAPI.__Rewire__('createWallet', () => 'hello');
  const { isImported, isNew, walletAddress } = await walletInit();
  expect(isImported).toBeFalsy();
  expect(isNew).toBeTruthy();
  expect(walletAddress).toBe('hello');
  WalletRewireAPI.__ResetDependency__('loadAddress');
  WalletRewireAPI.__ResetDependency__('createWallet');
});

xit('load existing wallet', async () => {
  WalletRewireAPI.__Rewire__('loadAddress', () => 'hello');
  const { isImported, isNew, walletAddress } = await walletInit();
  expect(isImported).toBeFalsy();
  expect(isNew).toBeFalsy();
  expect(walletAddress).toBe('hello');
  WalletRewireAPI.__ResetDependency__('loadAddress');
});
