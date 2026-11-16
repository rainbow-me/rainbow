import React from 'react';

import { type SetterOrUpdater } from 'recoil';

import { type UniqueId } from '@/__swaps__/types/assets';
import { PerpsHeader } from '@/components/asset-list/RecyclerAssetList2/perps/PerpsHeader';
import { PerpsPositionRow } from '@/components/asset-list/RecyclerAssetList2/perps/PerpsPositionRow';
import { PolymarketHeader } from '@/components/asset-list/RecyclerAssetList2/polymarket/PolymarketHeader';
import { PolymarketPositionRow } from '@/components/asset-list/RecyclerAssetList2/polymarket/PolymarketPositionRow';
import { SectionAvailableBalance } from '@/components/asset-list/RecyclerAssetList2/SectionAvailableBalance';
import { TokensHeader } from '@/components/asset-list/RecyclerAssetList2/tokens/TokensHeader';
import { EthCard } from '@/components/cards/EthCard';
import { ReceiveAssetsCard } from '@/components/cards/ReceiveAssetsCard';
import { RotatingLearnCard } from '@/components/cards/RotatingLearnCard';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { renderNftRow } from '@/features/nfts/ui/renderNftRow';
import { navigateToPerps } from '@/features/perps/utils/navigateToPerps';
import { usePolymarketNavigationStore } from '@/features/polymarket/navigation/polymarketNavigation';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import { assertNever } from '@/helpers/assertNever';
import { type BooleanMap } from '@/hooks/useCoinListEditOptions';
import Routes from '@/navigation/routesNames';
import { type ThemeContextProps } from '@/theme/ThemeContext';

import { CoinDivider } from '../../../coin-divider';
import AssetListItemSkeleton from '../../AssetListItemSkeleton';
import { CardRowWrapper } from '../cards/CardRowWrapper';
import { PolymarketFeatureCard } from '../cards/PolymarketFeatureCard';
import { RnbwFeatureCard } from '../cards/RnbwFeatureCard';
import { Claimable } from '../Claimable';
import { ClaimablesListHeader } from '../ClaimablesListHeader';
import FastBalanceCoinRow from '../FastComponents/FastBalanceCoinRow';
import { NFTEmptyState } from '../NFTEmptyState';
import { NFTLoadingSkeleton } from '../NFTLoadingSkeleton';
import { ProfileActionButtonsRow } from '../profile-header/ProfileActionButtonsRow';
import { ProfileAvatarRow } from '../profile-header/ProfileAvatarRow';
import { ProfileBalanceRow } from '../profile-header/ProfileBalanceRow';
import { ProfileNameRow } from '../profile-header/ProfileNameRow';
import { ProfileRowWrapper } from '../profile-header/ProfileRowWrapper';
import { ProfileStickyHeader } from '../profile-header/ProfileStickyHeader';
import WrappedCollectiblesHeader from '../WrappedCollectiblesHeader';
import WrappedPosition from '../WrappedPosition';
import WrappedPositionsListHeader from '../WrappedPositionsListHeader';
import { DiscoverMoreButton } from './DiscoverMoreButton';
import { CellType, type CellTypes } from './ViewTypes';

export type ExtendedState = {
  theme: ThemeContextProps;
  nativeCurrencySymbol: string;
  nativeCurrency: NativeCurrencyKey;
  isCoinListEdited: boolean;
  hiddenAssets: Set<UniqueId>;
  pinnedCoins: BooleanMap;
  toggleSelectedCoin: (id: string) => void;
  setIsCoinListEdited: SetterOrUpdater<boolean>;
};

