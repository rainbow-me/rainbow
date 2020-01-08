import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { onlyUpdateForKeys, withProps } from 'recompact';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { colors, margin, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import InnerBorder from '../InnerBorder';
import { Row, RowWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';

const CoolLabel = withProps({
  color: 'white',
  flex: 1,
  size: 'lmedium',
  weight: 'semibold',
})(Text);

const enhance = onlyUpdateForKeys(['children', 'color']);

const CoolButton = enhance(
  ({ borderRadius, children, color, onPress, shadows }) => (
    <ButtonPressAnimation onPress={onPress}>
      <Row flex={0} css={margin(0, 15)}>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={color}
          borderRadius={borderRadius}
          shadows={shadows}
        />
        <RowWithMargins
          align="center"
          css={padding(9.5, 14, 11, 15)}
          margin={7}
          zIndex={1}
        >
          <CoolLabel>{children}</CoolLabel>
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
        </RowWithMargins>
        <InnerBorder radius={borderRadius} />
      </Row>
    </ButtonPressAnimation>
  )
);

CoolButton.propTypes = {
  borderRadius: PropTypes.number,
  children: PropTypes.node,
  color: PropTypes.string,
  onPress: PropTypes.func,
  shadows: PropTypes.arrayOf(PropTypes.array),
};

CoolButton.defaultProps = {
  borderRadius: 20,
  shadows: [
    [0, 2, 5, colors.dark, 0.15],
    [0, 6, 10, colors.dark, 0.14],
    [0, 1, 18, colors.dark, 0.08],
  ],
};

export default CoolButton;
