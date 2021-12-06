// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/config/debug' or i... Remove this comment to see the full error message
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { calculateAPY } from '../../helpers/savings';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import { CoinIcon } from '../coin-icon';
import { Centered, ColumnWithMargins } from '../layout';
import { SheetActionButton } from '../sheet';
import { Br, GradientText, Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { DAI_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo, watchingAlert } from '@rainbow-me/utils';

const APYHeadingText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  size: 'big',
  weight: 'bold',
}))``;

const BodyText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.blueGreyDark50,
  lineHeight: 'looser',
  size: 'large',
}))`
  padding-bottom: 30;
`;

const GradientAPYHeadingText = styled(GradientText).attrs({
  align: 'center',
  angle: false,
  end: { x: 1, y: 1 },
  renderer: APYHeadingText,
  start: { x: 0, y: 0 },
  steps: [0, 1],
})``;

const SavingsSheetEmptyState = ({
  isReadOnlyWallet,
  supplyRate,
  underlying,
}: any) => {
  const { navigate } = useNavigation();

  // @ts-expect-error ts-migrate(2362) FIXME: The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
  const apy = useMemo(() => Math.floor(calculateAPY(supplyRate) * 10) / 10, [
    supplyRate,
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
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet, navigate, underlying]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered direction="column" paddingTop={9}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CoinIcon address={DAI_ADDRESS} size={50} symbol="DAI" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered marginBottom={12} marginTop={15}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <APYHeadingText>Get </APYHeadingText>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <GradientAPYHeadingText>{apy}%</GradientAPYHeadingText>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <APYHeadingText> on your dollars</APYHeadingText>
      </Centered>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BodyText>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message With digital dollars like Dai, saving <Br />
        earns you more than ever before
      </BodyText>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Divider color={colors.rowDividerLight} inset={[0, 42]} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ColumnWithMargins css={padding(19, 15)} margin={19} width="100%">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SheetActionButton
          color={colors.swapPurple}
          label="􀁍 Deposit from Wallet"
          onPress={onDeposit}
          size="big"
          weight="bold"
        />
        {/*
          <SheetActionButton
            color={colors.white}
            label="Deposit with Pay"
            onPress={() => navigate(Routes.SAVINGS_DEPOSIT_MODAL)}
            size="big"
            textColor={colors.dark}
          />
        */}
      </ColumnWithMargins>
    </Centered>
  );
};

export default magicMemo(SavingsSheetEmptyState, 'isReadOnlyWallet');
