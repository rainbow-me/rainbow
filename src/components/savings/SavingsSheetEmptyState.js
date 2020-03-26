import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { calculateAPY } from '../../helpers/savings';
import { colors, fonts, padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import Divider from '../Divider';
import { Centered, ColumnWithMargins } from '../layout';
import { SheetButton } from '../sheet';
import { Br, GradientText, Text } from '../text';

const APRHeadingTextStyle = {
  fontSize: parseFloat(fonts.size.big),
  fontWeight: fonts.weight.bold,
};

const APRHeadingText = p => <Text {...p} style={APRHeadingTextStyle} />;

const SavingsSheetEmptyState = ({ supplyRate: baseSupplyRate, underlying }) => {
  const apy = useMemo(() => calculateAPY(baseSupplyRate), [baseSupplyRate]);
  const { navigate } = useNavigation();

  return (
    <Centered direction="column" paddingTop={9}>
      <CoinIcon size={50} symbol="DAI" />
      <Centered marginBottom={12} marginTop={15}>
        <APRHeadingText>Get </APRHeadingText>
        <GradientText
          angle={114.53}
          renderer={Text}
          style={APRHeadingTextStyle}
        >
          {apy}%
        </GradientText>
        <APRHeadingText> on your dollars</APRHeadingText>
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
          icon="plusCircled"
          label="Deposit from Wallet"
          onPress={() =>
            navigate('SavingsDepositModal', {
              defaultInputAsset: underlying,
            })
          }
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
  supplyRate: PropTypes.string,
  underlying: PropTypes.object,
};

const neverRerender = () => true;
export default React.memo(SavingsSheetEmptyState, neverRerender);
