import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { colors } from '../../styles';
import { OpacityToggler } from '../animations';
import { Text } from '../text';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';

const CoinDividerAssetsValue = ({
  assetsAmount,
  balancesSum,
  nativeCurrency,
  node,
  openSmallBalances,
}) => (
  <View
    style={{
      height: 30,
      justifyContent: 'center',
    }}
  >
    <OpacityToggler
      isVisible={openSmallBalances || assetsAmount === 0}
      animationNode={node}
    >
      <Text
        align="right"
        color={colors.alpha(colors.blueGreyDark, 0.6)}
        size="lmedium"
        style={{ paddingBottom: 1 }}
      >
        {convertAmountToNativeDisplay(balancesSum, nativeCurrency)}
      </Text>
    </OpacityToggler>
  </View>
);

CoinDividerAssetsValue.propTypes = {
  assetsAmount: PropTypes.number,
  balancesSum: PropTypes.string,
  nativeCurrency: PropTypes.string,
  node: PropTypes.object,
  openSmallBalances: PropTypes.bool,
};

export default CoinDividerAssetsValue;
