import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { calculateAPY } from '../../helpers/savings';
import { useNavigation } from '../../navigation/Navigation';
import Divider from '../Divider';
import { CoinIcon } from '../coin-icon';
import { Centered, ColumnWithMargins } from '../layout';
import { SheetActionButton } from '../sheet';
import { Br, GradientText, Text } from '../text';
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
import { DAI_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';
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
}) => {
  const { navigate } = useNavigation();

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

  const { colors } = useTheme();

  return (
    <Centered direction="column" paddingTop={9}>
      <CoinIcon address={DAI_ADDRESS} size={50} symbol="DAI" />
      <Centered marginBottom={12} marginTop={15}>
        <APYHeadingText>Get </APYHeadingText>
        <GradientAPYHeadingText>{apy}%</GradientAPYHeadingText>
        <APYHeadingText> on your dollars</APYHeadingText>
      </Centered>
      <BodyText>
        With digital dollars like Dai, saving <Br />
        earns you more than ever before
      </BodyText>
      <Divider color={colors.rowDividerLight} inset={[0, 42]} />
      <ColumnWithMargins css={padding(19, 15)} margin={19} width="100%">
        <SheetActionButton
          color={colors.swapPurple}
          fullWidth
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
