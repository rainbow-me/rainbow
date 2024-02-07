import React from 'react';
import { CoinDivider } from '../../../coin-divider';
import { AssetListItemSkeleton } from '../../index';
import FastBalanceCoinRow from '../FastComponents/FastBalanceCoinRow';
import WrappedNFT from '../WrappedNFT';
import WrappedTokenFamilyHeader from '../WrappedTokenFamilyHeader';
import { ExtendedState } from './RawRecyclerList';
import {
  AssetsHeaderExtraData,
  CellType,
  CoinDividerExtraData,
  CoinExtraData,
  NFTExtraData,
  NFTFamilyExtraData,
  PositionExtraData,
  PositionHeaderExtraData,
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
import WrappedPosition from '../WrappedPosition';
import WrappedPositionsListHeader from '../WrappedPositionsListHeader';
import * as lang from '@/languages';
import { RemoteCardCarousel } from '@/components/cards/remote-cards';
import WrappedCollectiblesHeader from '../WrappedCollectiblesHeader';

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
      return null;
    case CellType.COIN_DIVIDER:
      return (
        <CoinDivider
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
          <ProfileBalanceRow
            totalValue={(data as AssetsHeaderExtraData).value}
            isLoadingUserAssets={(data as AssetsHeaderExtraData).isLoadingUserAssets}
          />
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
    case CellType.FAMILY_HEADER: {
      const { name, image, total } = data as NFTFamilyExtraData;
      return (
        <WrappedTokenFamilyHeader
          image={image}
          name={name}
          testID={`token-family-header-${name}`}
          theme={extendedState.theme}
          total={total}
        />
      );
    }
    case CellType.NFT: {
      const { index, uniqueId } = data as NFTExtraData;

      return (
        <WrappedNFT
          externalAddress={extendedState.externalAddress}
          onPress={extendedState.onPressUniqueToken}
          placement={index % 2 === 0 ? 'left' : 'right'}
          uniqueId={uniqueId}
        />
      );
    }
    case CellType.POSITIONS_HEADER: {
      const { total } = data as PositionHeaderExtraData;
      return <WrappedPositionsListHeader total={total} />;
    }
    case CellType.POSITION: {
      const { uniqueId, index } = data as PositionExtraData;

      return <WrappedPosition placement={index % 2 === 0 ? 'left' : 'right'} uniqueId={uniqueId} />;
    }

    case CellType.LOADING_ASSETS:
      return <AssetListItemSkeleton />;
    default:
      assertNever(type);
  }
}

export default rowRenderer as (type: string | number, data: any) => React.ReactElement;
