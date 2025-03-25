import ConditionalWrap from 'conditional-wrap';
import React, { ComponentProps } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import AddFundsInterstitial from '../AddFundsInterstitial';
import { Centered, Column } from '../layout';
import AssetListHeader from './AssetListHeader';
import AssetListItemSkeleton from './AssetListItemSkeleton';
import { times } from '@/helpers/utilities';
import { useRefreshAccountData } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { navbarHeight } from '../navbar/Navbar';

const Container = styled(Column)({
  ...position.sizeAsObject('100%'),
  paddingTop: navbarHeight,
});

interface EmptyAssetListProps extends ComponentProps<typeof View> {
  descendingOpacity?: boolean;
  isLoading?: boolean;
  isWalletEthZero?: boolean;
  network?: string;
  skeletonCount?: number;
  title?: string;
  children?: React.ReactNode;
}

const EmptyAssetList = ({
  descendingOpacity,
  isLoading,
  isWalletEthZero,
  network,
  skeletonCount = 5,
  title,
  ...props
}: EmptyAssetListProps) => {
  const { refresh, isRefreshing } = useRefreshAccountData();

  const showAddFunds = (!isLoading && isWalletEthZero) ?? false;

  return (
    <ConditionalWrap
      condition={showAddFunds}
      wrap={children => (
        <ScrollView
          contentContainerStyle={{ height: '100%' }}
          refreshControl={<RefreshControl onRefresh={refresh} progressViewOffset={navbarHeight + 16} refreshing={isRefreshing} />}
        >
          {children}
        </ScrollView>
      )}
    >
      <Container {...props}>
        <Centered flex={1}>
          {showAddFunds ? (
            <AddFundsInterstitial network={network} />
          ) : (
            <React.Fragment>
              {title && <AssetListHeader title={title} />}
              <Column cover>
                {times(skeletonCount, index => (
                  <AssetListItemSkeleton
                    animated
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
