import { times } from 'lodash';
import React, { useMemo } from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../AddFundsInterstitial' was resolved to '... Remove this comment to see the full error message
import AddFundsInterstitial from '../AddFundsInterstitial';
import { FabWrapperBottomPosition } from '../fab';
import { Centered, Column } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AssetListHeader' was resolved to '/Users... Remove this comment to see the full error message
import AssetListHeader, { AssetListHeaderHeight } from './AssetListHeader';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AssetListItemSkeleton' was resolved to '... Remove this comment to see the full error message
import AssetListItemSkeleton from './AssetListItemSkeleton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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
}: any) => {
  const { bottom: bottomInset } = useSafeArea();

  const interstitialOffset = useMemo(() => {
    let offset = bottomInset + FabWrapperBottomPosition;
    if (title) {
      offset += AssetListHeaderHeight;
    }
    return offset * -1;
  }, [bottomInset, title]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered flex={1}>
        {isWalletEthZero ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <AddFundsInterstitial
            network={network}
            offsetY={interstitialOffset}
          />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <React.Fragment>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            {title && <AssetListHeader title={title} />}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column cover>
              {times(skeletonCount, index => (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
  );
};

export default EmptyAssetList;
