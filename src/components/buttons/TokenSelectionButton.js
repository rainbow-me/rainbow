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
  ${padding(9.5, 14, 11, 15)};
  z-index: 1;
`;

const CaretIcon = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
  source: CaretImageSource,
  tintColor: colors.white,
})`
  height: 17;
  right: -0.5;
  width: 9;
`;

const TokenSelectionButton = ({ borderRadius, onPress, shadows, symbol }) => (
  <ButtonPressAnimation onPress={onPress}>
    <Row accessible css={margin(0, 15)}>
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={symbol ? colors.dark : colors.appleBlue}
        borderRadius={borderRadius}
        shadows={shadows}
      />
      <Content>
        <Text color={colors.white} size="lmedium" weight="semibold">
          {symbol || 'Choose a Coin'}
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
  borderRadius: 20,
  shadows: [
    [0, 2, 5, colors.dark, 0.15],
    [0, 6, 10, colors.dark, 0.14],
    [0, 1, 18, colors.dark, 0.08],
  ],
};

export default magicMemo(TokenSelectionButton, [
  'onPress',
  'showLockIcon',
  'symbol',
]);
