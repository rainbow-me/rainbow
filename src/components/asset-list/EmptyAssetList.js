import ConditionalWrap from 'conditional-wrap';
import { times } from 'lodash';
import React, { useMemo } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import AddFundsInterstitial from '../AddFundsInterstitial';
import { FabWrapperBottomPosition } from '../fab';
import { Centered, Column } from '../layout';
import AssetListHeader, { AssetListHeaderHeight } from './AssetListHeader';
import AssetListItemSkeleton from './AssetListItemSkeleton';
import { useRefreshAccountData } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

const Container = styled(Column)`
  ${position.size('100%')};
`;

const EmptyAssetList = ({
  descendingOpacity,
  isWalletEthZero,
  network,
  skeletonCount = 5,
  title,
  ...props
}) => {
  const { bottom: bottomInset } = useSafeArea();

  const interstitialOffset = useMemo(() => {
    let offset = bottomInset + FabWrapperBottomPosition;
    if (title) {
      offset += AssetListHeaderHeight;
    }
    return offset * -1;
  }, [bottomInset, title]);

  const { refresh, isRefreshing } = useRefreshAccountData();

  return (
    <ConditionalWrap
      condition={isWalletEthZero}
      wrap={children => (
        <ScrollView
          contentContainerStyle={{ height: '100%' }}
          refreshControl={
            <RefreshControl onRefresh={refresh} refreshing={isRefreshing} />
          }
        >
          {children}
        </ScrollView>
      )}
    >
      <Container {...props}>
        <Centered flex={1}>
          {isWalletEthZero ? (
            <AddFundsInterstitial
              network={network}
              offsetY={interstitialOffset}
            />
          ) : (
            <React.Fragment>
              {title && <AssetListHeader title={title} />}
              <Column cover>
                {times(skeletonCount, index => (
                  <AssetListItemSkeleton
                    animated={!isWalletEthZero}
                    descendingOpacity={descendingOpacity || isWalletEthZero}
                    index={index}
                    key={`skeleton${index}`}
                  />
                ))}
              </Column>
            </React.Fragment>
          )}
        </Centered>
      </Container>
    </ConditionalWrap>
  );
};

export default EmptyAssetList;
