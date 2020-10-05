import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, Row, RowWithMargins } from '../layout';
import { Text } from '../text';
import { colors, margin, padding, position } from '@rainbow-me/styles';

const Content = styled(RowWithMargins).attrs({ align: 'center', margin: 7 })`
  ${padding(11, 14, 14, 16)};
  height: 46;
  z-index: 1;
`;

const CaretIcon = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
  source: CaretImageSource,
  tintColor: colors.white,
})`
  height: 17;
  right: -0.5;
  top: 0.5;
  width: 9;
`;

const ButtonShadows = styled(ShadowStack).attrs(({ symbol }) => ({
  shadows: [
    [0, 10, 30, colors.dark, 0.2],
    [0, 5, 15, symbol ? colors.dark : colors.appleBlue, 0.4],
  ],
}))``;

const TokenSelectionButton = ({
  borderRadius,
  onPress,
  shadows,
  symbol,
  testID,
}) => (
  <ButtonPressAnimation onPress={onPress} testID={testID} throttle>
    <Row accessible css={margin(0, 19)}>
      <ButtonShadows
        {...position.coverAsObject}
        backgroundColor={symbol ? colors.dark : colors.appleBlue}
        borderRadius={borderRadius}
        shadows={shadows}
        symbol={symbol}
      />
      <Content>
        <Text
          align="center"
          color={colors.white}
          size="large"
          testID={testID + '-text'}
          weight="bold"
        >
          {symbol || 'Choose Token'}
        </Text>
        <CaretIcon />
      </Content>
      <InnerBorder radius={borderRadius} />
    </Row>
  </ButtonPressAnimation>
);

TokenSelectionButton.propTypes = {
  borderRadius: PropTypes.number,
  onPress: PropTypes.func,
  shadows: PropTypes.arrayOf(PropTypes.array),
  showLockIcon: PropTypes.bool,
  symbol: PropTypes.string,
};

TokenSelectionButton.defaultProps = {
  borderRadius: 30,
};

export default magicMemo(TokenSelectionButton, [
  'onPress',
  'showLockIcon',
  'symbol',
]);
