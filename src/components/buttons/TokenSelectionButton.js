import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import ShadowStack from 'react-native-shadow-stack';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { colors, margin, padding, position } from '../../styles';
import { isNewValueForObjectPaths } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, Row } from '../layout';
import { Text } from '../text';

const TokenSelectionButton = ({ borderRadius, onPress, shadows, symbol }) => {
  return (
    <ButtonPressAnimation onPress={onPress}>
      <Row accessible flex={0} css={margin(0, 15)}>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={symbol ? colors.dark : colors.appleBlue}
          borderRadius={borderRadius}
          shadows={shadows}
        />
        <Row align="center" css={padding(9.5, 14, 11, 15)} zIndex={1}>
          <Text
            color={colors.white}
            size="lmedium"
            style={{
              marginLeft: 0,
              marginRight: 7,
            }}
            weight="semibold"
          >
            {symbol || 'Choose a Coin'}
          </Text>
          <FastImage
            resizeMode={FastImage.resizeMode.contain}
            source={CaretImageSource}
            style={{
              height: 17,
              right: -0.5,
              width: 9,
            }}
            tintColor={colors.white}
          />
        </Row>
        <InnerBorder radius={borderRadius} />
      </Row>
    </ButtonPressAnimation>
  );
};

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

const arePropsEqual = (...props) =>
  !isNewValueForObjectPaths(...props, ['onPress', 'showLockIcon', 'symbol']);

export default React.memo(TokenSelectionButton, arePropsEqual);
