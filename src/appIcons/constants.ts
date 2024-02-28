import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers';
import { ImageSourcePropType } from 'react-native';
import AppIconFiniliar from '@/assets/appIconFiniliar.png';
import AppIconGoldDoge from '@/assets/appIconGoldDoge.png';
import AppIconRainDoge from '@/assets/appIconRainDoge.png';
import AppIconOg from '@/assets/appIconOg.png';
import AppIconOptimism from '@/assets/appIconOptimism.png';
import AppIconPixel from '@/assets/appIconPixel.png';
import AppIconPooly from '@/assets/appIconPooly.png';
import AppIconSmol from '@/assets/appIconSmol.png';
import AppIconZora from '@/assets/appIconZora.png';
import AppIconZorb from '@/assets/appIconZorb.png';
import AppIconPoolboy from '@/assets/appIconPoolboy.png';
import AppIconAdworld from '@/assets/appIconAdworld.png';
import AppIconFarcaster from '@/assets/appIconFarcaster.png';
import { MMKV } from 'react-native-mmkv';

// optimism app icon unlocking NFTs
const OPTIMISTIC_EXPLORER_NFT_ADDRESS: EthereumAddress = '0x81b30ff521D1fEB67EDE32db726D95714eb00637';

// smol app icon unlocking NFTs
const LEGACY_SMOL_BRAINS_NFT_ADDRESS: EthereumAddress = '0x6325439389e0797ab35752b4f43a14c004f22a9c';
const SMOL_BRAINS_NFT_ADDRESS: EthereumAddress = '0xa7f1462e0ecdeebdee4faf6681148ca96db78777';
const SMOL_BODIES_NFT_ADDRESS: EthereumAddress = '0x17dacad7975960833f374622fad08b90ed67d1b5';
const SMOL_BRAINS_PETS_NFT_ADDRESS: EthereumAddress = '0xf6cc57c45ce730496b4d3df36b9a4e4c3a1b9754';
const SMOL_BODIES_PETS_NFT_ADDRESS: EthereumAddress = '0xae0d0c4cc3335fd49402781e406adf3f02d41bca';
const RAINBOW_SMOL_NFT_ADDRESS: EthereumAddress = '0xa1e417c09211b9ec12ea25f97429d0772749bbf2';

// zora app icon unlocking NFTs
const ZORA_NFT_ADDRESS: EthereumAddress = '0x7492e30d60d96c58ed0f0dc2fe536098c620c4c0';

// gold doge app icon unlocking NFTs
const GOLDDOGE_NFT_ADDRESS: EthereumAddress = '0x1cad624e9db9a1c26187e5d49e0077ff9d90cbe2';

// rain doge app icon unlocking NFTs
const RAINDOGE_NFT_ADDRESS: EthereumAddress = '0x6d60e6c4038b20cbba263ff842fec852f0550041';

// pooly app icon unlocking NFTs
const POOLY_NFT_ADDRESS: EthereumAddress = '0x86fa5a5927fbaa82218743607765ec0f63e46bfa';
const POOLY_NFT_ADDRESS_2: EthereumAddress = '0x90b3832e2f2ade2fe382a911805b6933c056d6ed';

// finiliar app icon unlocking NFTs
const FINI_NFT_ADDRESS: EthereumAddress = '0x5a0121a0a21232ec0d024dab9017314509026480';
const RAINBOW_FINI_NFT_ADDRESS: EthereumAddress = '0xc5f18a7bf825c2b0433102da5bc79c9edfc3fa89';
const BASE_WARS_FINI_NFT_ADDRESS: EthereumAddress = '0x34e817d631b7fb79a54638c01c03421d124e35a7';

// zorb app icon unlocking NFTs
const ZORB_NFT_ADDRESS: EthereumAddress = '0x12e4527e2807978a49469f8d757abf5e07b32b8f';

// poolboy app icon unlocking NFTs
const POOLBOY_NFT_ADDRESS: EthereumAddress = '0xf25298fa62a2eb94fc06626966f6f21399b4c508';

// adworld app icon unlocking NFTs
const ADWORLD_NFT_ADDRESS: EthereumAddress = '0x6171f829e107f70b58d67594c6b62a7d3eb7f23b';

// farcaster app icon unlocking NFTs
const FARCASTER_NFT_ADDRESS: EthereumAddress = '0x76843c8f8a369d29c719141a065ff561abe2420b';

