import { AllRainbowWallets } from '@/model/wallet';

export default function doesWalletsContainAddress({ address, wallets }: { address: string; wallets: AllRainbowWallets }) {
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < Object.keys(wallets).length; i++) {
    const key = Object.keys(wallets)[i];
    const someWallet = wallets[key];
    const found = someWallet.addresses.find((account: any) => account.visible && account.address !== address);

    if (found) {
      return { key, wallet: found };
    }
  }
  return undefined;
}
