import PropTypes from 'prop-types';
import React from 'react';
import stylePropType from 'react-style-proptype';
import {
  compose, withHandlers, withProps, shouldUpdate
} from 'recompact';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import InnerBorder from '../InnerBorder';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import UniqueTokenImage from './UniqueTokenImage';
import Highlight from '../Highlight';
import { withFabSendAction } from '../../hoc';

const UniqueTokenCardBorderRadius = 16;

const Shadow = styled(Highlight)`
  background-color: ${({ highlight }) => (highlight ? '#FFFFFF33' : colors.transparent)};
`;

const UniqueTokenCard = ({
  disabled,
  height,
  item: {
    background,
    image_preview_url,
    ...item
  },
  onPress,
  size,
  highlight,
  resizeMode,
  shadows,
  style,
  width,
  ...props
}) => {
  const backgroundColor = background || colors.lightestGrey;
  return (
    <ButtonPressAnimation
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.96}
    >
      <ShadowStack
        {...props}
        backgroundColor={backgroundColor}
        borderRadius={UniqueTokenCardBorderRadius}
        height={height}
        shadows={shadows}
        style={style}
        width={width}
      >
        <Centered
          style={{
            ...position.coverAsObject,
            backgroundColor,
            borderRadius: UniqueTokenCardBorderRadius,
          }}
        >
          <UniqueTokenImage
            backgroundColor={backgroundColor}
            resizeMode={resizeMode}
            imageUrl={image_preview_url} // eslint-disable-line camelcase
            item={item}
          />
          <InnerBorder
            opacity={0.04}
            radius={UniqueTokenCardBorderRadius}
          />
          <Shadow highlight={highlight}/>
        </Centered>
      </ShadowStack>
    </ButtonPressAnimation>
  );
};

UniqueTokenCard.propTypes = {
  disabled: PropTypes.bool,
  height: PropTypes.number,
  highlight: PropTypes.bool,
  item: PropTypes.shape({
    background: PropTypes.string,
    // eslint-disable-next-line camelcase
    image_preview_url: PropTypes.string,
  }),
  onPress: PropTypes.func,
  resizeMode: UniqueTokenImage.propTypes.resizeMode,
  shadows: PropTypes.array,
  size: PropTypes.number,
  style: stylePropType,
  width: PropTypes.number,
};

UniqueTokenCard.defaultProps = {
  shadows: [
    [0, 3, 5, colors.black, 0.04],
    [0, 6, 10, colors.black, 0.04],
  ],
};


export default compose(
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
  }),
  withProps(({ item: { uniqueId } }) => ({ uniqueId })),
  withFabSendAction,
  shouldUpdate((props, nextProps) => {
    const isNewHeight = isNewValueForPath(props, nextProps, 'height');
    const isNewUniqueId = isNewValueForPath(props, nextProps, 'uniqueId');
    const isNewWidth = isNewValueForPath(props, nextProps, 'height');
    const isNewHighlight = isNewValueForPath(props, nextProps, 'highlight');

    return isNewHeight || isNewUniqueId || isNewWidth || isNewHighlight;
  }),
)(UniqueTokenCard);
