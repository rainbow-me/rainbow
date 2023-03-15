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
