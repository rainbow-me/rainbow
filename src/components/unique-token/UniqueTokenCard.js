import PropTypes from 'prop-types';
import React from 'react';
import stylePropType from 'react-style-proptype';
import { compose, onlyUpdateForKeys, withHandlers, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { withFabSendAction } from '../../hoc';
import { colors, shadow } from '../../styles';
import Highlight from '../Highlight';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import UniqueTokenImage from './UniqueTokenImage';

const UniqueTokenCardBorderRadius = 18;

const Container = styled(ButtonPressAnimation)`
  ${shadow.build(0, 2, 3, colors.dark, 0.08)};
`;

const Content = styled.View`
  border-radius: ${UniqueTokenCardBorderRadius};
  height: ${({ height }) => height};
  overflow: hidden;
  width: ${({ width }) => width};
`;

const UniqueTokenCard = ({
  borderEnabled,
  disabled,
  enableHapticFeedback,
  height,
  highlight,
  item: { background, image_preview_url, ...item },
  onPress,
  resizeMode,
  scaleTo,
  shadowStyle,
  style,
  width,
  ...props
}) => {
  return (
    <Container
      disabled={disabled}
      enableHapticFeedback={enableHapticFeedback}
      onPress={onPress}
      scaleTo={scaleTo}
      style={shadowStyle}
    >
      <Content {...props} height={height} style={style} width={width}>
        <UniqueTokenImage
          backgroundColor={background || colors.lightestGrey}
          imageUrl={image_preview_url}
          item={item}
          resizeMode={resizeMode}
        />
        {borderEnabled && (
          <InnerBorder
            opacity={0.04}
            radius={UniqueTokenCardBorderRadius}
            width={0.5}
          />
        )}
        <Highlight
          backgroundColor={colors.alpha(colors.white, 0.33)}
          visible={highlight}
        />
      </Content>
    </Container>
  );
};

UniqueTokenCard.propTypes = {
  borderEnabled: PropTypes.bool,
  disabled: PropTypes.bool,
  enableHapticFeedback: PropTypes.bool,
  height: PropTypes.number,
  highlight: PropTypes.bool,
  item: PropTypes.shape({
    background: PropTypes.string,
    image_preview_url: PropTypes.string,
  }),
  onPress: PropTypes.func,
  resizeMode: PropTypes.string,
  scaleTo: PropTypes.number,
  shadowStyle: stylePropType,
  size: PropTypes.number,
  style: stylePropType,
  width: PropTypes.number,
};

UniqueTokenCard.defaultProps = {
  borderEnabled: true,
  enableHapticFeedback: true,
  scaleTo: 0.96,
};

export default compose(
  withFabSendAction,
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
  }),
  withProps(({ item: { uniqueId } }) => ({ uniqueId })),
  onlyUpdateForKeys(['height', 'highlight', 'style', 'uniqueId', 'width'])
)(UniqueTokenCard);
