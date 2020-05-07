import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { calculateAPY } from '../../helpers/savings';
import Routes from '../../screens/Routes/routesNames';
import { colors, fonts, padding } from '../../styles';
import Divider from '../Divider';
import { CoinIcon } from '../coin-icon';
import { Centered, ColumnWithMargins } from '../layout';
import { SheetButton } from '../sheet';
import { Br, GradientText, Text } from '../text';

const APYHeadingTextStyle = {
  fontSize: parseFloat(fonts.size.big),
  fontWeight: fonts.weight.bold,
};

const APYHeadingText = p => <Text {...p} style={APYHeadingTextStyle} />;

const SavingsSheetEmptyState = ({
  isReadOnlyWallet,
  supplyRate,
  underlying,
}) => {
  const apy = useMemo(() => calculateAPY(supplyRate), [supplyRate]);
  const apyTruncated = Math.floor(apy * 10) / 10;
  const { navigate } = useNavigation();
  const onDeposit = useCallback(() => {
    if (!isReadOnlyWallet) {
      navigate(Routes.SAVINGS_DEPOSIT_MODAL, {
        defaultInputAsset: underlying,
      });
    } else {
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [isReadOnlyWallet, navigate, underlying]);

  return (
    <Centered direction="column" paddingTop={9}>
      <CoinIcon size={50} symbol="DAI" />
      <Centered marginBottom={12} marginTop={15}>
        <APYHeadingText>Get </APYHeadingText>
        <GradientText
          align="center"
          angle={false}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          steps={[0, 1]}
          renderer={Text}
          style={APYHeadingTextStyle}
        >
          {apyTruncated}%
        </GradientText>
        <APYHeadingText> on your dollars</APYHeadingText>
      </Centered>
      <Text
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        lineHeight="looser"
        size="large"
        style={{ paddingBottom: 30 }}
      >
        With digital dollars like Dai, saving <Br />
        earns you more than ever before
      </Text>
      <Divider color={colors.rowDividerLight} inset={[0, 42]} />
      <ColumnWithMargins css={padding(19, 15)} margin={19} width="100%">
        <SheetButton
          color={colors.swapPurple}
          label="􀁍 Deposit from Wallet"
          onPress={onDeposit}
        />
        {/*
          <SheetButton
            color={colors.white}
            label="Deposit with Pay"
            onPress={() => navigate('SavingsDepositModal')}
            textColor={colors.dark}
          />
        */}
      </ColumnWithMargins>
    </Centered>
  );
};

SavingsSheetEmptyState.propTypes = {
  isReadOnlyWallet: PropTypes.bool,
  supplyRate: PropTypes.string,
  underlying: PropTypes.object,
};

const arePropsEqual = (props, nextProps) => {
  return props.isReadOnlyWallet === nextProps.isReadOnlyWallet;
};
export default React.memo(SavingsSheetEmptyState, arePropsEqual);
