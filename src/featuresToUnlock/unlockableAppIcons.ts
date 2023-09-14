import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers';

// optimism app icon unlocking NFTs
const OPTIMISTIC_EXPLORER_NFT_ADDRESS: EthereumAddress =
  '0x81b30ff521D1fEB67EDE32db726D95714eb00637';

// smol app icon unlocking NFTs
const SMOL_BRAINS_NFT_ADDRESS: EthereumAddress =
  '0x6325439389e0797ab35752b4f43a14c004f22a9c';
const SMOL_BODIES_NFT_ADDRESS: EthereumAddress =
  '0x17dacad7975960833f374622fad08b90ed67d1b5';
const SMOL_BRAINS_PETS_NFT_ADDRESS: EthereumAddress =
  '0xf6cc57c45ce730496b4d3df36b9a4e4c3a1b9754';
const SMOL_BODIES_PETS_NFT_ADDRESS: EthereumAddress =
  '0xae0d0c4cc3335fd49402781e406adf3f02d41bca';

// zora app icon unlocking NFTs
const ZORA_NFT_ADDRESS: EthereumAddress =
  '0x7492e30d60d96c58ed0f0dc2fe536098c620c4c0';

// gold doge app icon unlocking NFTs
const GOLDDOGE_NFT_ADDRESS: EthereumAddress =
  '0x1cad624e9db9a1c26187e5d49e0077ff9d90cbe2';

// rain doge app icon unlocking NFTs
const RAINDOGE_NFT_ADDRESS: EthereumAddress =
  '0x6d60e6c4038b20cbba263ff842fec852f0550041';

// pooly app icon unlocking NFTs
const POOLY_NFT_ADDRESS: EthereumAddress =
  '0x86fa5a5927fbaa82218743607765ec0f63e46bfa';
const POOLY_NFT_ADDRESS_2: EthereumAddress =
  '0x90b3832e2f2ade2fe382a911805b6933c056d6ed';

// finiliar app icon unlocking NFTs
const FINI_NFT_ADDRESS: EthereumAddress =
  '0x5a0121a0a21232ec0d024dab9017314509026480';
const RAINBOW_FINI_NFT_ADDRESS: EthereumAddress =
  '0xc5f18a7bf825c2b0433102da5bc79c9edfc3fa89';
const BASE_WARS_FINI_NFT_ADDRESS: EthereumAddress =
  '0x34e817d631b7fb79a54638c01c03421d124e35a7';

// zorb app icon unlocking NFTs
const ZORB_NFT_ADDRESS: EthereumAddress =
  '0x12e4527e2807978a49469f8d757abf5e07b32b8f';

// poolboy app icon unlocking NFTs
const POOLBOY_NFT_ADDRESS: EthereumAddress =
  '0xf25298fa62a2eb94fc06626966f6f21399b4c508';

// adworld app icon unlocking NFTs
const ADWORLD_NFT_ADDRESS: EthereumAddress =
  '0x6171f829e107f70b58d67594c6b62a7d3eb7f23b';

export interface UnlockableAppIcon {
  key: string; // string used for analytics
  network: Network; // network that the unlockingNfts exist on
  explainSheetType: string; // ExplainSheet type to navigate to upon unlock
  unlockKey: string; // MMKV key to unlock feature
  unlockingNfts: EthereumAddress[]; // Array of NFT addresses that can be used to unlock this icon
}

export const OptimismIcon: UnlockableAppIcon = {
  key: 'optimism',
  explainSheetType: 'optimism_app_icon',
  network: Network.optimism,
  unlockingNfts: [OPTIMISTIC_EXPLORER_NFT_ADDRESS],
  unlockKey: 'optimism_nft_app_icon',
};

export const SmolIcon: UnlockableAppIcon = {
  key: 'smol',
  explainSheetType: 'smol_app_icon',
  network: Network.arbitrum,
  unlockingNfts: [
    SMOL_BRAINS_NFT_ADDRESS,
    SMOL_BODIES_NFT_ADDRESS,
    SMOL_BRAINS_PETS_NFT_ADDRESS,
    SMOL_BODIES_PETS_NFT_ADDRESS,
  ],
  unlockKey: 'smol_nft_app_icon',
};

export const ZoraIcon: UnlockableAppIcon = {
  key: 'zora',
  explainSheetType: 'zora_app_icon',
  network: Network.mainnet,
  unlockingNfts: [ZORA_NFT_ADDRESS],
  unlockKey: 'zora_nft_app_icon',
};

export const GoldDogeIcon: UnlockableAppIcon = {
  key: 'golddoge',
  explainSheetType: 'golddoge_app_icon',
  network: Network.mainnet,
  unlockingNfts: [GOLDDOGE_NFT_ADDRESS],
  unlockKey: 'golddoge_nft_app_icon',
};

export const RainDogeIcon: UnlockableAppIcon = {
  key: 'raindoge',
  explainSheetType: 'raindoge_app_icon',
  network: Network.mainnet,
  unlockingNfts: [RAINDOGE_NFT_ADDRESS],
  unlockKey: 'raindoge_nft_app_icon',
};

export const PoolyIcon: UnlockableAppIcon = {
  key: 'pooly',
  explainSheetType: 'pooly_app_icon',
  network: Network.mainnet,
  unlockingNfts: [POOLY_NFT_ADDRESS, POOLY_NFT_ADDRESS_2],
  unlockKey: 'pooly_nft_app_icon',
};

export const FiniliarIcon: UnlockableAppIcon = {
  key: 'finiliar',
  explainSheetType: 'finiliar_app_icon',
  network: Network.mainnet,
  unlockingNfts: [FINI_NFT_ADDRESS, RAINBOW_FINI_NFT_ADDRESS],
  unlockKey: 'finiliar_nft_app_icon',
};

export const FiniliarIconBase: UnlockableAppIcon = {
  key: 'finiliar',
  explainSheetType: 'finiliar_app_icon',
  network: Network.base,
  unlockingNfts: [BASE_WARS_FINI_NFT_ADDRESS],
  unlockKey: 'finiliar_nft_app_icon',
};

export const ZorbIcon: UnlockableAppIcon = {
  key: 'zorb',
  explainSheetType: 'zorb_app_icon',
  network: Network.zora,
  unlockingNfts: [ZORB_NFT_ADDRESS],
  unlockKey: 'zorb_nft_app_icon',
};

export const PoolboyIcon: UnlockableAppIcon = {
  key: 'poolboy',
  explainSheetType: 'poolboy_app_icon',
  network: Network.mainnet,
  unlockingNfts: [POOLBOY_NFT_ADDRESS],
  unlockKey: 'poolboy_nft_app_icon',
};

export const AdworldIcon: UnlockableAppIcon = {
  key: 'adworld',
  explainSheetType: 'adworld_app_icon',
  network: Network.base,
  unlockingNfts: [ADWORLD_NFT_ADDRESS],
  unlockKey: 'adworld_nft_app_icon',
};
