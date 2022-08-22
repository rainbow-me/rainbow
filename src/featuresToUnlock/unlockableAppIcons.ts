import { EthereumAddress } from '@/entities';
import { Network } from '@/helpers';

// optimism icon unlocking NFTs
const OPTIMISTIC_EXPLORER_NFT_ADDRESS: EthereumAddress =
  '0x81b30ff521D1fEB67EDE32db726D95714eb00637';

// SMOL icon unlocking NFTs
const SMOL_BRAINS_NFT_ADDRESS: EthereumAddress =
  '0x6325439389e0797ab35752b4f43a14c004f22a9c';
const SMOL_BODIES_NFT_ADDRESS: EthereumAddress =
  '0x17dacad7975960833f374622fad08b90ed67d1b5';
const SMOL_BRAINS_PETS_NFT_ADDRESS: EthereumAddress =
  '0xf6cc57c45ce730496b4d3df36b9a4e4c3a1b9754';
const SMOL_BODIES_PETS_NFT_ADDRESS: EthereumAddress =
  '0xae0d0c4cc3335fd49402781e406adf3f02d41bca';

interface UnlockableAppIcon {
  token_addresses: EthereumAddress[];
  unlock_key: string;
  network: Network;
  explain_sheet_key: string;
  explain_sheet_type: string;
}

export const unlockableAppIcons: { [key: string]: UnlockableAppIcon } = {
  optimism: {
    explain_sheet_key: 'optimism_nft_app_icon_explainer',
    explain_sheet_type: 'optimism_app_icon',
    network: Network.optimism,
    token_addresses: [OPTIMISTIC_EXPLORER_NFT_ADDRESS],
    unlock_key: 'optimism_nft_app_icon',
  },
  smol: {
    explain_sheet_key: 'smol_nft_app_icon_explainer',
    explain_sheet_type: 'smol_app_icon',
    network: Network.arbitrum,
    token_addresses: [
      SMOL_BRAINS_NFT_ADDRESS,
      SMOL_BODIES_NFT_ADDRESS,
      SMOL_BRAINS_PETS_NFT_ADDRESS,
      SMOL_BODIES_PETS_NFT_ADDRESS,
    ],
    unlock_key: 'smol_nft_app_icon',
  },
};