export default function rowRenderer(data: CellTypes, extendedState: ExtendedState): React.ReactElement | null {
  switch (data.type) {
    case CellType.ASSETS_HEADER_SPACE_AFTER:
    case CellType.NFT_SPACE_AFTER:
    case CellType.NFTS_HEADER_SPACE_AFTER:
    case CellType.NFTS_HEADER_SPACE_BEFORE:
    case CellType.PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER:
    case CellType.PROFILE_AVATAR_ROW_SPACE_AFTER:
    case CellType.PROFILE_AVATAR_ROW_SPACE_BEFORE:
    case CellType.PROFILE_BALANCE_ROW_SPACE_AFTER:
    case CellType.PROFILE_NAME_ROW_SPACE_AFTER:
    case CellType.EMPTY_WALLET_SPACER:
    case CellType.BIG_EMPTY_WALLET_SPACER:
    case CellType.EMPTY_ROW:
    case CellType.POSITIONS_SPACE_AFTER:
    case CellType.POSITIONS_SPACE_BEFORE:
    case CellType.CLAIMABLES_SPACE_AFTER:
    case CellType.CLAIMABLES_SPACE_BEFORE:
    case CellType.SPACER:
      return null;
    case CellType.COIN_DIVIDER:
      return (
        <CoinDivider
          // @ts-expect-error - untyped js file
          balancesSum={data.value}
          defaultToEditButton={data.defaultToEditButton}
          extendedState={extendedState}
        />
      );
    case CellType.DISCOVER_MORE_BUTTON:
      return (
        <CardRowWrapper>
          <DiscoverMoreButton />
        </CardRowWrapper>
      );

    case CellType.RECEIVE_CARD:
      return (
        <CardRowWrapper>
          <ReceiveAssetsCard />
        </CardRowWrapper>
      );
    case CellType.ETH_CARD:
      return (
        <CardRowWrapper>
          <EthCard />
        </CardRowWrapper>
      );
    case CellType.LEARN_CARD:
      return (
        <CardRowWrapper>
          <RotatingLearnCard />
        </CardRowWrapper>
      );
    case CellType.POLYMARKET_FEATURE_CARD: {
      return (
        <CardRowWrapper>
          <PolymarketFeatureCard />
        </CardRowWrapper>
      );
    }
    case CellType.RNBW_FEATURE_CARD: {
      return (
        <CardRowWrapper>
          <RnbwFeatureCard />
        </CardRowWrapper>
      );
    }
    case CellType.PROFILE_STICKY_HEADER:
      return <ProfileStickyHeader />;
    case CellType.COIN:
      return <FastBalanceCoinRow extendedState={extendedState} uniqueId={data.uniqueId} />;
    case CellType.PROFILE_ACTION_BUTTONS_ROW:
      return (
        <ProfileRowWrapper>
          <ProfileActionButtonsRow />
        </ProfileRowWrapper>
      );
    case CellType.PROFILE_AVATAR_ROW:
      return (
        <ProfileRowWrapper>
          <ProfileAvatarRow />
        </ProfileRowWrapper>
      );
    case CellType.PROFILE_BALANCE_ROW:
      return (
        <ProfileRowWrapper>
          <ProfileBalanceRow />
        </ProfileRowWrapper>
      );
    case CellType.PROFILE_NAME_ROW:
      return (
        <ProfileRowWrapper>
          <ProfileNameRow testIDPrefix="profile-name" />
        </ProfileRowWrapper>
      );
    case CellType.NFTS_HEADER:
      return <WrappedCollectiblesHeader />;
    case CellType.NFTS_LOADING:
      return <NFTLoadingSkeleton />;
    case CellType.NFTS_EMPTY:
      return <NFTEmptyState />;
    case CellType.FAMILY_HEADER:
    case CellType.NFT:
      return renderNftRow(data, extendedState.theme);
    case CellType.POSITIONS_HEADER: {
      const { total } = data;
      return <WrappedPositionsListHeader total={total} />;
    }
    case CellType.POSITION: {
      const { position, index } = data;

      return <WrappedPosition placement={index % 2 === 0 ? 'left' : 'right'} position={position} />;
    }
    case CellType.CLAIMABLES_HEADER: {
      const { total } = data;
      return <ClaimablesListHeader total={total} />;
    }
    case CellType.CLAIMABLE: {
      const { claimable } = data;

      return <Claimable claimable={claimable} />;
    }
    case CellType.PERPS_HEADER: {
      return <PerpsHeader isDarkMode={extendedState.theme.isDarkMode} />;
    }
    case CellType.PERPS_BALANCE: {
      const { balance } = data;
      return <SectionAvailableBalance balance={balance} isDarkMode={extendedState.theme.isDarkMode} onPress={navigateToPerps} />;
    }
    case CellType.PERPS_POSITION: {
      const { position } = data;
      return <PerpsPositionRow position={position} />;
    }
    case CellType.POLYMARKET_HEADER: {
      return <PolymarketHeader isDarkMode={extendedState.theme.isDarkMode} />;
    }
    case CellType.POLYMARKET_BALANCE: {
      const { balance } = data;
      return (
        <SectionAvailableBalance
          balance={balance}
          isDarkMode={extendedState.theme.isDarkMode}
          onPress={() => {
            usePolymarketNavigationStore.getState().navigate(Routes.POLYMARKET_ACCOUNT_SCREEN);
            navigateToPolymarket();
          }}
        />
      );
    }
    case CellType.POLYMARKET_POSITION: {
      const { position } = data;
      return <PolymarketPositionRow position={position} />;
    }
    case CellType.TOKENS_HEADER: {
      return <TokensHeader />;
    }
    case CellType.LOADING_ASSETS:
      return <AssetListItemSkeleton />;
    default:
      assertNever(data);
  }
}
