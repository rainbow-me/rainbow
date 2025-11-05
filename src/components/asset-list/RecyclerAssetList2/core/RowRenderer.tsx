import React from 'react';
import { CoinDivider } from '../../../coin-divider';
import { AssetListItemSkeleton } from '../../index';
import FastBalanceCoinRow from '../FastComponents/FastBalanceCoinRow';
import WrappedNFT from '../WrappedNFT';
import WrappedTokenFamilyHeader from '../WrappedTokenFamilyHeader';
import { ExtendedState } from './RawRecyclerList';
import {
  CellType,
  ClaimableExtraData,
  ClaimablesHeaderExtraData,
  CoinDividerExtraData,
  CoinExtraData,
  LegacyNFTExtraData,
  LegacyNFTFamilyExtraData,
  NFTExtraData,
  NFTFamilyExtraData,
  PositionExtraData,
  PositionHeaderExtraData,
  PerpsBalanceExtraData,
  PerpsPositionExtraData,
} from './ViewTypes';
import assertNever from '@/helpers/assertNever';
import { ProfileRowWrapper } from '../profile-header/ProfileRowWrapper';
import { ProfileStickyHeader } from '../profile-header/ProfileStickyHeader';
import { ProfileActionButtonsRow } from '../profile-header/ProfileActionButtonsRow';
import { ProfileAvatarRow } from '../profile-header/ProfileAvatarRow';
import { ProfileBalanceRow } from '../profile-header/ProfileBalanceRow';
import { ProfileNameRow } from '../profile-header/ProfileNameRow';
import { EthCard } from '@/components/cards/EthCard';
import { ReceiveAssetsCard } from '@/components/cards/ReceiveAssetsCard';
import { CardRowWrapper } from '../cards/CardRowWrapper';
import { DiscoverMoreButton } from './DiscoverMoreButton';
import { RotatingLearnCard } from '@/components/cards/RotatingLearnCard';
import { PerpsFeatureCard } from '../cards/PerpsFeatureCard';
import WrappedPosition from '../WrappedPosition';
import WrappedPositionsListHeader from '../WrappedPositionsListHeader';
import { RemoteCardCarousel } from '@/components/cards/remote-cards';
import WrappedCollectiblesHeader from '../WrappedCollectiblesHeader';
import NFTLoadingSkeleton from '../NFTLoadingSkeleton';
import { NFTEmptyState } from '../NFTEmptyState';
import { ClaimablesListHeader } from '../ClaimablesListHeader';
import { Claimable } from '../Claimable';
import LegacyWrappedNFT from '../LegacyWrappedNFT';
import LegacyWrappedTokenFamilyHeader from '../LegacyWrappedTokenFamilyHeader';
import { PerpsHeader } from '@/components/asset-list/RecyclerAssetList2/perps/PerpsHeader';
import { PerpsPositionRow } from '@/components/asset-list/RecyclerAssetList2/perps/PerpsPositionRow';
import { PerpsAvailableBalance } from '@/components/asset-list/RecyclerAssetList2/perps/PerpsAvailableBalance';
import { TokensHeader } from '@/components/asset-list/RecyclerAssetList2/tokens/TokensHeader';

function rowRenderer(type: CellType, { uid }: { uid: string }, _: unknown, extendedState: ExtendedState) {
  const data = extendedState.additionalData[uid];
  switch (type) {
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
    case CellType.EMPTY_REMOTE_CARD_CAROUSEL:
    case CellType.SPACER:
      return null;
    case CellType.COIN_DIVIDER:
      return (
        <CoinDivider
          // @ts-expect-error - untyped js file
          balancesSum={(data as CoinDividerExtraData).value}
          defaultToEditButton={(data as CoinDividerExtraData).defaultToEditButton}
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
    case CellType.PERPS_FEATURE_CARD: {
      return (
        <CardRowWrapper>
          <PerpsFeatureCard />
        </CardRowWrapper>
      );
    }
    case CellType.PROFILE_STICKY_HEADER:
      return <ProfileStickyHeader />;
    case CellType.REMOTE_CARD_CAROUSEL:
      return (
        <CardRowWrapper>
          <RemoteCardCarousel />
        </CardRowWrapper>
      );
    case CellType.COIN:
      return <FastBalanceCoinRow extendedState={extendedState} uniqueId={(data as CoinExtraData).uniqueId} />;
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
    case CellType.FAMILY_HEADER: {
      const { name, image, total, uid } = data as NFTFamilyExtraData;

      return (
        <WrappedTokenFamilyHeader
          image={image}
          name={name}
          testID={`token-family-header-${name}`}
          theme={extendedState.theme}
          total={total}
          uid={uid}
        />
      );
    }
    case CellType.LEGACY_FAMILY_HEADER: {
      const { name, image, total } = data as LegacyNFTFamilyExtraData;

      return (
        <LegacyWrappedTokenFamilyHeader
          image={image}
          name={name}
          testID={`token-family-header-${name}`}
          theme={extendedState.theme}
          total={total}
        />
      );
    }
    case CellType.LEGACY_NFT: {
      const { index, uniqueId } = data as LegacyNFTExtraData;
      return (
        <LegacyWrappedNFT
          externalAddress={extendedState.externalAddress}
          onPress={extendedState.onPressUniqueToken}
          placement={index % 2 === 0 ? 'left' : 'right'}
          uniqueId={uniqueId}
        />
      );
    }
    case CellType.NFT: {
      const { index, collectionId, uniqueId } = data as NFTExtraData;

      return (
        <WrappedNFT
          onPress={extendedState.onPressUniqueToken}
          placement={index % 2 === 0 ? 'left' : 'right'}
          index={index}
          uniqueId={uniqueId}
          collectionId={collectionId}
        />
      );
    }
    case CellType.POSITIONS_HEADER: {
      const { total } = data as PositionHeaderExtraData;
      return <WrappedPositionsListHeader total={total} />;
    }
    case CellType.POSITION: {
      const { position, index } = data as PositionExtraData;

      return <WrappedPosition placement={index % 2 === 0 ? 'left' : 'right'} position={position} />;
    }
    case CellType.CLAIMABLES_HEADER: {
      const { total } = data as ClaimablesHeaderExtraData;
      return <ClaimablesListHeader total={total} />;
    }
    case CellType.CLAIMABLE: {
      const { claimable } = data as ClaimableExtraData;

      return <Claimable claimable={claimable} />;
    }
    case CellType.PERPS_HEADER: {
      return <PerpsHeader isDarkMode={extendedState.theme.isDarkMode} />;
    }
    case CellType.PERPS_BALANCE: {
      const { balance } = data as PerpsBalanceExtraData;
      return <PerpsAvailableBalance balance={balance} isDarkMode={extendedState.theme.isDarkMode} />;
    }
    case CellType.PERPS_POSITION: {
      const { position } = data as PerpsPositionExtraData;
      return <PerpsPositionRow position={position} />;
    }
    case CellType.TOKENS_HEADER: {
      return <TokensHeader />;
    }
    case CellType.LOADING_ASSETS:
      return <AssetListItemSkeleton />;
    default:
      assertNever(type);
  }
}

export default rowRenderer as (type: string | number, data: any) => React.ReactElement; // eslint-disable-line @typescript-eslint/no-explicit-any
