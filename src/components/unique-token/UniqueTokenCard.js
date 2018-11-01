import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { View } from 'react-native';
import { ButtonPressAnimation } from '../buttons';
import { colors, position, shadow } from '../../styles';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import UniqueTokenImage from './UniqueTokenImage';

const UniqueTokenCardBorderRadius = 16;

const Container = styled(Centered)`
  ${position.cover}
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: ${UniqueTokenCardBorderRadius};
`;

const InnerBorder = styled.View`
  ${position.cover}
  border-color: ${shadow.color}
  border-radius: ${UniqueTokenCardBorderRadius};
  border-width: 0.68;
`;

const UniqueTokenCard = ({
  item: {
    background,
    imagePreviewUrl,
    ...item
  },
  size,
  onPress,
  ...props
}) => {
  const backgroundColor = background || colors.lightestGrey;

  return (
    <ShadowStack
      {...props}
      {...position.sizeAsObject(size)}
      borderRadius={UniqueTokenCardBorderRadius}
      shadows={[
        shadow.buildString(0, 3, 5, 'rgba(0,0,0,0.1)'),
        shadow.buildString(0, 6, 10, 'rgba(0,0,0,0.1)'),
      ]}
    >
      <Container
        backgroundColor={backgroundColor}
        component={onPress ? ButtonPressAnimation : View}
        onPress={() => onPress && onPress(item.name)}
      >
        <UniqueTokenImage
          backgroundColor={backgroundColor}
          imageUrl={imagePreviewUrl}
          item={item}
          size={size}
        />
        <InnerBorder />
      </Container>
    </ShadowStack>
  );
};

UniqueTokenCard.propTypes = {
  item: PropTypes.shape({
    background: PropTypes.string,
    imagePreviewUrl: PropTypes.string,
  }),
  onPress: PropTypes.func,
  size: PropTypes.number,
};

export default pure(UniqueTokenCard);
