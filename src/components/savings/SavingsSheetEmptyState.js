import PropTypes from 'prop-types';
import React from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { colors, fonts, padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import Divider from '../Divider';
import { Centered, ColumnWithMargins } from '../layout';
import { SheetButton } from '../sheet';
import { Br, GradientText, Rounded } from '../text';

const APRHeadingTextStyle = {
  fontSize: 23,
  fontWeight: fonts.weight.semibold,
  letterSpacing: 0.6,
  lineHeight: 27,
};

const APRHeadingText = p => <Rounded {...p} style={APRHeadingTextStyle} />;

const SavingsSheetEmptyState = ({ supplyRate: baseSupplyRate, underlying }) => {
  const supplyRate = `${(baseSupplyRate * 100).toFixed(1)}%`;
  const { navigate } = useNavigation();

  return (
    <Centered direction="column" paddingTop={9}>
      <CoinIcon size={50} symbol="DAI" />
      <Centered marginBottom={12} marginTop={15}>
        <APRHeadingText>Get </APRHeadingText>
        <GradientText
          angle={114.53}
          renderer={Rounded}
          style={APRHeadingTextStyle}
        >
          {supplyRate}
        </GradientText>
        <APRHeadingText> on your dollars</APRHeadingText>
      </Centered>
      <Rounded
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        lineHeight="looser"
        size="large"
        style={{ letterSpacing: 0.6, paddingBottom: 30 }}
      >
        With digital dollars like Dai, saving <Br />
        earns you more than ever before
      </Rounded>
      <Divider inset={[0, 42]} />
      <ColumnWithMargins css={padding(19, 15)} margin={19} width="100%">
        <SheetButton
          color={colors.dodgerBlue}
          icon="plusCircled"
          label="Deposit from wallet"
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
