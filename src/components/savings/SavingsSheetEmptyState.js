import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { calculateAPY } from '../../helpers/savings';
import { useNavigation } from '../../navigation/Navigation';
import Divider from '../Divider';
import { CoinIcon } from '../coin-icon';
import { Centered, ColumnWithMargins } from '../layout';
import { SheetActionButton } from '../sheet';
import { Br, GradientText, Text } from '../text';
import { enableActionsOnReadOnlyWallet } from '@/config/debug';
import { DAI_ADDRESS } from '@/references';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { magicMemo, watchingAlert } from '@/utils';

const APYHeadingText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  size: 'big',
  weight: 'bold',
}))({});

const BodyText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.blueGreyDark50,
  lineHeight: 'looser',
  size: 'large',
}))({
  paddingBottom: 30,
});

const GradientAPYHeadingText = styled(GradientText).attrs({
  align: 'center',
  angle: false,
  end: { x: 1, y: 1 },
  renderer: APYHeadingText,
  start: { x: 0, y: 0 },
  steps: [0, 1],
})({});

const css = padding.object(19, 15);

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
            inputAsset: underlying,
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
        <APYHeadingText>{lang.t('savings.get_prefix')} </APYHeadingText>
        <GradientAPYHeadingText>
          {lang.t('savings.percentage', { percentage: apy })}
        </GradientAPYHeadingText>
        <APYHeadingText>
          {' '}
          {lang.t('savings.on_your_dollars_suffix')}
        </APYHeadingText>
      </Centered>
      <BodyText>
        {lang.t('savings.with_digital_dollars_line_1')} <Br />
        {lang.t('savings.with_digital_dollars_line_2')}
      </BodyText>
      <Divider color={colors.rowDividerLight} inset={[0, 42]} />
      <ColumnWithMargins margin={19} style={css} width="100%">
        <SheetActionButton
          color={colors.swapPurple}
          label={`􀁍 ${lang.t('savings.deposit_from_wallet')}`}
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
