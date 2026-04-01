import { formatUnits, parseUnits } from 'viem';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { RNBW_CHAIN_ID, RNBW_DECIMALS, RNBW_TOKEN_ADDRESS, RNBW_TOKEN_UNIQUE_ID } from '@/features/rnbw-staking/constants';
import { convertAmountToBalanceDisplay, convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { type ExtendedAnimatedAssetWithColors, type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { parseAssetAndExtend } from '@/__swaps__/utils/swaps';

type SyntheticRnbwSourceStaticConfig = Pick<
  ParsedSearchAsset,
  | 'address'
  | 'chainId'
  | 'decimals'
  | 'highLiquidity'
  | 'isNativeAsset'
  | 'isRainbowCurated'
  | 'isVerified'
  | 'mainnetAddress'
  | 'name'
  | 'symbol'
  | 'uniqueId'
> & {
  bridging: NonNullable<ParsedSearchAsset['bridging']>;
  networks: ParsedSearchAsset['networks'];
};

const RNBW_SYNTHETIC_SOURCE_BRIDGING: NonNullable<ParsedSearchAsset['bridging']> = {
  isBridgeable: false,
  networks: {},
};

const RNBW_SYNTHETIC_SOURCE_NETWORKS: ParsedSearchAsset['networks'] = {
  [RNBW_CHAIN_ID]: {
    address: RNBW_TOKEN_ADDRESS,
    decimals: RNBW_DECIMALS,
  },
};

const RNBW_SYNTHETIC_SOURCE_COLORS: NonNullable<ParsedSearchAsset['colors']> = {
  fallback: '#F2C745',
  primary: '#F2C745',
};

const RNBW_SYNTHETIC_SOURCE_ICON_URL =
  'https://rainbowme-res.cloudinary.com/image/upload/v1770040117/assets/base/0xa53887f7e7c1bf5010b8627f1c1ba94fe7a5d6e0.png';

export const RNBW_SYNTHETIC_SOURCE_STATIC_CONFIG: SyntheticRnbwSourceStaticConfig = {
  address: RNBW_TOKEN_ADDRESS,
  bridging: RNBW_SYNTHETIC_SOURCE_BRIDGING,
  chainId: RNBW_CHAIN_ID,
  decimals: RNBW_DECIMALS,
  highLiquidity: false,
  isNativeAsset: false,
  isRainbowCurated: true,
  isVerified: true,
  mainnetAddress: RNBW_TOKEN_ADDRESS,
  name: 'Rainbow',
  networks: RNBW_SYNTHETIC_SOURCE_NETWORKS,
  symbol: 'RNBW',
  uniqueId: RNBW_TOKEN_UNIQUE_ID,
};

type BuildSyntheticRnbwSourceAssetParams = {
  claimableRnbwRaw: string;
  hasPendingClaim: boolean;
  unitPrice: number;
  walletAsset: ParsedSearchAsset | null;
};

export function buildSyntheticRnbwSourceAsset({
  claimableRnbwRaw,
  hasPendingClaim,
  unitPrice,
  walletAsset,
}: BuildSyntheticRnbwSourceAssetParams): ExtendedAnimatedAssetWithColors | null {
  const currency = userAssetsStoreManager.getState().currency;
  const chainName = walletAsset?.chainName ?? useBackendNetworksStore.getState().getChainsName()[RNBW_CHAIN_ID] ?? String(RNBW_CHAIN_ID);
  const symbol = walletAsset?.symbol ?? RNBW_SYNTHETIC_SOURCE_STATIC_CONFIG.symbol;
  const name = walletAsset?.name ?? RNBW_SYNTHETIC_SOURCE_STATIC_CONFIG.name;

  const availableBalanceAmount = getAvailableBalanceAmount({
    claimableRnbwRaw,
    hasPendingClaim,
    walletBalanceAmount: walletAsset?.balance.amount ?? '0',
  });
  const nativeBalanceAmount = String(Number(availableBalanceAmount) * unitPrice);

  const syntheticAsset: ParsedSearchAsset = {
    ...RNBW_SYNTHETIC_SOURCE_STATIC_CONFIG,
    balance: {
      amount: availableBalanceAmount,
      display: convertAmountToBalanceDisplay(availableBalanceAmount, { decimals: RNBW_DECIMALS, symbol }),
    },
    chainName,
    colors: walletAsset?.colors ?? RNBW_SYNTHETIC_SOURCE_COLORS,
    highLiquidity: walletAsset?.highLiquidity ?? RNBW_SYNTHETIC_SOURCE_STATIC_CONFIG.highLiquidity,
    icon_url: walletAsset?.icon_url ?? RNBW_SYNTHETIC_SOURCE_ICON_URL,
    isRainbowCurated: walletAsset?.isRainbowCurated ?? RNBW_SYNTHETIC_SOURCE_STATIC_CONFIG.isRainbowCurated,
    isVerified: walletAsset?.isVerified ?? RNBW_SYNTHETIC_SOURCE_STATIC_CONFIG.isVerified,
    mainnetAddress: walletAsset?.mainnetAddress ?? RNBW_SYNTHETIC_SOURCE_STATIC_CONFIG.mainnetAddress,
    name,
    native: {
      balance: {
        amount: nativeBalanceAmount,
        display: convertAmountToNativeDisplayWorklet(nativeBalanceAmount, currency, true),
      },
      price: {
        amount: unitPrice,
        change: '0',
        display: convertAmountToNativeDisplayWorklet(unitPrice, currency),
      },
    },
    networks: walletAsset?.networks ?? RNBW_SYNTHETIC_SOURCE_STATIC_CONFIG.networks,
    price: { value: unitPrice },
    symbol,
    type: walletAsset?.type,
    bridging: walletAsset?.bridging ?? RNBW_SYNTHETIC_SOURCE_STATIC_CONFIG.bridging,
  };

  return parseAssetAndExtend({ asset: syntheticAsset });
}

export function getInitialSyntheticRnbwSourceUnitPrice(): number {
  const rewardsData = useRewardsBalanceStore.getState().getData();
  const claimableUnitPrice = getClaimableRnbwUnitPrice(rewardsData);
  if (claimableUnitPrice > 0) return claimableUnitPrice;

  const walletAsset = useUserAssetsStore.getState().getUserAsset(RNBW_TOKEN_UNIQUE_ID);
  return walletAsset?.price?.value ?? walletAsset?.native.price?.amount ?? 0;
}

function getClaimableRnbwUnitPrice(
  rewardsData: {
    claimableRnbw: string;
    claimableValueInCurrency: string;
    hasPendingClaim: boolean;
  } | null
): number {
  if (!rewardsData || rewardsData.hasPendingClaim) return 0;

  const claimableAmount = Number(formatUnits(toRawAmount(rewardsData.claimableRnbw, true), RNBW_DECIMALS));
  const claimableValue = Number(rewardsData.claimableValueInCurrency);
  if (claimableAmount > 0 && claimableValue > 0) {
    return claimableValue / claimableAmount;
  }

  return 0;
}

function getAvailableBalanceAmount({
  claimableRnbwRaw,
  hasPendingClaim,
  walletBalanceAmount,
}: {
  claimableRnbwRaw: string;
  hasPendingClaim: boolean;
  walletBalanceAmount: string;
}): string {
  const walletBalanceRaw = toRawAmount(walletBalanceAmount);
  const claimableRnbw = hasPendingClaim ? 0n : toRawAmount(claimableRnbwRaw, true);
  return formatUnits(walletBalanceRaw + claimableRnbw, RNBW_DECIMALS);
}

function toRawAmount(value: string, isRaw = false): bigint {
  try {
    return isRaw ? BigInt(value) : parseUnits(value, RNBW_DECIMALS);
  } catch {
    return 0n;
  }
}
