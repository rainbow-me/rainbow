import { map } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { LayoutAnimation, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Row, RowWithMargins } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinDividerAssetsValue' was resolved to ... Remove this comment to see the full error message
import CoinDividerAssetsValue from './CoinDividerAssetsValue';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinDividerEditButton' was resolved to '... Remove this comment to see the full error message
import CoinDividerEditButton from './CoinDividerEditButton';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinDividerOpenButton' was resolved to '... Remove this comment to see the full error message
import CoinDividerOpenButton from './CoinDividerOpenButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/editOption... Remove this comment to see the full error message
import EditOptions from '@rainbow-me/helpers/editOptionTypes';
import {
  useAccountSettings,
  useCoinListEdited,
  useCoinListEditOptions,
  useDimensions,
  useOpenSmallBalances,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/explorer' or... Remove this comment to see the full error message
import { emitChartsRequest } from '@rainbow-me/redux/explorer';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

export const CoinDividerHeight = 30;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(5, 19, 6)};
  background-color: ${({ isSticky, theme: { colors } }) =>
    isSticky ? colors.white : colors.transparent};
  height: ${CoinDividerHeight + 11};
  width: ${({ deviceWidth }) => deviceWidth};
`;

const CoinDividerButtonRow = styled(RowWithMargins).attrs(
  ({ isCoinListEdited }) => ({
    margin: 10,
    pointerEvents: isCoinListEdited ? 'auto' : 'none',
  })
)`
  position: absolute;
`;

const EditButtonWrapper = styled(Row).attrs({
  align: 'end',
})`
  position: absolute;
  right: 0;
`;

export default function CoinDivider({ balancesSum, isSticky, onEndEdit }: any) {
  const { nativeCurrency } = useAccountSettings();
  const dispatch = useDispatch();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
  const assets = useSelector(({ data: { assets } }) => assets);

  const [fetchedCharts, setFetchedCharts] = useState(false);
  const { width: deviceWidth } = useDimensions();

  const {
    clearSelectedCoins,
    currentAction,
    setHiddenCoins,
    setIsCoinListEdited,
    setPinnedCoins,
  } = useCoinListEditOptions();

  const { isCoinListEdited } = useCoinListEdited();

  const {
    isSmallBalancesOpen,
    toggleOpenSmallBalances,
  } = useOpenSmallBalances();

  useEffect(() => {
    if (isSmallBalancesOpen && !fetchedCharts) {
      const assetCodes = map(assets, 'address');
      dispatch(emitChartsRequest(assetCodes));
      setFetchedCharts(true);
    }
  }, [
    assets,
    dispatch,
    fetchedCharts,
    isSmallBalancesOpen,
    toggleOpenSmallBalances,
  ]);

  const handlePressEdit = useCallback(() => {
    if (isCoinListEdited && onEndEdit) {
      onEndEdit();
    }
    setIsCoinListEdited(!isCoinListEdited);
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
  }, [isCoinListEdited, onEndEdit, setIsCoinListEdited]);

  // Clear CoinListEditOptions selection queue on unmount.
  useEffect(() => () => clearSelectedCoins(), [clearSelectedCoins]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container deviceWidth={deviceWidth} isSticky={isSticky}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View pointerEvents={isCoinListEdited ? 'none' : 'auto'}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CoinDividerOpenButton
            coinDividerHeight={CoinDividerHeight}
            isSmallBalancesOpen={isSmallBalancesOpen}
            isVisible={isCoinListEdited}
            onPress={toggleOpenSmallBalances}
          />
        </View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CoinDividerButtonRow isCoinListEdited={isCoinListEdited}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CoinDividerEditButton
            isActive={currentAction !== EditOptions.none}
            isVisible={isCoinListEdited}
            onPress={setPinnedCoins}
            shouldReloadList
            text={currentAction === EditOptions.unpin ? 'Unpin' : 'Pin'}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CoinDividerEditButton
            isActive={currentAction !== EditOptions.none}
            isVisible={isCoinListEdited}
            onPress={setHiddenCoins}
            shouldReloadList
            text={currentAction === EditOptions.unhide ? 'Unhide' : 'Hide'}
          />
        </CoinDividerButtonRow>
      </Row>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row justify="end">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CoinDividerAssetsValue
          balancesSum={balancesSum}
          nativeCurrency={nativeCurrency}
          openSmallBalances={isSmallBalancesOpen}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <EditButtonWrapper
          pointerEvents={
            isCoinListEdited || isSmallBalancesOpen ? 'auto' : 'none'
          }
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CoinDividerEditButton
            isActive={isCoinListEdited}
            isVisible={isCoinListEdited || isSmallBalancesOpen}
            onPress={handlePressEdit}
            text={isCoinListEdited ? 'Done' : 'Edit'}
            textOpacityAlwaysOn
          />
        </EditButtonWrapper>
      </Row>
    </Container>
  );
}