export const unlockableAppIconStorage = new MMKV({
  id: 'unlockableAppIcons',
});

export type AppIcon = {
  accentColor: string;
  displayName: string;
  image: ImageSourcePropType;
};

type UnlockableAppIcon = AppIcon & {
  unlockingNFTs: Partial<{ [key in Network]: EthereumAddress[] }>;
};

export const freeAppIcons: { [key: string]: AppIcon } = {
  og: {
    accentColor: 'rainbowBlue',
    displayName: 'OG',
    image: AppIconOg,
  } as AppIcon,
  pixel: {
    accentColor: 'rainbowBlue',
    displayName: 'Pixel',
    image: AppIconPixel,
  } as AppIcon,
};

export const unlockableAppIcons: { [key: string]: UnlockableAppIcon } = {
  optimism: {
    accentColor: 'optimismRed',
    displayName: 'Optimism',
    image: AppIconOptimism,
    id: 'optimism_nft_app_icon',
    unlockingNFTs: { [Network.optimism]: [OPTIMISTIC_EXPLORER_NFT_ADDRESS] },
  } as UnlockableAppIcon,
  smol: {
    accentColor: 'smolPurple',
    displayName: 'SMOL',
    image: AppIconSmol,
    unlockingNFTs: {
      [Network.arbitrum]: [
        LEGACY_SMOL_BRAINS_NFT_ADDRESS,
        SMOL_BRAINS_NFT_ADDRESS,
        SMOL_BODIES_NFT_ADDRESS,
        SMOL_BRAINS_PETS_NFT_ADDRESS,
        SMOL_BODIES_PETS_NFT_ADDRESS,
        RAINBOW_SMOL_NFT_ADDRESS,
      ],
    },
  } as UnlockableAppIcon,
  zora: {
    accentColor: 'rainbowBlue',
    displayName: 'Zora',
    image: AppIconZora,
    unlockingNFTs: { [Network.mainnet]: [ZORA_NFT_ADDRESS] },
  } as UnlockableAppIcon,
  golddoge: {
    accentColor: 'dogeGold',
    displayName: 'GOLDDOGE',
    image: AppIconGoldDoge,
    unlockingNFTs: { [Network.mainnet]: [GOLDDOGE_NFT_ADDRESS] },
  } as UnlockableAppIcon,
  raindoge: {
    accentColor: 'dogeGold',
    displayName: 'RAINDOGE',
    image: AppIconRainDoge,
    unlockingNFTs: { [Network.mainnet]: [RAINDOGE_NFT_ADDRESS] },
  } as UnlockableAppIcon,
  pooly: {
    accentColor: 'poolyPurple',
    displayName: 'Rainbow Pooly',
    image: AppIconPooly,
    unlockingNFTs: { [Network.mainnet]: [POOLY_NFT_ADDRESS, POOLY_NFT_ADDRESS_2] },
  } as UnlockableAppIcon,
  finiliar: {
    accentColor: 'finiliarPink',
    displayName: 'Rainbow Finiliar',
    image: AppIconFiniliar,
    unlockingNFTs: { [Network.mainnet]: [FINI_NFT_ADDRESS, RAINBOW_FINI_NFT_ADDRESS], [Network.base]: [BASE_WARS_FINI_NFT_ADDRESS] },
  } as UnlockableAppIcon,
  zorb: {
    accentColor: 'zorbPink',
    displayName: 'Rainbow Zorb Energy',
    image: AppIconZorb,
    unlockingNFTs: { [Network.zora]: [ZORB_NFT_ADDRESS] },
  } as UnlockableAppIcon,
  poolboy: {
    accentColor: 'poolboyPink',
    displayName: 'Rainbow Poolboy',
    image: AppIconPoolboy,
    unlockingNFTs: { [Network.mainnet]: [POOLBOY_NFT_ADDRESS] },
  } as UnlockableAppIcon,
  adworld: {
    accentColor: 'adworldRed',
    displayName: 'Rainbow World',
    image: AppIconAdworld,
    unlockingNFTs: { [Network.base]: [ADWORLD_NFT_ADDRESS] },
  } as UnlockableAppIcon,
  farcaster: {
    accentColor: 'farcasterPurple',
    displayName: 'Rainbowcast',
    image: AppIconFarcaster,
    unlockingNFTs: { [Network.base]: [FARCASTER_NFT_ADDRESS] },
  } as UnlockableAppIcon,
};
