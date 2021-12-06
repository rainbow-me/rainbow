// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/config/debug' or i... Remove this comment to see the full error message
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { StatusBar } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Divider' was resolved to '/U... Remove this comment to see the full error message
import Divider from '../components/Divider';
import { SavingsCoinRow } from '../components/coin-row';
import {
  FloatingEmojis,
  FloatingEmojisTapHandler,
} from '../components/floating-emojis';
import { Centered, Column } from '../components/layout';
import {
  SavingsPredictionStepper,
  SavingsSheetEmptyState,
  SavingsSheetHeader,
} from '../components/savings';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/savings' o... Remove this comment to see the full error message
import { isSymbolStablecoin } from '@rainbow-me/helpers/savings';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useDimensions,
  useWallets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { watchingAlert } from '@rainbow-me/utils';

export const SavingsSheetEmptyHeight = 313;
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
export const SavingsSheetHeight = android
  ? 424 - getSoftMenuBarHeight() / 2
  : 352;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const SavingsSheet = () => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors, isDarkMode } = useTheme();
  const { height: deviceHeight } = useDimensions();
  const { navigate } = useNavigation();
  const { params } = useRoute();
  const insets = useSafeArea();
  const { isReadOnlyWallet } = useWallets();
  const { nativeCurrency } = useAccountSettings();
  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const cTokenBalance = params['cTokenBalance'];
  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const isEmpty = params['isEmpty'];
  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const underlyingBalanceNativeValue = params['underlyingBalanceNativeValue'];
  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const underlying = params['underlying'];
  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const lifetimeSupplyInterestAccrued = params['lifetimeSupplyInterestAccrued'];
  const lifetimeSupplyInterestAccruedNative =
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    params['lifetimeSupplyInterestAccruedNative'];
  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const supplyBalanceUnderlying = params['supplyBalanceUnderlying'];
  // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
  const supplyRate = params['supplyRate'];

  const balance = convertAmountToNativeDisplay(
    underlyingBalanceNativeValue,
    nativeCurrency
  );
  const lifetimeAccruedInterest = convertAmountToNativeDisplay(
    lifetimeSupplyInterestAccruedNative,
    nativeCurrency
  );

  const savingsRowItem = useMemo(
    () => ({
      address: underlying.address,
      lifetimeSupplyInterestAccrued,
      name: underlying.name,
      supplyBalanceUnderlying,
      supplyRate,
      symbol: underlying.symbol,
    }),
    [
      lifetimeSupplyInterestAccrued,
      supplyBalanceUnderlying,
      supplyRate,
      underlying.address,
      underlying.name,
      underlying.symbol,
    ]
  );

  useEffect(() => {
    return () => {
      analytics.track('Closed Savings Sheet', {
        category: 'savings',
        empty: isEmpty,
        label: underlying.symbol,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onWithdraw = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.SAVINGS_WITHDRAW_MODAL, {
        params: {
          params: {
            cTokenBalance,
            defaultInputAsset: underlying,
            supplyBalanceUnderlying,
          },
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        },
        screen: Routes.MAIN_EXCHANGE_NAVIGATOR,
      });

      analytics.track('Navigated to SavingsWithdrawModal', {
        category: 'savings',
        label: underlying.symbol,
      });
    } else {
      watchingAlert();
    }
  }, [
    cTokenBalance,
    isReadOnlyWallet,
    navigate,
    supplyBalanceUnderlying,
    underlying,
  ]);

  const onDeposit = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.SAVINGS_DEPOSIT_MODAL, {
        params: {
          params: {
            defaultInputAsset: underlying,
          },
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        },
        screen: Routes.MAIN_EXCHANGE_NAVIGATOR,
      });

      analytics.track('Navigated to SavingsDepositModal', {
        category: 'savings',
        empty: isEmpty,
        label: underlying.symbol,
      });
    } else {
      watchingAlert();
    }
  }, [isEmpty, isReadOnlyWallet, navigate, underlying]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      deviceHeight={deviceHeight}
      height={isEmpty ? SavingsSheetEmptyHeight : SavingsSheetHeight}
      insets={insets}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StatusBar barStyle="light-content" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        additionalTopPadding={android}
        contentHeight={isEmpty ? SavingsSheetEmptyHeight : SavingsSheetHeight}
      >
        {isEmpty ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <SavingsSheetEmptyState
            isReadOnlyWallet={isReadOnlyWallet}
            supplyRate={supplyRate}
            underlying={underlying}
          />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Fragment>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SavingsSheetHeader
              balance={balance}
              lifetimeAccruedInterest={lifetimeAccruedInterest}
            />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetActionButtonRow>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <SheetActionButton
                color={isDarkMode ? colors.darkModeDark : colors.dark}
                label="􀁏 Withdraw"
                onPress={onWithdraw}
                radiusAndroid={24}
                weight="heavy"
              />
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <SheetActionButton
                color={colors.swapPurple}
                label="􀁍 Deposit"
                onPress={onDeposit}
                radiusAndroid={24}
                weight="heavy"
              />
            </SheetActionButtonRow>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Divider color={colors.rowDividerLight} zIndex={0} />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <FloatingEmojis
              disableHorizontalMovement
              distance={600}
              duration={600}
              emojis={['money_with_wings']}
              opacityThreshold={0.86}
              scaleTo={0.3}
              size={40}
              wiggleFactor={0}
            >
              {({ onNewEmoji }: any) => (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Column paddingBottom={9} paddingTop={4}>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <SavingsCoinRow
                      item={savingsRowItem}
                      key={underlying.address}
                    />
                  </Column>
                </FloatingEmojisTapHandler>
              )}
            </FloatingEmojis>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Divider color={colors.rowDividerLight} zIndex={0} />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SavingsPredictionStepper
              asset={underlying}
              balance={
                isSymbolStablecoin(underlying.symbol)
                  ? underlyingBalanceNativeValue
                  : supplyBalanceUnderlying
              }
              interestRate={supplyRate}
            />
          </Fragment>
        )}
      </SlackSheet>
    </Container>
  );
};

export default React.memo(SavingsSheet);
