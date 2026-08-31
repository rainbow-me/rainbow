import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';

import { LedgerSigner } from '@/features/hardware-wallet/utils/LedgerSigner';
import { isHardwareWalletKey } from '@/features/wallet/core/hardwareWalletKey';
import { loadPrivateKey } from '@/features/wallet/data/walletKeychain';
import { EncryptionType, type RainbowWallet } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { getWalletWithAccount, setWalletDamaged } from '@/state/wallets/walletsStore';

import { loadWallet } from './loadWallet';

jest.mock('@ethersproject/wallet', () => ({ Wallet: jest.fn() }));
jest.mock('@/features/hardware-wallet/utils/LedgerSigner', () => ({ LedgerSigner: jest.fn() }));
jest.mock('@/features/wallet/core/hardwareWalletKey', () => ({ isHardwareWalletKey: jest.fn() }));
jest.mock('@/features/wallet/data/walletKeychain', () => ({
  loadAddress: jest.fn(),
  loadPrivateKey: jest.fn(),
}));
jest.mock('@/navigation/Navigation', () => ({
  __esModule: true,
  default: { handleAction: jest.fn() },
}));
jest.mock('@/navigation/routesNames', () => ({
  __esModule: true,
  default: { WALLET_ERROR_SHEET: 'WalletErrorSheet' },
}));
jest.mock('@/state/wallets/walletsStore', () => ({
  getWalletWithAccount: jest.fn(),
  setWalletDamaged: jest.fn(),
}));

const ADDRESS = '0x0000000000000000000000000000000000000001';
const HARDWARE_WALLET: RainbowWallet = {
  addresses: [
    {
      address: ADDRESS,
      avatar: null,
      color: 0,
      index: 0,
      label: 'Main',
      visible: true,
    },
  ],
  color: 0,
  encryptionType: EncryptionType.none,
  id: 'hardware-wallet',
  imported: false,
  name: 'Ledger',
  primary: true,
  type: EthereumWalletType.bluetooth,
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('rejects malformed hardware metadata without constructing a software wallet', async () => {
  jest.mocked(getWalletWithAccount).mockReturnValue(HARDWARE_WALLET);
  jest.mocked(loadPrivateKey).mockResolvedValue('device-id/account');
  jest.mocked(isHardwareWalletKey).mockReturnValue(false);

  await expect(loadWallet({ address: ADDRESS, provider: new StaticJsonRpcProvider() })).resolves.toBeNull();
  expect(Wallet).not.toHaveBeenCalled();
  expect(LedgerSigner).not.toHaveBeenCalled();
  expect(setWalletDamaged).toHaveBeenCalledWith(HARDWARE_WALLET.id, false);
  expect(Navigation.handleAction).toHaveBeenCalledWith(Routes.WALLET_ERROR_SHEET);
});
